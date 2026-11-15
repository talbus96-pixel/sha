// "Notice your surroundings": a short, neutral exercise for moments when following the breath
// doesn't feel right. Four gentle prompts, one at a time, about what you can see, hear and
// feel. There is no breathing to follow and nothing to get right. Each prompt moves on by
// itself after a while, or sooner with "Next". It is offered as a pause, not as a treatment.
// The prompts are in i18n.js under 'notice.steps' (a list) and 'notice.finish'.
const Notice = (() => {
    const STEP_MS = 20000;
    const t = (key, vars) => I18n.t(key, vars);
    const $ = id => document.getElementById(id);

    let index = 0, timer = null, onClose = null;

    const root = () => $('notice');
    const steps = () => t('notice.steps');
    const isOpen = () => !root().hidden;

    function buildDots() {
        const dots = $('notice-dots');
        dots.innerHTML = '';
        steps().forEach(() => dots.appendChild(document.createElement('span')));
    }

    function show(i) {
        clearTimeout(timer);
        const list = steps();
        index = i;
        const finished = i >= list.length;
        $('notice-text').textContent = finished ? t('notice.finish') : list[i];
        $('btn-notice-next').textContent = t(finished ? 'notice.done' : 'notice.next');
        [...$('notice-dots').children].forEach((d, k) => d.classList.toggle('on', k <= i));
        const bar = $('notice-bar');
        const fill = $('notice-bar-fill');
        bar.classList.toggle('off', finished);
        fill.style.transition = 'none';
        fill.style.width = '0%';
        if (!finished) {
            // let the empty bar paint first, then fill it slowly over the length of the prompt
            requestAnimationFrame(() => requestAnimationFrame(() => {
                fill.style.transition = `width ${STEP_MS}ms linear`;
                fill.style.width = '100%';
            }));
            timer = setTimeout(() => show(i + 1), STEP_MS);
        }
    }

    function open(whenClosed) {
        onClose = whenClosed || null;
        buildDots();
        root().hidden = false;
        show(0);
        $('btn-notice-next').focus();
    }

    function close() {
        if (!isOpen()) return;
        clearTimeout(timer);
        root().hidden = true;
        const done = onClose;
        onClose = null;
        if (done) done();
    }

    $('btn-notice-next').addEventListener('click', () => {
        if (index >= steps().length) close(); else show(index + 1);
    });
    $('btn-notice-close').addEventListener('click', close);
    root().addEventListener('click', e => { if (e.target === root()) close(); });

    return { open, close, isOpen };
})();
