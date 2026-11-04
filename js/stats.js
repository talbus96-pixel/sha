// Practice history: a small log kept on the phone, and the calm "Your practice" screen.
// Nothing is sent anywhere. The screen shows what you did, never what you missed.
const Stats = (() => {
    const KEY = 'breathe.history.v1';
    const MAX_ENTRIES = 3000;
    const WEEKS = 5;
    const t = (k, v) => I18n.t(k, v);

    function load() {
        try {
            const list = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(list) ? list : [];
        } catch (e) { return []; }
    }

    function save(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ENTRIES))); } catch (e) {}
    }

    // entry: { tech, secs, breaths, holds }
    function add(entry) {
        const list = load();
        list.push({
            at: Date.now(),
            tech: entry.tech,
            secs: Math.round(entry.secs),
            breaths: entry.breaths || 0,
            holds: (entry.holds || []).map(Math.round)
        });
        save(list);
    }

    function clear() {
        try { localStorage.removeItem(KEY); } catch (e) {}
    }

    const pad = n => String(n).padStart(2, '0');
    const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const minutes = secs => Math.round(secs / 60);

    function summarise(list, now = new Date()) {
        const byDay = {};
        const byTech = {};
        let secs = 0, breaths = 0, bestHold = 0;
        list.forEach(e => {
            const k = dayKey(new Date(e.at));
            byDay[k] = (byDay[k] || 0) + e.secs;
            byTech[e.tech] = (byTech[e.tech] || 0) + e.secs;
            secs += e.secs;
            breaths += e.breaths;
            (e.holds || []).forEach(h => { bestHold = Math.max(bestHold, h); });
        });
        return { byDay, byTech, secs, breaths, bestHold, sessions: list.length };
    }

    function weekStart(date, firstDay) {
        const d = startOfDay(date);
        return addDays(d, -((d.getDay() - firstDay + 7) % 7));
    }

    const fmtTime = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function techName(id) {
        return id === 'custom' ? t('custom') : Programs.text(id, 'name');
    }

    // Draws the whole screen into `root`.
    function render(root, now = new Date()) {
        root.innerHTML = '';
        const list = load();
        const s = summarise(list, now);

        if (!list.length) {
            root.appendChild(el('p', 'stats-empty', t('stats.empty')));
            return;
        }

        const firstDay = I18n.lang === 'he' ? 0 : 1; // weeks start on Sunday in Hebrew, otherwise Monday
        const today = startOfDay(now);
        const thisWeek = weekStart(today, firstDay);

        let weekDays = 0, weekSecs = 0;
        for (let i = 0; i < 7; i++) {
            const secs = s.byDay[dayKey(addDays(thisWeek, i))] || 0;
            if (secs) { weekDays++; weekSecs += secs; }
        }

        // a warm headline
        const head = el('div', 'stats-head');
        head.appendChild(el('div', 'stats-big', weekDays ? t('stats.weekDays', { n: weekDays }) : t('stats.freshWeek')));
        if (weekDays) head.appendChild(el('div', 'stats-sub', t('stats.weekMin', { n: Math.max(1, minutes(weekSecs)) })));
        head.appendChild(el('div', 'stats-sub', t(s.byDay[dayKey(today)] ? 'stats.todayDone' : 'stats.todayNudge')));
        root.appendChild(head);

        // the last few weeks: practised days simply glow, the rest stay quiet
        root.appendChild(el('h3', 'section-title', t('stats.calendar')));
        const grid = el('div', 'stats-grid');
        grid.setAttribute('role', 'img');
        grid.setAttribute('aria-label', t('stats.calendar'));
        const names = new Intl.DateTimeFormat(I18n.lang, { weekday: 'narrow' });
        for (let i = 0; i < 7; i++) grid.appendChild(el('div', 'stats-dow', names.format(addDays(thisWeek, i))));
        const first = addDays(thisWeek, -7 * (WEEKS - 1));
        for (let i = 0; i < 7 * WEEKS; i++) {
            const d = addDays(first, i);
            const cell = el('div', 'stats-day');
            if (d > today) {
                cell.classList.add('future');
            } else {
                const m = minutes(s.byDay[dayKey(d)] || 0);
                const has = s.byDay[dayKey(d)];
                if (has) cell.classList.add(m >= 15 ? 'd3' : m >= 5 ? 'd2' : 'd1');
                if (+d === +today) cell.classList.add('today');
                cell.title = `${d.toLocaleDateString(I18n.lang, { day: 'numeric', month: 'short' })}${has ? ' · ' + t('length.min', { n: Math.max(1, m) }) : ''}`;
            }
            grid.appendChild(cell);
        }
        root.appendChild(grid);

        // all-time totals
        const tiles = el('div', 'stats-tiles');
        [[s.sessions, 'stats.sessions'], [minutes(s.secs), 'stats.minutes'], [s.breaths, 'stats.breaths']].forEach(([n, key]) => {
            const tile = el('div', 'stats-tile');
            tile.appendChild(el('span', '', n));
            tile.appendChild(el('small', '', t(key)));
            tiles.appendChild(tile);
        });
        root.appendChild(tiles);

        // time per technique
        const techs = Object.entries(s.byTech).sort((a, b) => b[1] - a[1]);
        root.appendChild(el('h3', 'section-title', t('stats.byTech')));
        const rows = el('div', 'stats-rows');
        techs.forEach(([id, secs]) => {
            const row = el('div', 'stats-row');
            row.appendChild(el('span', '', techName(id)));
            row.appendChild(el('span', 'stats-row-val', t('length.min', { n: Math.max(1, minutes(secs)) })));
            rows.appendChild(row);
        });
        if (s.bestHold) {
            const row = el('div', 'stats-row');
            row.appendChild(el('span', '', t('stats.bestHold')));
            row.appendChild(el('span', 'stats-row-val', fmtTime(s.bestHold)));
            rows.appendChild(row);
        }
        root.appendChild(rows);

        const clear = el('button', 'recheck-btn stats-clear', t('stats.clear'));
        clear.addEventListener('click', () => {
            if (window.confirm(t('stats.clearConfirm'))) { Stats.clear(); render(root); }
        });
        root.appendChild(clear);
    }

    return { add, clear, load, render, summarise };
})();
