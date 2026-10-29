// A short guided tour: dims the screen, lights up one part of the app at a time and explains it.
// Some steps ask the person to tap the lit-up button themselves, so they learn by doing.
const Tour = (() => {
    // target: element to light up (null = a message in the middle of the screen)
    // screen: which panel must be showing for the step: null (main screen), 'breathing'
    //         (technique list), 'technique' (cyclic sighing's page) or 'menu'
    // tap: the person taps the lit-up button to go on (no Next button)
    const STEPS = [
        { key: 'welcome', target: null },
        { key: 'visual', target: '#visual', pad: -8 },
        { key: 'readout', target: '.readout' },
        { key: 'pattern', target: '#btn-pattern', tap: true },
        { key: 'techList', target: '#tech-list', screen: 'breathing' },
        { key: 'techOpen', target: '#tech-list .preset', screen: 'breathing', tap: true },
        { key: 'techIntro', target: '#tech-intro', screen: 'technique' },
        { key: 'techControls', target: '#tech-controls', screen: 'technique' },
        { key: 'techStart', target: '#btn-tech-start', screen: 'technique' },
        { key: 'techCustom', target: '#breathing-tabs [data-value="custom"]', screen: 'breathing' },
        { key: 'play', target: '#btn-play' },
        { key: 'length', target: '#btn-length' },
        { key: 'sounds', target: '#btn-mute' },
        { key: 'settings', target: '#btn-settings', tap: true },
        { key: 'menuLanguage', target: '#btn-lang', screen: 'menu' },
        { key: 'menuSounds', target: '[data-fold="sounds"]', screen: 'menu' },
        { key: 'menuLength', target: '[data-fold="length"]', screen: 'menu' },
        { key: 'menuReminders', target: '[data-fold="reminders"]', screen: 'menu' },
        { key: 'menuLook', target: '[data-fold="look"]', screen: 'menu' },
        { key: 'menuOptions', target: '[data-fold="options"]', screen: 'menu' },
        { key: 'calm', target: null }
    ];
    const GAP = 14;           // space between the lit-up part and the card
    const MARGIN = 16;        // keep the card this far from the screen edges
    const SETTLE_DELAY = 400; // panels slide in; wait for them before measuring

    const t = (key, vars) => I18n.t(key, vars);
    let root, spot, card, index = 0, placeTimer;
    let hooks = {};

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
                <p class="tour-tap-hint"></p>
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
        // A tap inside the lit-up window on a "tap" step presses the real button underneath.
        root.addEventListener('click', e => {
            if (!STEPS[index].tap || card.contains(e.target)) return;
            const r = spot.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) tapTarget();
        });
    }

    // screenHooks.show(screen) puts the app on the given panel and returns true if it had to change.
    function start(screenHooks = {}) {
        hooks = screenHooks;
        if (!root) build();
        root.hidden = false;
        window.addEventListener('keydown', onKey, true); // capture: runs before the app's own keys
        window.addEventListener('resize', place);
        show(0);
        root.querySelector('.tour-next').focus();
    }

    function end() {
        clearTimeout(placeTimer);
        if (hooks.show) hooks.show(null);
        root.hidden = true;
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', place);
    }

    function tapTarget() {
        const el = document.querySelector(STEPS[index].target);
        if (el) el.click();
        show(index + 1, true);
    }

    function goForward() {
        if (STEPS[index].tap) tapTarget();
        else if (index < STEPS.length - 1) show(index + 1);
    }

    function onKey(e) {
        // keep these keys away from the app (Space would start a session)
        e.stopPropagation();
        if (e.key === 'Escape') end();
        const forward = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const backward = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
        if (e.key === forward) goForward();
        if (e.key === backward && index > 0) show(index - 1);
    }

    function show(i, afterTap = false) {
        index = i;
        const step = STEPS[i];
        root.querySelector('.tour-progress').textContent = t('tour.progress', { n: i + 1, total: STEPS.length });
        root.querySelector('.tour-title').textContent = t(`tour.${step.key}.title`);
        root.querySelector('.tour-text').textContent = t(`tour.${step.key}.text`);
        root.querySelector('.tour-tap-hint').textContent = step.tap ? t('tour.tapHint') : '';
        root.querySelector('.tour-tap-hint').hidden = !step.tap;
        root.querySelector('.tour-skip').textContent = t('tour.skip');
        root.querySelector('.tour-skip').hidden = i === STEPS.length - 1;
        root.querySelector('.tour-back').textContent = t('tour.back');
        root.querySelector('.tour-back').hidden = i === 0;
        root.querySelector('.tour-next').textContent = t(i === STEPS.length - 1 ? 'tour.done' : 'tour.next');
        root.querySelector('.tour-next').hidden = !!step.tap;
        spot.classList.toggle('tap', !!step.tap);

        clearTimeout(placeTimer);
        const changed = hooks.show ? hooks.show(step.screen || null) : false;
        if (changed || afterTap) {
            card.style.visibility = 'hidden';
            placeTimer = setTimeout(reveal, SETTLE_DELAY);
        } else {
            reveal();
        }
    }

    function reveal() {
        const step = STEPS[index];
        const el = step.target && document.querySelector(step.target);
        // bring the target to the middle of its panel's scrolling list; scrollIntoView
        // would also nudge the whole page, which throws the highlight off
        const list = el && el.closest('.sheet-body');
        if (list) {
            const r = el.getBoundingClientRect(), lr = list.getBoundingClientRect();
            list.scrollTop += (r.top - lr.top) - (lr.height - r.height) / 2;
        }
        place();
        card.style.visibility = '';
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
