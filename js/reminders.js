// Breathing reminders, delivered as repeating calendar events.
// A website can't wake itself up while closed, but the phone's calendar can, so the
// reminders are handed to Google Calendar (a link) or any other calendar (an .ics file).
const Reminders = (() => {
    const PUBLIC_URL = 'https://talbus96-pixel.github.io/breath-app/';
    // days setting → calendar weekdays (null = every day)
    const DAYS = { daily: null, sunthu: 'SU,MO,TU,WE,TH', weekdays: 'MO,TU,WE,TH,FR' };
    const SKIP = { daily: [], sunthu: [5, 6], weekdays: [0, 6] }; // JavaScript day numbers: 0 = Sunday
    const title = () => I18n.t('event.title');

    // Where tapping the reminder should lead: this site when hosted, otherwise the public copy.
    function appUrl() {
        return /^https?:$/.test(location.protocol) && !/claude\.ai|claudeusercontent/.test(location.hostname)
            ? location.origin + location.pathname
            : PUBLIC_URL;
    }

    const pad = n => String(n).padStart(2, '0');

    // Local date-time in calendar format, e.g. 20261030T090000 (no time zone: "at 9:00 wherever I am")
    function stamp(d) {
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    }

    // The next time "HH:MM" comes round that fits the repeat rule.
    function firstOccurrence(time, days) {
        const [h, m] = time.split(':').map(Number);
        const d = new Date();
        d.setSeconds(0, 0);
        d.setHours(h, m);
        if (d <= new Date()) d.setDate(d.getDate() + 1);
        while ((SKIP[days] || []).includes(d.getDay())) d.setDate(d.getDate() + 1);
        return d;
    }

    function rule(days) {
        return DAYS[days] ? `FREQ=WEEKLY;BYDAY=${DAYS[days]}` : 'FREQ=DAILY';
    }

    function details(minutes) {
        return I18n.t('event.details', { min: minutes || 5, url: appUrl() });
    }

    function googleLink(time, days, minutes) {
        const start = firstOccurrence(time, days);
        const end = new Date(start.getTime() + Math.max(1, minutes || 5) * 60000);
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title(),
            dates: `${stamp(start)}/${stamp(end)}`,
            details: details(minutes),
            recur: `RRULE:${rule(days)}`
        });
        try { params.set('ctz', Intl.DateTimeFormat().resolvedOptions().timeZone); } catch (e) {}
        return 'https://calendar.google.com/calendar/render?' + params.toString();
    }

    // One calendar file holding every reminder time, each with an alert when it starts.
    function icsFile(times, days, minutes) {
        const now = new Date();
        const utc = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Breathe//Reminders//EN', 'CALSCALE:GREGORIAN'];
        times.forEach(time => {
            lines.push(
                'BEGIN:VEVENT',
                `UID:breathe-${time.replace(':', '')}-${days}-${now.getTime()}@breathe`,
                `DTSTAMP:${utc}`,
                `DTSTART:${stamp(firstOccurrence(time, days))}`,
                `DURATION:PT${Math.max(1, minutes || 5)}M`,
                `RRULE:${rule(days)}`,
                `SUMMARY:${title()}`,
                `DESCRIPTION:${details(minutes).replace(/[,;]/g, '\\$&')}`,
                `URL:${appUrl()}`,
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                `DESCRIPTION:${title()}`,
                'TRIGGER:PT0M',
                'END:VALARM',
                'END:VEVENT'
            );
        });
        lines.push('END:VCALENDAR');
        return lines.map(fold).join('\r\n') + '\r\n';
    }

    // Calendar files limit lines to 75 bytes; longer ones continue on the next line after a space.
    // Splits only between whole characters, so Hebrew letters (2 bytes each) are never cut in half.
    function fold(line) {
        const enc = new TextEncoder();
        const parts = [];
        let current = '', size = 0;
        for (const ch of line) {
            const n = enc.encode(ch).length;
            if (size + n > (parts.length ? 74 : 75)) {
                parts.push(current);
                current = '';
                size = 0;
            }
            current += ch;
            size += n;
        }
        parts.push(current);
        return parts.join('\r\n ');
    }

    function downloadIcs(times, days, minutes) {
        const blob = new Blob([icsFile(times, days, minutes)], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'breathe-reminders.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    // "9:00" from "09:00"
    function label(time) {
        const [h, m] = time.split(':');
        return `${Number(h)}:${m}`;
    }

    return { googleLink, icsFile, downloadIcs, label };
})();
