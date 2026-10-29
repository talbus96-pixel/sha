// A short guided tour: dims the screen, lights up one part of the app at a time and explains it.
const Tour = (() => {
    // target: element to light up (null = a message in the middle of the screen)
    const STEPS = [
        { key: 'welcome', target: null },
        { key: 'visual', target: '#visual', pad: -8 },
        { key: 'readout', target: '.readout' },
        { key: 'pattern', target: '#btn-pattern' },
        { key: 'play', target: '#btn-play' },
        { key: 'length', target: '#btn-length' },
        { key: 'sounds', target: '#btn-mute' },
        { key: 'settings', target: '#btn-settings' },
        { key: 'calm', target: null }
    ];
    const GAP = 14;     // space between the lit-up part and the card
    const MARGIN = 16;  // keep the card this far from the screen edges

    const t = (key, vars) => I18n.t(key, vars);
    let root, spot, card, index = 0;

    function build() {
        root = document.createElement('div');
        root.className = 'tour';
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.innerHTML = `
            <div class="tour-spot"></div>
            <div class="tour-card" aria-live="polite">
                <div class="tour-progress"></div>
                <h2 class="tour-title"></h2>
                <p class="tour-text"></p>
                <div class="tour-actions">
                    <button class="tour-skip"></button>
                    <span class="tour-spacer"></span>
                    <button class="tour-back"></button>
                    <button class="tour-next primary-btn"></button>
                </div>
            </div>`;
        document.body.appendChild(root);
        spot = root.querySelector('.tour-spot');
        card = root.querySelector('.tour-card');
        root.querySelector('.tour-skip').addEventListener('click', end);
        root.querySelector('.tour-back').addEventListener('click', () => show(index - 1));
        root.querySelector('.tour-next').addEventListener('click', () => {
            if (index === STEPS.length - 1) end(); else show(index + 1);
        });
    }

    function start() {
        if (!root) build();
        root.hidden = false;
        window.addEventListener('keydown', onKey, true); // capture: runs before the app's own keys
        window.addEventListener('resize', place);
        show(0);
        root.querySelector('.tour-next').focus();
    }

    function end() {
        root.hidden = true;
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', place);
    }

    function onKey(e) {
        // keep these keys away from the app (Space would start a session)
        e.stopPropagation();
        if (e.key === 'Escape') end();
        const forward = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const backward = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
        if (e.key === forward && index < STEPS.length - 1) show(index + 1);
        if (e.key === backward && index > 0) show(index - 1);
    }

    function show(i) {
        index = i;
        const step = STEPS[i];
        root.querySelector('.tour-progress').textContent = t('tour.progress', { n: i + 1, total: STEPS.length });
        root.querySelector('.tour-title').textContent = t(`tour.${step.key}.title`);
        root.querySelector('.tour-text').textContent = t(`tour.${step.key}.text`);
        root.querySelector('.tour-skip').textContent = t('tour.skip');
        root.querySelector('.tour-skip').hidden = i === STEPS.length - 1;
        root.querySelector('.tour-back').textContent = t('tour.back');
        root.querySelector('.tour-back').hidden = i === 0;
        root.querySelector('.tour-next').textContent = t(i === STEPS.length - 1 ? 'tour.done' : 'tour.next');
        place();
    }

    // Moves the lit-up window over the target and puts the card above or below it.
    function place() {
        const step = STEPS[index];
        const el = step.target && document.querySelector(step.target);
        const vw = window.innerWidth, vh = window.innerHeight;
        const cw = card.offsetWidth, ch = card.offsetHeight;

        if (!el) {
            Object.assign(spot.style, { left: vw / 2 + 'px', top: vh / 2 + 'px', width: '0px', height: '0px' });
            card.style.left = (vw - cw) / 2 + 'px';
            card.style.top = (vh - ch) / 2 + 'px';
            return;
        }

        const r = el.getBoundingClientRect();
        const pad = step.pad ?? 8;
        const box = { x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
        Object.assign(spot.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });

        let top;
        if (box.y + box.h + GAP + ch <= vh - MARGIN) top = box.y + box.h + GAP;   // below
        else if (box.y - GAP - ch >= MARGIN) top = box.y - GAP - ch;               // above
        else top = vh - ch - MARGIN;                                               // over the bottom of a big area
        const left = Math.min(vw - cw - MARGIN, Math.max(MARGIN, box.x + box.w / 2 - cw / 2));
        card.style.left = left + 'px';
        card.style.top = Math.max(MARGIN, top) + 'px';
    }

    return { start };
})();
