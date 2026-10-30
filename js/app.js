// Breathe: settings, the session clock, the panels, and wiring everything together.
(() => {
    const T = Programs.TECHNIQUES;
    const t = I18n.t;

    // names come from i18n.js ('amb.<id>', 'theme.<id>')
    const AMBIENTS = ['rain', 'ocean', 'stream', 'forest', 'fireplace', 'night', 'wind', 'brown']
        .map(id => ({ id, icon: { fireplace: 'i-fire', brown: 'i-noise' }[id] || 'i-' + id }));

    const THEMES = [
        { id: 'day', swatch: 'linear-gradient(135deg, #4b7fd6 0 40%, #f7f3ec 40%)' },
        { id: 'sunrise', swatch: 'linear-gradient(135deg, #e8735a 0 40%, #fff1e4 40%)' },
        { id: 'meadow', swatch: 'linear-gradient(135deg, #3f9a6b 0 40%, #eef7e6 40%)' },
        { id: 'lavender', swatch: 'linear-gradient(135deg, #7d63c8 0 40%, #f3eefb 40%)' },
        { id: 'lagoon', swatch: 'linear-gradient(135deg, #1f9aa8 0 40%, #e8f7f6 40%)' },
        { id: 'night', swatch: 'linear-gradient(135deg, #8fbaff 0 40%, #16203a 40%)' },
        { id: 'dusk', swatch: 'linear-gradient(135deg, #ffb59a 0 40%, #33223f 40%)' },
        { id: 'forest', swatch: 'linear-gradient(135deg, #8fd9b6 0 40%, #1b3530 40%)' }
    ];

    const PHASE_KEYS = ['custom.in', 'custom.holdIn', 'custom.out', 'custom.holdOut'];
    const LENGTHS = [1, 3, 5, 10, 15, 20, 30, 0]; // minutes; 0 = no limit
    const PREPARE_SECONDS = 3;
    const ZEN_DELAY = 4000;
    const TRAIL_LENGTH = 22;
    const STORAGE_KEY = 'breathe.settings.v2';

    const DEFAULTS = {
        technique: 'sigh',           // sigh | box | wimhof | custom
        sigh: { pace: 'steady' },
        box: { count: 4 },
        wimhof: { breaths: 30, rounds: 3, pace: 'medium' },
        custom: { pattern: [4, 7, 8, 0] },
        minutes: 5,
        visual: 'shape',             // shape | wave
        cue: 'bowl',
        cueVolume: 0.8,
        ambient: Object.fromEntries(AMBIENTS.map(a => [a.id, { on: false, level: 0.6 }])),
        theme: 'day',
        prepare: true,
        vibrate: true,
        wakeLock: true,
        reminders: { times: ['09:00'], days: 'daily' },  // days: daily | sunthu | weekdays (Mon–Fri)
        lang: I18n.detect(),
        muted: false,
        wimhofCheck: { ok: 0, blocked: false },  // safety question: times answered "none apply", or locked
        version: 4
    };

    // ---------- settings ----------

    let firstVisit = true;

    function loadSettings() {
        const base = JSON.parse(JSON.stringify(DEFAULTS));
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved) {
                firstVisit = false;
                const merged = { ...base, ...saved };
                ['sigh', 'box', 'wimhof', 'custom', 'ambient', 'reminders', 'wimhofCheck'].forEach(k => { merged[k] = { ...base[k], ...saved[k] }; });
                // Day became the default theme in version 3; move people off the old default
                if ((saved.version || 0) < 3 && merged.theme === 'night') merged.theme = 'day';
                // cyclic sighing became the default technique in version 4
                // every visit opens with the recommended technique; its settings (and the others') are kept
                merged.technique = 'sigh';
                merged.version = base.version;
                return merged;
            }
        } catch (e) {}
        return base;
    }

    function saveSettings() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
    }

    const settings = loadSettings();
    I18n.setLanguage(settings.lang);

    // ---------- helpers ----------

    const $ = id => document.getElementById(id);
    const fmtNum = Programs.fmt;
    const fmtTime = s => {
        s = Math.max(0, Math.floor(s));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    function setSliderFill(input) {
        const pct = (input.value - input.min) / (input.max - input.min) * 100;
        input.style.setProperty('--fill', pct + '%');
    }

    const hasFixedEnd = () => !!program.list; // Wim Hof has a fixed end; the others repeat

    // ---------- elements ----------

    const canvas = $('visual');
    const phaseLabel = $('phase-label');
    const phaseCount = $('phase-count');
    const playBtn = $('btn-play');
    const playIcon = $('play-icon');
    const stopBtn = $('btn-stop');
    const nextBtn = $('btn-next');
    const sessionMeta = $('session-meta');
    const backdrop = $('backdrop');

    // ---------- program & session ----------

    let program = Programs.build(settings);
    let line = Programs.timeline(program);

    const session = {
        state: 'idle',      // idle | prepare | running | paused
        resumeTo: null,
        time: 0,            // seconds of breathing so far (pauses and get-ready not counted)
        clock: 0,           // position in the program's timeline
        prep: 0,
        step: null,
        breaths: 0,
        holds: [],          // Wim Hof hold times
        trail: [],
        lastFrame: 0,
        rafId: 0
    };

    function rebuildProgram() {
        program = Programs.build(settings);
        line = Programs.timeline(program);
        session.clock = 0;
        session.step = null;
        session.trail = [];
        updateChip();
        if (session.state === 'idle') drawIdle();
        else render();
    }

    const totalSeconds = () => settings.minutes * 60;
    const timeUp = () => !hasFixedEnd() && settings.minutes > 0 && session.time >= totalSeconds();

    // ---------- drawing ----------

    function visualBox(w, h) {
        // leave room for the words at the top and the "Breathe in" button at the bottom
        const top = Math.min(110, h * 0.22);
        return { x: 0, y: top, w, h: h - top - 56 };
    }

    function render() {
        const { ctx, w, h } = Visual.fit(canvas);
        const box = visualBox(w, h);
        const step = session.step || line.stepAt(0);
        if (!step) return;
        const at = session.state === 'prepare' || !session.step ? 0 : session.clock;
        if (settings.visual === 'wave') {
            Visual.drawWave(ctx, box, line.levelAt, at, waveWindow());
        } else {
            const prog = session.step ? line.progress(step, session.clock) : 0;
            const dot = Visual.shapePoint(step, openHoldProgress(step) ?? prog, box);
            if (session.state === 'running') {
                session.trail.push(dot);
                if (session.trail.length > TRAIL_LENGTH) session.trail.shift();
            }
            Visual.drawShape(ctx, box, step.shape, session.step ? step.edge : -1, dot, session.trail);
        }
    }

    // An open-ended hold has no known end, so the dot creeps along ever more slowly.
    function openHoldProgress(step) {
        if (!step.open || !session.step) return null;
        const held = session.clock - step.start;
        return held / (held + 45);
    }

    function waveWindow() {
        if (hasFixedEnd()) return 11;
        return Math.min(30, Math.max(9, Programs.cycleSeconds(program) * 1.6));
    }

    function drawIdle() {
        session.trail = [];
        phaseLabel.textContent = t('ready');
        phaseCount.textContent = hasFixedEnd()
            ? t('wimhofIdle', { rounds: settings.wimhof.rounds, breaths: settings.wimhof.breaths })
            : patternSummary();
        sessionMeta.innerHTML = '&nbsp;';
        nextBtn.hidden = true;
        render();
    }

    function patternSummary() {
        if (!program.cycle) return '';
        const per = 60 / Programs.cycleSeconds(program);
        return t('breathsPerMinute', { n: fmtNum(per) });
    }

    function updateMeta() {
        if (hasFixedEnd()) {
            const r = session.step ? session.step.round : 1;
            sessionMeta.textContent = t('roundOf', { r, total: program.rounds });
            return;
        }
        let text;
        if (settings.minutes > 0) {
            text = timeUp() ? t('lastBreath') : t('timeLeft', { t: fmtTime(totalSeconds() - session.time) });
        } else {
            text = fmtTime(session.time);
        }
        const b = session.breaths;
        sessionMeta.textContent = `${text}  ·  ${t('breathCount', { n: b })}`;
    }

    function updateReadout(step) {
        phaseLabel.textContent = t(step.label);
        if (step.open) phaseCount.textContent = fmtTime(session.clock - step.start);
        else if (step.count) phaseCount.textContent = step.count;
        else phaseCount.textContent = Math.max(1, Math.ceil(step.start + step.secs - session.clock));
    }

    // ---------- session flow ----------

    function setPlayIcon(playing) {
        playIcon.setAttribute('href', playing ? '#i-pause' : '#i-play');
        playBtn.setAttribute('aria-label', t(playing ? 'aria.pause' : 'aria.start'));
    }

    function start() {
        Sound.ensure();
        line = Programs.timeline(program);
        Object.assign(session, {
            state: settings.prepare ? 'prepare' : 'running',
            time: 0, clock: 0, prep: PREPARE_SECONDS, step: null, breaths: 0, holds: [], trail: []
        });
        afterResume();
    }

    function pause() {
        if (session.state !== 'prepare' && session.state !== 'running') return;
        session.resumeTo = session.state;
        session.state = 'paused';
        cancelAnimationFrame(session.rafId);
        Sound.pause();
        Sound.setAmbientGate(false);
        releaseWakeLock();
        setPlayIcon(false);
        document.body.classList.remove('running');
        showUI();
        phaseLabel.textContent = t('paused');
        phaseCount.textContent = t('pressPlayContinue');
        nextBtn.hidden = true;
    }

    function resume() {
        Sound.ensure();
        session.state = session.resumeTo || 'running';
        const s = session.step;
        if (session.state === 'running' && s) {
            Sound.resume(s.cueKind, isFinite(s.secs) ? s.start + s.secs - session.clock : 1);
        }
        afterResume();
    }

    function afterResume() {
        Sound.setAmbientGate(true);
        requestWakeLock();
        setPlayIcon(true);
        stopBtn.disabled = false;
        document.body.classList.add('running');
        scheduleZen();
        session.lastFrame = performance.now();
        cancelAnimationFrame(session.rafId);
        session.rafId = requestAnimationFrame(tick);
    }

    function stop(completed) {
        const wasActive = session.state !== 'idle';
        const { time, breaths, holds } = session;
        session.state = 'idle';
        session.step = null;
        cancelAnimationFrame(session.rafId);
        if (completed) Sound.finish(); else Sound.pause();
        Sound.setAmbientGate(false, completed ? 5 : 1.2);
        releaseWakeLock();
        setPlayIcon(false);
        stopBtn.disabled = true;
        document.body.classList.remove('running');
        showUI();
        line = Programs.timeline(program);
        drawIdle();
        if (wasActive && (completed || time >= 30)) {
            $('done-time').textContent = fmtTime(time);
            $('done-breaths').textContent = breaths;
            const extra = $('done-extra');
            extra.hidden = !holds.length;
            extra.textContent = holds.length ? t('done.holds', { list: holds.map(fmtTime).join('  ·  ') }) : '';
            $('complete').hidden = false;
        }
    }

    function onStepStart(step) {
        const cueKind = step.cueKind;
        Sound.cue(cueKind, isFinite(step.secs) ? step.secs : 1);
        vibrate(step);
        nextBtn.hidden = !step.open;
    }

    function tick(now) {
        const dt = Math.min(0.25, (now - session.lastFrame) / 1000);
        session.lastFrame = now;

        if (session.state === 'prepare') {
            session.prep -= dt;
            phaseLabel.textContent = t('getReady');
            phaseCount.textContent = Math.max(1, Math.ceil(session.prep));
            sessionMeta.textContent = hasFixedEnd() ? t('sitOrLie') : '\u00a0';
            render();
            if (session.prep <= 0) session.state = 'running';
        }

        if (session.state === 'running') {
            session.time += dt;
            session.clock += dt;
            const step = line.stepAt(session.clock);
            if (step !== session.step) {
                const prev = session.step;
                if (prev && prev.kind === 'out') {
                    session.breaths++;
                    // when time is up, end gently after a full breath out
                    if (timeUp()) { stop(true); return; }
                }
                if (!step) { stop(true); return; }
                if (prev && prev.shape !== step.shape) session.trail = [];
                session.step = step;
                onStepStart(step);
            }
            updateReadout(step);
            updateMeta();
            render();
        }

        session.rafId = requestAnimationFrame(tick);
    }

    // Ends a Wim Hof breath hold.
    function endOpenHold() {
        const s = session.step;
        if (!s || !s.open || session.state !== 'running') return;
        line.close(s, session.clock);
        session.holds.push(s.secs);
        nextBtn.hidden = true;
    }

    playBtn.addEventListener('click', () => {
        if (session.state === 'idle') start();
        else if (session.state === 'paused') resume();
        else pause();
    });

    stopBtn.addEventListener('click', () => stop(false));
    nextBtn.addEventListener('click', endOpenHold);
    $('btn-done').addEventListener('click', () => { $('complete').hidden = true; });

    // Switching apps or locking the phone pauses the session (the timing can't run in the background).
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') pause();
    });

    window.addEventListener('resize', () => { if (session.state !== 'running') render(); });

    // ---------- vibration & screen wake ----------

    const canVibrate = 'vibrate' in navigator;
    function vibrate(step) {
        if (!settings.vibrate || !canVibrate || step.cueKind === 'powerIn' || step.cueKind === 'powerOut') return;
        const pattern = { in: 40, top: 20, out: [30, 80, 30], retain: [60, 60, 60] }[step.cueKind] || 15;
        try { navigator.vibrate(pattern); } catch (e) {}
    }

    let wakeLock = null;
    async function requestWakeLock() {
        if (!settings.wakeLock || !('wakeLock' in navigator) || wakeLock) return;
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => { wakeLock = null; });
        } catch (e) {}
    }
    function releaseWakeLock() {
        if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    }

    // ---------- calm mode: controls fade away during a session ----------

    let zenTimer;
    function scheduleZen() {
        clearTimeout(zenTimer);
        if (session.state === 'running' || session.state === 'prepare') {
            zenTimer = setTimeout(() => {
                if (!currentSheet) document.body.classList.add('zen');
            }, ZEN_DELAY);
        }
    }
    function showUI() {
        document.body.classList.remove('zen');
        scheduleZen();
    }
    ['pointerdown', 'pointermove', 'keydown'].forEach(evt => document.addEventListener(evt, showUI, { passive: true }));

    // ---------- sheets ----------

    let currentSheet = null;

    // fold: for the menu, which section to open (none = all closed)
    function openSheet(id, fold) {
        closeSheet();
        currentSheet = $(id);
        backdrop.hidden = false;
        currentSheet.hidden = false;
        currentSheet.querySelector('.sheet-body').scrollTop = 0;
        showUI();
        if (id === 'sheet-settings') {
            renderMenu();
            openFold(fold || null);
        }
    }

    function closeSheet() {
        if (!currentSheet) return;
        closeLanguagePicker();
        const id = currentSheet.id;
        currentSheet.hidden = true;
        backdrop.hidden = true;
        currentSheet = null;
        if (id === 'sheet-settings' && !sessionActive()) Sound.setAmbientGate(false);
        scheduleZen();
    }

    backdrop.addEventListener('click', closeSheet);
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheet));
    $('btn-pattern').addEventListener('click', () => openBreathing());
    $('btn-settings').addEventListener('click', () => openSheet('sheet-settings'));
    $('btn-length').addEventListener('click', () => {
        if (settings.technique === 'wimhof') openBreathing('wimhof');
        else openSheet('sheet-settings', 'length');
    });

    // ---------- menu: folding sections ----------

    const sessionActive = () => session.state === 'running' || session.state === 'prepare';

    function renderMenu() {
        renderSettingsSheet();
        renderSoundsSheet();
        renderReminders();
    }

    // Opens one section and closes the rest; null closes all.
    function openFold(key) {
        document.querySelectorAll('.fold').forEach(f => {
            const on = f.dataset.fold === key;
            f.classList.toggle('open', on);
            f.querySelector('.fold-head').setAttribute('aria-expanded', on);
            f.querySelector('.fold-body').hidden = !on;
            if (on) setTimeout(() => f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
        });
        // let the person hear their ambience mix while choosing sounds
        if (key === 'sounds') {
            Sound.ensure();
            Sound.setAmbientGate(true);
        } else if (!sessionActive()) {
            Sound.setAmbientGate(false);
        }
    }

    document.querySelectorAll('.fold').forEach(f => {
        f.querySelector('.fold-head').addEventListener('click', () => {
            openFold(f.classList.contains('open') ? null : f.dataset.fold);
        });
    });

    // The current choice shown on each closed section, e.g. "Theme · Day".
    function updateSummaries() {
        const amb = AMBIENTS.filter(a => settings.ambient[a.id].on).map(a => t('amb.' + a.id));
        $('sum-sounds').textContent = `${t('cue.' + settings.cue)} · ${amb.length ? amb.join(', ') : t('sum.noAmbience')}`;
        $('sum-length').textContent = settings.minutes > 0 ? t('length.min', { n: settings.minutes }) : t('length.none');
        const r = settings.reminders;
        $('sum-reminders').textContent = `${r.times.map(Reminders.label).join(', ')} · ${t('days.' + r.days)}`;
        $('sum-look').textContent = `${t('theme.' + settings.theme)} · ${t('visual.' + settings.visual)}`;
    }

    // ---------- mute ----------

    function applyMute() {
        Sound.setMuted(settings.muted);
        $('mute-icon').setAttribute('href', settings.muted ? '#i-sound-off' : '#i-sound');
        $('btn-mute').setAttribute('aria-pressed', settings.muted);
        $('btn-mute').setAttribute('aria-label', t(settings.muted ? 'aria.unmute' : 'aria.mute'));
    }

    $('btn-mute').addEventListener('click', () => {
        settings.muted = !settings.muted;
        saveSettings();
        applyMute();
    });

    // Swipe a sheet down to close it
    document.querySelectorAll('.sheet').forEach(sheet => {
        let startY = null;
        [sheet.querySelector('.sheet-handle'), sheet.querySelector('.sheet-head')].forEach(el => {
            el.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
            el.addEventListener('touchend', e => {
                if (startY !== null && e.changedTouches[0].clientY - startY > 60) closeSheet();
                startY = null;
            });
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { if (!$('safety').hidden) closeSafety(); else closeSheet(); }
        if (e.code === 'Space' && !currentSheet && $('complete').hidden) {
            e.preventDefault();
            if (session.step && session.step.open) endOpenHold();
            else playBtn.click();
        }
    });

    // ---------- breathing sheet: techniques & custom ----------

    let breathingTab = settings.technique === 'custom' ? 'custom' : 'techniques';

    function updateChip() {
        const tech = settings.technique;
        if (tech === 'custom') {
            const p = settings.custom.pattern;
            const quick = Programs.QUICK_PATTERNS.find(q => q.pattern.every((v, i) => v === p[i]));
            $('pattern-name').textContent = t(quick ? 'quick.' + quick.id : 'custom');
            $('pattern-nums').textContent = p.filter(n => n > 0).map(fmtNum).join(' · ');
        } else {
            $('pattern-name').textContent = Programs.text(tech, 'name');
            $('pattern-nums').textContent = T[tech].summary(settings[tech]);
        }
        const wim = tech === 'wimhof';
        $('length-value').textContent = wim ? settings.wimhof.rounds : (settings.minutes > 0 ? settings.minutes : '∞');
        $('length-label').textContent = wim ? t('rounds', { n: settings.wimhof.rounds }) : t(settings.minutes > 0 ? 'unit.min' : 'unit.open');
    }

    function openBreathing(detailId) {
        openSheet('sheet-pattern');
        if (detailId) showTechnique(detailId);
        else showBreathingHome();
    }

    function showBreathingHome() {
        $('breathing-home').hidden = false;
        $('tech-detail').hidden = true;
        $('btn-tech-back').hidden = true;
        $('pattern-title').textContent = t('breathing.title');
        document.querySelectorAll('#breathing-tabs button').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === breathingTab);
        });
        $('tab-techniques').hidden = breathingTab !== 'techniques';
        $('tab-custom').hidden = breathingTab !== 'custom';
        if (breathingTab === 'techniques') renderTechList(); else renderCustom();
    }

    document.querySelectorAll('#breathing-tabs button').forEach(b => {
        b.addEventListener('click', () => { breathingTab = b.dataset.value; showBreathingHome(); });
    });

    function renderTechList() {
        const list = $('tech-list');
        list.innerHTML = '';
        Object.keys(T).forEach(id => {
            const row = document.createElement('button');
            row.className = 'preset' + (settings.technique === id ? ' selected' : '');
            row.innerHTML = `<div><div class="preset-name"></div><div class="preset-desc"></div></div><svg class="chev" width="20" height="20"><use href="#i-chevron"/></svg>`;
            row.querySelector('.preset-name').textContent = Programs.text(id, 'name');
            if (T[id].recommended) row.querySelector('.preset-name').appendChild(badge());
            row.querySelector('.preset-desc').textContent = Programs.text(id, 'tagline');
            const locked = id === 'wimhof' && settings.wimhofCheck.blocked;
            if (locked) {
                row.classList.add('locked');
                row.querySelector('.preset-desc').textContent = t('safety.locked');
                row.addEventListener('click', () => {
                    if (row.nextElementSibling && row.nextElementSibling.classList.contains('recheck-btn')) return;
                    const again = document.createElement('button');
                    again.className = 'recheck-btn';
                    again.textContent = t('safety.recheck');
                    again.addEventListener('click', () => askSafety());
                    row.after(again);
                });
            } else {
                row.addEventListener('click', () => (id === 'wimhof' ? openWimhof() : showTechnique(id)));
            }
            list.appendChild(row);
        });
    }

    // ---------- Wim Hof safety check ----------
    // Asked the first 3 times someone opens Wim Hof. "One applies" greys it out until they ask again.
    const SAFETY_ASKS = 3;

    function openWimhof() {
        if (settings.wimhofCheck.ok < SAFETY_ASKS) askSafety();
        else showTechnique('wimhof');
    }

    function askSafety() {
        const ul = $('safety-list');
        ul.innerHTML = '';
        t('safety.list').forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            ul.appendChild(li);
        });
        $('safety').hidden = false;
        $('btn-safety-no').focus();
    }

    function closeSafety() { $('safety').hidden = true; }

    $('btn-safety-no').addEventListener('click', () => {
        settings.wimhofCheck.ok += 1;
        settings.wimhofCheck.blocked = false;
        saveSettings();
        closeSafety();
        showTechnique('wimhof');
    });
    $('btn-safety-yes').addEventListener('click', () => {
        settings.wimhofCheck.blocked = true;
        saveSettings();
        closeSafety();
        renderTechList();
    });
    $('safety').addEventListener('click', e => { if (e.target === $('safety')) closeSafety(); });

    function badge() {
        const b = document.createElement('span');
        b.className = 'badge';
        b.textContent = t('recommended');
        return b;
    }

    let detailId = null;
    function showTechnique(id) {
        detailId = id;
        const tx = field => Programs.text(id, field);
        $('breathing-home').hidden = true;
        $('tech-detail').hidden = false;
        $('btn-tech-back').hidden = false;
        $('pattern-title').textContent = tx('name');
        if (T[id].recommended) $('pattern-title').appendChild(badge());
        $('tech-intro').textContent = tx('intro');
        $('tech-caution').hidden = !tx('caution');
        $('tech-caution').textContent = tx('caution') || '';
        const steps = $('tech-steps');
        steps.innerHTML = '';
        tx('steps').forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            steps.appendChild(li);
        });
        $('tech-note').textContent = tx('note') || '';
        renderTechControls();
        currentSheet.querySelector('.sheet-body').scrollTop = 0;
    }

    function renderTechControls() {
        const tech = T[detailId];
        const params = settings[detailId];
        const box = $('tech-controls');
        box.innerHTML = '';
        tech.controls.forEach(c => {
            const row = document.createElement('div');
            row.className = 'control-row';
            const label = document.createElement('span');
            label.textContent = t(c.label);
            row.appendChild(label);
            if (c.options) {
                const seg = document.createElement('div');
                seg.className = 'segmented';
                c.options.forEach(([value, key]) => {
                    const b = document.createElement('button');
                    b.textContent = t(key);
                    b.classList.toggle('selected', params[c.key] === value);
                    b.addEventListener('click', () => { params[c.key] = value; saveSettings(); renderTechControls(); });
                    seg.appendChild(b);
                });
                row.appendChild(seg);
            } else {
                row.appendChild(stepperInline(
                    `${fmtNum(params[c.key])}${c.unit ? '<small> ' + t(c.unit) + '</small>' : ''}`,
                    delta => {
                        params[c.key] = Math.min(c.max, Math.max(c.min, Math.round((params[c.key] + delta * c.step) * 10) / 10));
                        saveSettings();
                        renderTechControls();
                    }
                ));
            }
            box.appendChild(row);
        });
        if (tech.describe) {
            const hint = document.createElement('p');
            hint.className = 'hint control-hint';
            hint.textContent = tech.describe(params);
            box.appendChild(hint);
        }
    }

    function stepperInline(valueHtml, onChange) {
        const wrap = document.createElement('div');
        wrap.className = 'stepper-inline';
        wrap.innerHTML = `<button aria-label="${t('aria.less')}"><svg><use href="#i-minus"/></svg></button>
            <div class="stepper-value">${valueHtml}</div>
            <button aria-label="${t('aria.more')}"><svg><use href="#i-plus"/></svg></button>`;
        const [less, more] = wrap.querySelectorAll('button');
        less.addEventListener('click', () => onChange(-1));
        more.addEventListener('click', () => onChange(1));
        return wrap;
    }

    $('btn-tech-back').addEventListener('click', showBreathingHome);

    $('btn-tech-start').addEventListener('click', () => {
        settings.technique = detailId;
        breathingTab = 'techniques';
        saveSettings();
        closeSheet();
        if (session.state !== 'idle') stop(false);
        $('complete').hidden = true;
        rebuildProgram();
        start();
    });

    function renderCustom() {
        const p = settings.custom.pattern;
        const grid = $('stepper-grid');
        grid.innerHTML = '';
        PHASE_KEYS.forEach((key, i) => {
            const min = i % 2 === 0 ? 1 : 0;   // breathing in/out need at least 1s; holds can be off
            const box = document.createElement('div');
            box.className = 'stepper';
            box.innerHTML = `<div class="stepper-label">${t(key)}</div>`;
            const row = stepperInline(p[i] > 0 ? `${fmtNum(p[i])}<small>${t('unit.s')}</small>` : t('off'), delta => {
                const next = p.slice();
                next[i] = Math.min(20, Math.max(min, next[i] + delta * 0.5));
                setCustom(next);
            });
            row.className = 'stepper-row';
            box.appendChild(row);
            grid.appendChild(box);
        });

        const cycle = p.reduce((a, b) => a + b, 0);
        $('bpm-hint').textContent = t('bpmHint', { c: fmtNum(cycle), n: fmtNum(60 / cycle) });

        const chips = $('quick-patterns');
        chips.innerHTML = '';
        Programs.QUICK_PATTERNS.forEach(q => {
            const b = document.createElement('button');
            b.className = 'chip' + (settings.technique === 'custom' && q.pattern.every((v, i) => v === p[i]) ? ' selected' : '');
            b.textContent = t('quick.' + q.id);
            b.addEventListener('click', () => setCustom(q.pattern.slice()));
            chips.appendChild(b);
        });

        drawPreview();
    }

    function setCustom(pattern) {
        settings.custom.pattern = pattern;
        settings.technique = 'custom';
        saveSettings();
        rebuildProgram();
        renderCustom();
    }

    function drawPreview() {
        const prev = $('shape-preview');
        const { ctx, w, h } = Visual.fit(prev);
        const cycle = Programs.build({ ...settings, technique: 'custom' }).cycle;
        Visual.drawShape(ctx, { x: 0, y: 6, w, h: h - 12 }, cycle[0].shape, -1, null, null, 2.5);
    }

    // ---------- sounds sheet ----------

    function renderSoundsSheet() {
        document.querySelectorAll('#cue-style button').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === settings.cue);
        });
        const vol = $('cue-volume');
        vol.value = settings.cueVolume;
        setSliderFill(vol);

        const grid = $('ambient-grid');
        grid.innerHTML = '';
        AMBIENTS.forEach(a => {
            const tile = document.createElement('button');
            tile.className = 'ambient-tile' + (settings.ambient[a.id].on ? ' on' : '');
            tile.setAttribute('aria-pressed', settings.ambient[a.id].on);
            tile.innerHTML = `<svg><use href="#${a.icon}"/></svg><span></span>`;
            tile.querySelector('span').textContent = t('amb.' + a.id);
            tile.addEventListener('click', () => {
                const s = settings.ambient[a.id];
                s.on = !s.on;
                Sound.ensure();
                Sound.setAmbient(a.id, s.on, s.level);
                saveSettings();
                renderSoundsSheet();
            });
            grid.appendChild(tile);
        });

        const mix = $('ambient-mix');
        mix.innerHTML = '';
        AMBIENTS.filter(a => settings.ambient[a.id].on).forEach(a => {
            const row = document.createElement('label');
            row.className = 'slider-row';
            row.innerHTML = `<span></span><input type="range" min="0" max="1" step="0.01">`;
            row.querySelector('span').textContent = t('amb.' + a.id);
            const input = row.querySelector('input');
            input.value = settings.ambient[a.id].level;
            setSliderFill(input);
            input.addEventListener('input', () => {
                const s = settings.ambient[a.id];
                s.level = parseFloat(input.value);
                setSliderFill(input);
                Sound.setAmbient(a.id, s.on, s.level);
            });
            input.addEventListener('change', saveSettings);
            mix.appendChild(row);
        });
        updateSummaries();
    }

    document.querySelectorAll('#cue-style button').forEach(b => {
        b.addEventListener('click', () => {
            settings.cue = b.dataset.value;
            Sound.setCueStyle(settings.cue);
            Sound.preview(settings.cue);
            saveSettings();
            renderSoundsSheet();
        });
    });

    $('cue-volume').addEventListener('input', e => {
        settings.cueVolume = parseFloat(e.target.value);
        setSliderFill(e.target);
        Sound.setCueLevel(settings.cueVolume);
    });
    $('cue-volume').addEventListener('change', () => {
        Sound.preview(settings.cue);
        saveSettings();
    });

    // ---------- settings sheet ----------

    function applyTheme() {
        document.body.dataset.theme = settings.theme;
        const color = getComputedStyle(document.body).getPropertyValue('--bg-bottom').trim();
        document.querySelector('meta[name="theme-color"]').setAttribute('content', color);
        Visual.readColors();
        render();
    }

    function renderSettingsSheet() {
        const lengths = $('length-options');
        lengths.innerHTML = '';
        LENGTHS.forEach(m => {
            const b = document.createElement('button');
            b.textContent = m > 0 ? t('length.min', { n: m }) : t('length.none');
            b.classList.toggle('selected', settings.minutes === m);
            b.addEventListener('click', () => {
                settings.minutes = m;
                updateChip();
                saveSettings();
                renderSettingsSheet();
            });
            lengths.appendChild(b);
        });

        document.querySelectorAll('#visual-options button').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === settings.visual);
        });

        renderLanguagePicker();

        const themes = $('theme-list');
        themes.innerHTML = '';
        THEMES.forEach(theme => {
            const b = document.createElement('button');
            b.className = 'theme-option' + (settings.theme === theme.id ? ' selected' : '');
            b.innerHTML = `<span class="theme-swatch"></span><span></span>`;
            b.querySelector('.theme-swatch').style.background = theme.swatch;
            b.lastElementChild.textContent = t('theme.' + theme.id);
            b.addEventListener('click', () => {
                settings.theme = theme.id;
                applyTheme();
                saveSettings();
                renderSettingsSheet();
            });
            themes.appendChild(b);
        });

        $('opt-prepare').checked = settings.prepare;
        $('opt-vibrate').checked = settings.vibrate;
        $('opt-wake').checked = settings.wakeLock;
        updateSummaries();
    }

    document.querySelectorAll('#visual-options button').forEach(b => {
        b.addEventListener('click', () => {
            settings.visual = b.dataset.value;
            session.trail = [];
            saveSettings();
            renderSettingsSheet();
            render();
        });
    });

    [['opt-prepare', 'prepare'], ['opt-vibrate', 'vibrate'], ['opt-wake', 'wakeLock']].forEach(([id, key]) => {
        $(id).addEventListener('change', e => {
            settings[key] = e.target.checked;
            if (key === 'wakeLock') {
                if (!settings.wakeLock) releaseWakeLock();
                else if (session.state === 'running') requestWakeLock();
            }
            if (key === 'vibrate' && settings.vibrate && canVibrate) navigator.vibrate(30);
            saveSettings();
        });
    });

    if (!canVibrate) $('row-vibrate').hidden = true;
    if (!('wakeLock' in navigator)) $('row-wake').hidden = true;

    // ---------- language picker (top corner of the menu) ----------

    function renderLanguagePicker() {
        const current = I18n.LANGUAGES.find(([c]) => c === settings.lang) || I18n.LANGUAGES[0];
        $('lang-current').textContent = current[1];
        const pop = $('lang-pop');
        pop.innerHTML = '';
        I18n.LANGUAGES.forEach(([code, name]) => {
            const b = document.createElement('button');
            b.className = 'lang-option' + (settings.lang === code ? ' selected' : '');
            b.lang = code;
            b.innerHTML = '<span></span><span class="check">✓</span>';
            b.firstChild.textContent = name;
            b.addEventListener('click', () => {
                closeLanguagePicker();
                setLanguage(code);
            });
            pop.appendChild(b);
        });
    }

    function closeLanguagePicker() {
        $('lang-pop').hidden = true;
        $('btn-lang').setAttribute('aria-expanded', 'false');
    }

    $('btn-lang').addEventListener('click', e => {
        e.stopPropagation();
        const pop = $('lang-pop');
        pop.hidden = !pop.hidden;
        $('btn-lang').setAttribute('aria-expanded', String(!pop.hidden));
    });
    document.addEventListener('click', e => {
        if (!$('lang-pop').hidden && !e.target.closest('.lang-picker')) closeLanguagePicker();
    });

    // Switches every text on screen, and the direction (Hebrew reads right to left).
    function setLanguage(code) {
        settings.lang = code;
        saveSettings();
        I18n.setLanguage(code);
        updateChip();
        if (session.state === 'idle') drawIdle();
        if (session.state === 'paused') {
            phaseLabel.textContent = t('paused');
            phaseCount.textContent = t('pressPlayContinue');
        }
        setPlayIcon(sessionActive());
        applyMute();
        renderMenu();
    }

    // ---------- reminders sheet ----------

    const MAX_REMINDERS = 4;
    const reminderMinutes = () => (settings.technique === 'wimhof' ? 10 : settings.minutes || 5);

    function renderReminders() {
        const r = settings.reminders;
        const list = $('reminder-times');
        list.innerHTML = '';
        r.times.forEach((time, i) => {
            const row = document.createElement('div');
            row.className = 'time-row';
            row.innerHTML = `<input type="time" aria-label="${t('aria.reminderTime')}"><button class="icon-btn" aria-label="${t('aria.removeTime')}"><svg><use href="#i-close"/></svg></button>`;
            const input = row.querySelector('input');
            input.value = time;
            input.addEventListener('change', () => {
                if (!input.value) return;
                r.times[i] = input.value;
                saveSettings();
                renderReminders();
            });
            const remove = row.querySelector('button');
            remove.hidden = r.times.length === 1;
            remove.addEventListener('click', () => {
                r.times.splice(i, 1);
                saveSettings();
                renderReminders();
            });
            list.appendChild(row);
        });
        $('btn-add-time').hidden = r.times.length >= MAX_REMINDERS;

        document.querySelectorAll('#reminder-days button').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === r.days);
        });

        const links = $('google-links');
        links.innerHTML = '';
        r.times.forEach(time => {
            const a = document.createElement('a');
            a.className = 'primary-btn';
            a.target = '_blank';
            a.rel = 'noopener';
            a.href = Reminders.googleLink(time, r.days, reminderMinutes());
            a.textContent = r.times.length > 1 ? t('reminders.googleAt', { time: Reminders.label(time) }) : t('reminders.google');
            links.appendChild(a);
        });
        updateSummaries();
    }

    // Lets the tour put the app on the panel a step needs: null (main screen), 'breathing'
    // (technique list), 'technique' (cyclic sighing's page) or 'menu'. Returns true if it changed.
    const tourHooks = {
        show(screen) {
            const open = currentSheet && currentSheet.id;
            if (screen === null) {
                if (!open) return false;
                closeSheet();
                return true;
            }
            if (screen === 'menu') {
                if (open === 'sheet-settings') return false;
                openSheet('sheet-settings');
                return true;
            }
            breathingTab = 'techniques';
            const onList = open === 'sheet-pattern' && $('tech-detail').hidden && !$('tab-techniques').hidden;
            const onSigh = open === 'sheet-pattern' && !$('tech-detail').hidden && detailId === 'sigh';
            if (screen === 'breathing') {
                if (onList) return false;
                if (open === 'sheet-pattern') showBreathingHome(); else openBreathing();
                return true;
            }
            if (screen === 'technique') {
                if (onSigh) return false;
                if (open === 'sheet-pattern') showTechnique('sigh'); else openBreathing('sigh');
                return true;
            }
            return false;
        }
    };

    $('btn-tour').addEventListener('click', () => {
        closeSheet();
        pause();
        $('complete').hidden = true;
        showUI();
        clearTimeout(zenTimer);
        Tour.start(tourHooks);
    });

    $('btn-add-time').addEventListener('click', () => {
        const r = settings.reminders;
        // suggest a time a few hours after the last one
        const [h, m] = r.times[r.times.length - 1].split(':').map(Number);
        r.times.push(`${String((h + 4) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        saveSettings();
        renderReminders();
    });

    document.querySelectorAll('#reminder-days button').forEach(b => {
        b.addEventListener('click', () => {
            settings.reminders.days = b.dataset.value;
            saveSettings();
            renderReminders();
        });
    });

    $('btn-ics').addEventListener('click', () => {
        const r = settings.reminders;
        Reminders.downloadIcs(r.times, r.days, reminderMinutes());
    });

    // ---------- start up ----------

    Sound.setCueStyle(settings.cue);
    Sound.setCueLevel(settings.cueVolume);
    AMBIENTS.forEach(a => {
        const s = settings.ambient[a.id];
        if (s.on) Sound.setAmbient(a.id, true, s.level);
    });
    applyTheme();
    applyMute();
    updateChip();
    drawIdle();

    // First time here: show the tour once (Skip is always there).
    if (firstVisit) {
        saveSettings();
        setTimeout(() => Tour.start(tourHooks), 700);
    }

    // Offline / installable app support (only works when served from a web address, not a file)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        // When a new version takes over, reload once to show it, but only while nothing is
        // going on: not mid-session, with no panel, tour or "Well done" card open.
        const hadVersion = !!navigator.serviceWorker.controller;
        let updateReady = false, reloaded = false;
        const idle = () => !sessionActive() && !currentSheet && $('complete').hidden && !document.querySelector('.tour:not([hidden])');
        const reloadIfIdle = () => {
            if (updateReady && !reloaded && idle()) {
                reloaded = true;
                location.reload();
            }
        };
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!hadVersion) return;
            updateReady = true;
            reloadIfIdle();
        });
        setInterval(reloadIfIdle, 20000);

        // A phone keeps the app waiting in the background for days, so look for a new
        // version whenever it comes back to the screen, and every hour while it's open.
        let registration = null;
        const checkForUpdate = () => { if (registration) registration.update().catch(() => {}); };
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkForUpdate();
                reloadIfIdle();
            }
        });
        setInterval(checkForUpdate, 60 * 60 * 1000);
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => { registration = reg; })
                .catch(() => {});
        });
    }
})();
