// Draws the breathing guide on a canvas: either the shape view or the wave view.
const Visual = (() => {
    let colors = {};

    // Re-read the theme colours (call after the theme changes).
    function readColors() {
        const css = getComputedStyle(document.body);
        const v = name => css.getPropertyValue(name).trim();
        colors = { accent: v('--accent'), hold: v('--hold'), ball: v('--ball'), text: v('--text'), faint: v('--faint') };
    }

    // Matches the canvas's pixel size to its on-screen size; returns the size in CSS pixels.
    function fit(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const r = canvas.getBoundingClientRect();
        const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, r.width, r.height);
        return { ctx, w: r.width, h: r.height };
    }

    function withAlpha(color, alpha) {
        // works for #rrggbb colours, which is what the themes use
        const n = parseInt(color.slice(1), 16);
        return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
    }

    const edgeColor = kind => (kind === 'holdIn' || kind === 'holdOut' ? colors.hold : colors.accent);

    // ---------- shape view ----------

    // Converts shape coordinates (x sideways, y = lung level 0..1) into canvas positions.
    function polyMapper(shape, box) {
        const w = Math.max(0.01, shape.maxX - shape.minX);
        // keep very wide or very narrow shapes readable
        const ratio = Math.min(2, Math.max(0.5, w));
        const sx = ratio / w;
        const size = Math.min(box.w * 0.8 / (w * sx), box.h * 0.8, 320 / Math.max(ratio, 1));
        const midX = (shape.minX + shape.maxX) / 2;
        return ([x, y]) => [box.x + box.w / 2 + (x - midX) * sx * size, box.y + box.h / 2 + (0.5 - y) * size];
    }

    function loopGeometry(box) {
        const r = Math.min(box.w, box.h) * 0.38;
        return { cx: box.x + box.w / 2, cy: box.y + box.h / 2, r: Math.min(r, 160) };
    }

    // angle on the loop: starts at the bottom and goes up the left side first
    const loopAngle = frac => Math.PI / 2 + frac * 2 * Math.PI;

    // Position of the dot for a step of a cycle at a given progress (0..1).
    function shapePoint(step, prog, box) {
        const shape = step.shape;
        if (shape.type === 'loop') {
            const g = loopGeometry(box);
            const [a, b] = shape.arcs[step.edge];
            const ang = loopAngle(a + (b - a) * prog);
            return [g.cx + g.r * Math.cos(ang), g.cy + g.r * Math.sin(ang)];
        }
        const map = polyMapper(shape, box);
        const [p0, p1] = step.shape.edges[step.edge];
        const a = map(p0), b = map(p1);
        return [a[0] + (b[0] - a[0]) * prog, a[1] + (b[1] - a[1]) * prog];
    }

    // activeEdge: the side to highlight, or -1 for none
    function drawShape(ctx, box, shape, activeEdge, dot, trail, lineWidth = 3) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;

        if (shape.type === 'loop') {
            const g = loopGeometry(box);
            shape.arcs.forEach(([a, b], i) => {
                const gap = shape.arcs.length > 1 ? 0.012 : 0;
                ctx.beginPath();
                ctx.arc(g.cx, g.cy, g.r, loopAngle(a + gap), loopAngle(b - gap));
                ctx.strokeStyle = withAlpha(edgeColor(shape.kinds[i]), i === activeEdge ? 0.95 : 0.28);
                ctx.stroke();
            });
        } else {
            const map = polyMapper(shape, box);
            shape.edges.forEach(([p0, p1], i) => {
                const a = map(p0), b = map(p1);
                if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.5) return;
                ctx.beginPath();
                ctx.moveTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
                ctx.strokeStyle = withAlpha(edgeColor(shape.kinds[i]), i === activeEdge ? 0.95 : 0.28);
                ctx.stroke();
            });
        }

        if (trail) {
            trail.forEach((p, i) => {
                const a = (i + 1) / trail.length;
                ctx.beginPath();
                ctx.arc(p[0], p[1], 2 + 4 * a, 0, Math.PI * 2);
                ctx.fillStyle = withAlpha(colors.ball, 0.28 * a);
                ctx.fill();
            });
        }
        if (dot) drawDot(ctx, dot[0], dot[1], lineWidth > 2 ? 9 : 6);
    }

    function drawDot(ctx, x, y, r) {
        ctx.save();
        ctx.shadowColor = colors.ball;
        ctx.shadowBlur = r * 2.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors.ball;
        ctx.fill();
        ctx.restore();
    }

    // ---------- wave view ----------
    // A line of lung level over time scrolls past a fixed dot: the part ahead shows what's coming.

    function drawWave(ctx, box, levelAt, t, windowSecs) {
        const pps = box.w / windowSecs;
        const dotX = box.x + box.w * 0.3;
        const h = Math.min(box.h * 0.5, 230);
        const top = box.y + (box.h - h) / 2;
        const yFor = level => top + (1 - level) * h;

        // faint guides for empty and full
        ctx.lineWidth = 1;
        ctx.strokeStyle = withAlpha(colors.text, 0.06);
        [0, 1].forEach(l => {
            ctx.beginPath();
            ctx.moveTo(box.x, yFor(l));
            ctx.lineTo(box.x + box.w, yFor(l));
            ctx.stroke();
        });

        const pts = [];
        for (let x = box.x; x <= box.x + box.w + 3; x += 3) {
            pts.push([x, yFor(levelAt(t + (x - dotX) / pps))]);
        }
        const split = pts.findIndex(p => p[0] >= dotX);

        // soft fill under the part still to come
        const grad = ctx.createLinearGradient(0, top, 0, top + h);
        grad.addColorStop(0, withAlpha(colors.accent, 0.16));
        grad.addColorStop(1, withAlpha(colors.accent, 0));
        ctx.beginPath();
        ctx.moveTo(pts[split][0], top + h);
        for (let i = split; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[pts.length - 1][0], top + h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        [[0, split + 1, 0.3], [split, pts.length, 0.95]].forEach(([from, to, alpha]) => {
            ctx.beginPath();
            for (let i = from; i < to; i++) {
                if (i === from) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
            }
            ctx.strokeStyle = withAlpha(colors.accent, alpha);
            ctx.stroke();
        });

        drawDot(ctx, dotX, yFor(levelAt(t)), 9);
    }

    return { readColors, fit, drawShape, drawWave, shapePoint };
})();
