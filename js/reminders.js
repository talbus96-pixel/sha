// Breathing reminders, delivered as repeating calendar events.
// A website can't wake itself up while closed, but the phone's calendar can, so the
// reminders are handed to Google Calendar (a link) or any other calendar (an .ics file).
const Reminders = (() => {
    const TITLE = 'Time to breathe';
    const PUBLIC_URL = 'https://talbus96-pixel.github.io/breath-app/';
    const WEEKDAYS = 'MO,TU,WE,TH,FR';

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
        while (days === 'weekdays' && (d.getDay() === 0 || d.getDay() === 6)) d.setDate(d.getDate() + 1);
        return d;
    }

    function rule(days) {
        return days === 'weekdays' ? `FREQ=WEEKLY;BYDAY=${WEEKDAYS}` : 'FREQ=DAILY';
    }

    function details(minutes) {
        return `A few calm minutes${minutes ? ` (${minutes} min)` : ''}. Open Breathe: ${appUrl()}`;
    }

    function googleLink(time, days, minutes) {
        const start = firstOccurrence(time, days);
        const end = new Date(start.getTime() + Math.max(1, minutes || 5) * 60000);
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: TITLE,
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
                `SUMMARY:${TITLE}`,
                `DESCRIPTION:${details(minutes).replace(/[,;]/g, '\\$&')}`,
                `URL:${appUrl()}`,
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                `DESCRIPTION:${TITLE}`,
                'TRIGGER:PT0M',
                'END:VALARM',
                'END:VEVENT'
            );
        });
        lines.push('END:VCALENDAR');
        return lines.join('\r\n') + '\r\n';
    }

    function downloadIcs(times, days, minutes) {
        const blob = new Blob([icsFile(times, days, minutes)], { type: 'text/calendar' });
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
