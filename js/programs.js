// Breathing programs: the techniques, custom patterns, the step timeline, and the shape of each cycle.
//
// A program is a list of steps. Each step has a kind:
//   in, top (an extra sip of air), holdIn (hold with full lungs), out, holdOut (hold with empty lungs)
// plus its length in seconds and the lung level it goes from and to (0 = empty, 1 = full).
// Repeating programs give a `cycle`; programs with a fixed end (Wim Hof) give a `list`.
const Programs = (() => {
    const LABELS = { in: 'Breathe in', top: 'Sip in more', holdIn: 'Hold', out: 'Breathe out', holdOut: 'Hold' };

    const TECHNIQUES = {
        sigh: {
            name: 'Cyclic sighing',
            tagline: 'The quickest way to calm down',
            intro: 'Two breaths in through the nose, a long one then a short extra sip, followed by a long, slow breath out. In a 2023 Stanford study, five minutes a day lifted mood more than meditation.',
            steps: [
                'Breathe in through your nose until your lungs are nearly full.',
                'Take a short second sip of air through your nose to fill them completely.',
                'Breathe out slowly through your mouth until your lungs are empty.',
                'Keep going for about five minutes.'
            ],
            note: 'Every pace keeps the breath out about twice as long as the two breaths in. That long, slow exhale is what calms you down.',
            controls: [
                { key: 'pace', label: 'Pace', options: [['quick', 'Quick'], ['steady', 'Steady'], ['slow', 'Slow'], ['deep', 'Deep']] }
            ],
            describe: p => {
                const s = sighTimes(p);
                return `Breathe in ${fmt(s.inhale)} s, sip ${fmt(s.top)} s, breathe out ${fmt(s.exhale)} s`;
            },
            summary: p => {
                const s = sighTimes(p);
                return `${fmt(s.inhale)} + ${fmt(s.top)} · ${fmt(s.exhale)}`;
            }
        },
        box: {
            name: 'Box breathing',
            tagline: 'Focus and steady nerves',
            intro: 'Four equal sides: breathe in, hold, breathe out, hold. Used by athletes, first responders and the US Navy SEALs to stay calm and clear under pressure.',
            steps: [
                'Breathe in through your nose.',
                'Hold with your lungs full.',
                'Breathe out slowly.',
                'Hold with your lungs empty, then begin again.'
            ],
            note: 'New to it? Start with 3 seconds per side. Comfortable? Try 5 or 6.',
            controls: [
                { key: 'count', label: 'Each side', min: 2, max: 10, step: 0.5, unit: 's' }
            ],
            summary: p => `${fmt(p.count)} s`
        },
        wimhof: {
            name: 'Wim Hof',
            tagline: 'Energise and reset',
            intro: 'Rounds of deep, quick breaths, then a hold on empty lungs for as long as feels comfortable, then a deep recovery breath. Many people feel energised and clear-headed afterwards.',
            caution: 'Always sit or lie down. Never practise in or near water, while driving, or anywhere fainting could be dangerous. Tingling and light-headedness are common; stop if you feel unwell. If you are pregnant or have epilepsy, heart problems or high blood pressure, ask a doctor first.',
            steps: [
                'Breathe in fully, then let the air go without forcing it out. Follow the rhythm.',
                'After the last breath, breathe out and hold with empty lungs. Tap “Breathe in” when you need air.',
                'Take a deep breath in and hold it for 15 seconds, then let go. That is one round.'
            ],
            note: 'Your hold times are shown at the end.',
            controls: [
                { key: 'breaths', label: 'Breaths', min: 20, max: 50, step: 5, unit: '' },
                { key: 'rounds', label: 'Rounds', min: 1, max: 5, step: 1, unit: '' },
                { key: 'pace', label: 'Pace', options: [['slow', 'Slow'], ['medium', 'Medium'], ['fast', 'Fast']] }
            ],
            summary: p => `${p.rounds} ${p.rounds === 1 ? 'round' : 'rounds'}`
        }
    };

    const QUICK_PATTERNS = [
        { id: 'coherent', name: 'Coherent', pattern: [5.5, 0, 5.5, 0] },
        { id: 'relax', name: 'Relax', pattern: [4, 0, 6, 0] },
        { id: '478', name: '4-7-8', pattern: [4, 7, 8, 0] },
        { id: 'tactical', name: 'Tactical', pattern: [4, 2, 4, 2] },
        { id: 'triangle', name: 'Triangle', pattern: [4, 4, 4, 0] }
    ];

    const PACE_SECONDS = { slow: 3.5, medium: 2.6, fast: 1.9 };

    // Cyclic sighing paces: the breath out is always twice the two breaths in combined.
    const SIGH_PACES = {
        quick: { inhale: 1.5, top: 0.5, exhale: 4 },
        steady: { inhale: 2, top: 1, exhale: 6 },
        slow: { inhale: 3, top: 1, exhale: 8 },
        deep: { inhale: 4, top: 1, exhale: 10 }
    };
    function sighTimes(p) { return SIGH_PACES[p.pace] || SIGH_PACES.steady; }
    const RECOVERY_HOLD = 15;

    function fmt(n) { return String(Math.round(n * 10) / 10); }

    // Fills in from/to lung levels and labels, and attaches the shape the steps make together.
    function finishCycle(steps) {
        let level = 0;
        steps.forEach((s, i) => {
            s.from = level;
            if (s.kind === 'in') s.to = steps[i + 1] && steps[i + 1].kind === 'top' ? 0.72 : 1;
            else if (s.kind === 'top') s.to = 1;
            else if (s.kind === 'out') s.to = 0;
            else s.to = level;
            level = s.to;
            s.label = s.label || LABELS[s.kind];
            s.cueKind = s.cueKind || s.kind;
        });
        const shape = buildShape(steps);
        steps.forEach((s, i) => { s.shape = shape; s.edge = i; });
        return steps;
    }

    function cycleFromPattern(p) {
        const kinds = ['in', 'holdIn', 'out', 'holdOut'];
        return finishCycle(kinds.map((kind, i) => ({ kind, secs: p[i] })).filter(s => s.secs > 0));
    }

    // Returns { cycle } or { list } for the chosen technique.
    function build(settings) {
        const t = settings.technique;
        if (t === 'sigh') {
            const p = sighTimes(settings.sigh);
            return {
                cycle: finishCycle([
                    { kind: 'in', secs: p.inhale },
                    { kind: 'top', secs: p.top },
                    { kind: 'out', secs: p.exhale, label: 'Breathe out slowly' }
                ])
            };
        }
        if (t === 'box') {
            const c = settings.box.count;
            return { cycle: cycleFromPattern([c, c, c, c]) };
        }
        if (t === 'wimhof') return buildWimHof(settings.wimhof);
        return { cycle: cycleFromPattern(settings.custom.pattern) };
    }

    function buildWimHof(p) {
        const pace = PACE_SECONDS[p.pace] || PACE_SECONDS.medium;
        const list = [];
        for (let r = 1; r <= p.rounds; r++) {
            for (let b = 1; b <= p.breaths; b++) {
                const pair = finishCycle([
                    { kind: 'in', secs: pace * 0.55, cueKind: 'powerIn' },
                    { kind: 'out', secs: pace * 0.45, cueKind: 'powerOut', label: 'Let go' }
                ]);
                pair.forEach(s => { s.count = `${b} / ${p.breaths}`; s.round = r; });
                list.push(...pair);
            }
            const recovery = finishCycle([
                // the hold on empty lungs lasts until the person taps "Breathe in"
                { kind: 'holdOut', secs: Infinity, vis: RECOVERY_HOLD, open: true, cueKind: 'retain', label: 'Hold, lungs empty' },
                { kind: 'in', secs: 2, label: 'Deep breath in' },
                { kind: 'holdIn', secs: RECOVERY_HOLD },
                { kind: 'out', secs: 2.5, label: 'Let go' }
            ]);
            recovery.forEach(s => { s.round = r; });
            list.push(...recovery);
        }
        return { list, rounds: p.rounds };
    }

    // ---------- timeline: steps laid out in time ----------

    const easeInOutSine = x => -(Math.cos(Math.PI * x) - 1) / 2;
    const isBreath = s => s.kind === 'in' || s.kind === 'top' || s.kind === 'out';

    function timeline(program) {
        const steps = [];

        function generate(i) {
            if (program.cycle) return { ...program.cycle[i % program.cycle.length] };
            return program.list[i] ? { ...program.list[i] } : null;
        }

        function extend() {
            const prev = steps[steps.length - 1];
            if (prev && !isFinite(prev.secs)) return false; // can't see past an open-ended hold
            const s = generate(steps.length);
            if (!s) return false;
            s.start = prev ? prev.start + prev.secs : 0;
            s.index = steps.length;
            steps.push(s);
            return true;
        }

        // The step running at time t, or null once a finite program is over.
        function stepAt(t) {
            if (!steps.length && !extend()) return null;
            if (t < 0) return steps[0];
            for (;;) {
                const last = steps[steps.length - 1];
                if (last.start + last.secs > t) break;
                if (!extend()) return null;
            }
            let lo = 0, hi = steps.length - 1;
            while (lo < hi) {
                const mid = (lo + hi + 1) >> 1;
                if (steps[mid].start <= t) lo = mid; else hi = mid - 1;
            }
            return steps[lo];
        }

        // 0..1 progress through a step, eased for breaths so movement feels natural
        function progress(step, t) {
            if (!isFinite(step.secs)) return 0;
            const x = Math.min(1, Math.max(0, (t - step.start) / step.secs));
            return isBreath(step) ? easeInOutSine(x) : x;
        }

        function levelAt(t) {
            if (t < 0) return 0;
            const s = stepAt(t);
            if (!s) return 0;
            return s.from + (s.to - s.from) * progress(s, t);
        }

        // Ends an open-ended hold at time t.
        function close(step, t) {
            step.secs = Math.max(0.5, t - step.start);
        }

        return { stepAt, progress, levelAt, close };
    }

    function cycleSeconds(program) {
        if (!program.cycle) return 10;
        return program.cycle.reduce((a, s) => a + s.secs, 0);
    }

    // ---------- shapes ----------
    // The dot rises while breathing in, falls while breathing out and moves sideways while holding,
    // so the timings draw the shape: equal steps make a square, unequal holds a rectangle,
    // one hold a triangle. Patterns with no holds go around a loop instead.

    function buildShape(steps) {
        const hasHold = steps.some(s => s.kind === 'holdIn' || s.kind === 'holdOut');
        const vis = s => (isFinite(s.secs) ? s.secs : s.vis);
        if (!hasHold) {
            const total = steps.reduce((a, s) => a + vis(s), 0);
            let acc = 0;
            const arcs = steps.map(s => {
                const a = acc / total;
                acc += vis(s);
                return [a, acc / total];
            });
            return { type: 'loop', arcs, kinds: steps.map(s => s.kind) };
        }
        const inSecs = steps.filter(s => s.kind === 'in' || s.kind === 'top').reduce((a, s) => a + vis(s), 0) || 1;
        const width = s => vis(s) / inSecs;
        const topHolds = steps.filter(s => s.kind === 'holdIn').reduce((a, s) => a + width(s), 0);
        const bottomHolds = steps.filter(s => s.kind === 'holdOut').reduce((a, s) => a + width(s), 0);
        let x = 0, y = steps[0].from;
        const edges = steps.map(s => {
            const p0 = [x, y];
            if (s.kind === 'holdIn') x += width(s);
            else if (s.kind === 'holdOut') x -= width(s);
            else if (s.kind === 'out') x += bottomHolds - topHolds; // whatever closes the shape
            y = s.to;
            return [p0, [x, y]];
        });
        const xs = edges.flat().map(p => p[0]);
        return { type: 'poly', edges, kinds: steps.map(s => s.kind), minX: Math.min(...xs), maxX: Math.max(...xs) };
    }

    return { TECHNIQUES, QUICK_PATTERNS, build, timeline, cycleSeconds, fmt };
})();
