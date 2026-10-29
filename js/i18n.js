// Translations. English is the fallback for anything missing in another language.
// In the page, elements marked data-i18n="key" get their text from here (data-i18n-html for
// text with links, data-i18n-aria for button labels read out by screen readers).
// Hebrew uses plural instructions and nouns so it reads naturally for everyone.
const I18n = (() => {
    const STRINGS = {
        en: {
            'app.title': 'Breathe',
            'brand': 'Breathe',

            // main screen
            'ready': 'Ready',
            'paused': 'Paused',
            'pressPlayContinue': 'Press play to continue',
            'getReady': 'Get ready',
            'sitOrLie': 'Sit or lie down',
            'breathsPerMinute': '{n} breaths per minute',
            'wimhofIdle': '{rounds} × {breaths} breaths',
            'timeLeft': '{t} left',
            'lastBreath': 'Last breath',
            'breathCount': ({ n }) => (n === 1 ? '1 breath' : `${n} breaths`),
            'roundOf': 'Round {r} of {total}',
            'next': 'Breathe in',
            'unit.min': 'min',
            'unit.open': 'open',
            'unit.s': 's',
            'rounds': ({ n }) => (n === 1 ? 'round' : 'rounds'),
            'roundsCount': ({ n }) => (n === 1 ? '1 round' : `${n} rounds`),
            'aria.sounds': 'Sounds',
            'aria.settings': 'Settings',
            'aria.pattern': 'Change breathing technique',
            'aria.length': 'Session length',
            'aria.start': 'Start',
            'aria.pause': 'Pause',
            'aria.stop': 'End session',
            'aria.close': 'Close',
            'aria.back': 'Back',
            'aria.less': 'Less',
            'aria.more': 'More',

            // steps
            'step.in': 'Breathe in',
            'step.top': 'Sip in more',
            'step.holdIn': 'Hold',
            'step.out': 'Breathe out',
            'step.holdOut': 'Hold',
            'step.outSlow': 'Breathe out slowly',
            'step.letGo': 'Let go',
            'step.deepIn': 'Deep breath in',
            'step.retain': 'Hold, lungs empty',

            // session complete
            'done.title': 'Well done',
            'done.time': 'time',
            'done.breaths': 'breaths',
            'done.holds': 'Breath holds: {list}',
            'done.button': 'Done',

            // breathing sheet
            'breathing.title': 'Breathing',
            'tab.techniques': 'Techniques',
            'tab.custom': 'Custom',
            'howTo': 'How to do it',
            'start': 'Start',
            'custom': 'Custom',
            'custom.in': 'Breathe in',
            'custom.holdIn': 'Hold',
            'custom.out': 'Breathe out',
            'custom.holdOut': 'Hold',
            'off': 'Off',
            'bpmHint': 'One breath takes {c} seconds, about {n} breaths per minute.',
            'quick.coherent': 'Coherent',
            'quick.relax': 'Relax',
            'quick.478': '4-7-8',
            'quick.tactical': 'Tactical',
            'quick.triangle': 'Triangle',

            // techniques
            'sigh.name': 'Cyclic sighing',
            'sigh.tagline': 'The quickest way to calm down',
            'sigh.intro': 'Two breaths in through the nose, a long one then a short extra sip, followed by a long, slow breath out. In a 2023 Stanford study, five minutes a day lifted mood more than meditation.',
            'sigh.steps': [
                'Breathe in through your nose until your lungs are nearly full.',
                'Take a short second sip of air through your nose to fill them completely.',
                'Breathe out slowly through your mouth until your lungs are empty.',
                'Keep going for about five minutes.'
            ],
            'sigh.note': 'Every pace keeps the breath out about twice as long as the two breaths in. That long, slow exhale is what calms you down.',
            'sigh.describe': 'Breathe in {a} s, sip {b} s, breathe out {c} s',
            'box.name': 'Box breathing',
            'box.tagline': 'Focus and steady nerves',
            'box.intro': 'Four equal sides: breathe in, hold, breathe out, hold. Used by athletes, first responders and the US Navy SEALs to stay calm and clear under pressure.',
            'box.steps': [
                'Breathe in through your nose.',
                'Hold with your lungs full.',
                'Breathe out slowly.',
                'Hold with your lungs empty, then begin again.'
            ],
            'box.note': 'New to it? Start with 3 seconds per side. Comfortable? Try 5 or 6.',
            'wimhof.name': 'Wim Hof',
            'wimhof.tagline': 'Energise and reset',
            'wimhof.intro': 'Rounds of deep, quick breaths, then a hold on empty lungs for as long as feels comfortable, then a deep recovery breath. Many people feel energised and clear-headed afterwards.',
            'wimhof.caution': 'Always sit or lie down. Never practise in or near water, while driving, or anywhere fainting could be dangerous. Tingling and light-headedness are common; stop if you feel unwell. If you are pregnant or have epilepsy, heart problems or high blood pressure, ask a doctor first.',
            'wimhof.steps': [
                'Breathe in fully, then let the air go without forcing it out. Follow the rhythm.',
                'After the last breath, breathe out and hold with empty lungs. Tap “Breathe in” when you need air.',
                'Take a deep breath in and hold it for 15 seconds, then let go. That is one round.'
            ],
            'wimhof.note': 'Your hold times are shown at the end.',
            'control.pace': 'Pace',
            'control.eachSide': 'Each side',
            'control.breaths': 'Breaths',
            'control.rounds': 'Rounds',
            'pace.quick': 'Quick',
            'pace.steady': 'Steady',
            'pace.slow': 'Slow',
            'pace.deep': 'Deep',
            'pace.medium': 'Medium',
            'pace.fast': 'Fast',

            // sounds
            'sounds.title': 'Sounds',
            'sounds.cue': 'Breathing cue',
            'cue.bowl': 'Bowl',
            'cue.chime': 'Chime',
            'cue.tone': 'Tone',
            'cue.off': 'Off',
            'sounds.cueVolume': 'Cue volume',
            'sounds.ambience': 'Ambience',
            'sounds.mixHint': 'mix as many as you like',
            'amb.rain': 'Rain',
            'amb.ocean': 'Ocean',
            'amb.stream': 'Stream',
            'amb.forest': 'Forest',
            'amb.fireplace': 'Fire',
            'amb.night': 'Night',
            'amb.wind': 'Wind',
            'amb.brown': 'Noise',

            // settings
            'settings.title': 'Settings',
            'settings.language': 'Language',
            'settings.length': 'Session length',
            'settings.visual': 'Visual',
            'visual.shape': 'Shape',
            'visual.wave': 'Wave',
            'settings.theme': 'Theme',
            'settings.options': 'Options',
            'opt.prepare': '3-second “get ready” countdown',
            'opt.vibrate': 'Vibrate on each phase',
            'opt.wake': 'Keep screen on during session',
            'length.min': ({ n }) => `${n} min`,
            'length.none': 'No limit',
            'theme.day': 'Day',
            'theme.sunrise': 'Sunrise',
            'theme.meadow': 'Meadow',
            'theme.lavender': 'Lavender',
            'theme.lagoon': 'Lagoon',
            'theme.night': 'Night',
            'theme.dusk': 'Dusk',
            'theme.forest': 'Forest',
            'about.title': 'About & sound credits',
            'about.text': 'Breathe is a calm paced-breathing guide. Follow the moving dot: it rises as you breathe in, falls as you breathe out, and travels sideways while you hold. Everything runs on your device. This app is not medical advice.',
            'about.recordings': 'Ambient recordings (via the open-source <a href="https://github.com/rafaelmardojai/blanket" target="_blank" rel="noopener">Blanket</a> project):',
            'about.publicDomain': 'public domain',
            'about.footer': 'Recordings were edited by the Blanket project and re-encoded and volume-matched for this app. Bowl, chime and tone cues are synthesised live.',

            // reminders
            'reminders.title': 'Reminders',
            'reminders.intro': 'Reminders are added to your phone’s calendar, so they reach you even when the app is closed. Tap one to come straight back here.',
            'reminders.times': 'Times',
            'reminders.add': '+ Add a time',
            'reminders.repeat': 'Days',
            'days.daily': 'Every day',
            'days.sunthu': 'Sun–Thu',
            'days.weekdays': 'Mon–Fri',
            'reminders.calendar': 'Add to your calendar',
            'reminders.google': 'Google Calendar',
            'reminders.googleAt': 'Google Calendar · {time}',
            'reminders.ics': 'Apple, Samsung & other calendars',
            'reminders.hint': 'Google Calendar opens once per time. If the reminder alert comes early, change it to “At time of event”.',
            'aria.reminderTime': 'Reminder time',
            'aria.removeTime': 'Remove this time',
            'aria.backSettings': 'Back to settings',
            'event.title': 'Time to breathe',
            'event.details': 'A few calm minutes ({min} min). Open Breathe: {url}'
        },

        he: {
            'app.title': 'נשימה',
            'brand': 'נשימה',

            'ready': 'מוכנים',
            'paused': 'בהשהיה',
            'pressPlayContinue': 'לחצו על הפעלה כדי להמשיך',
            'getReady': 'היכונו',
            'sitOrLie': 'שבו או שכבו',
            'breathsPerMinute': '{n} נשימות בדקה',
            'wimhofIdle': '{rounds} × {breaths} נשימות',
            'timeLeft': 'נותרו {t}',
            'lastBreath': 'נשימה אחרונה',
            'breathCount': ({ n }) => (n === 1 ? 'נשימה אחת' : `${n} נשימות`),
            'roundOf': 'סבב {r} מתוך {total}',
            'next': 'שאיפה',
            'unit.min': 'דק׳',
            'unit.open': 'חופשי',
            'unit.s': 'ש׳',
            'rounds': ({ n }) => (n === 1 ? 'סבב' : 'סבבים'),
            'roundsCount': ({ n }) => (n === 1 ? 'סבב אחד' : `${n} סבבים`),
            'aria.sounds': 'צלילים',
            'aria.settings': 'הגדרות',
            'aria.pattern': 'החלפת תרגיל נשימה',
            'aria.length': 'משך האימון',
            'aria.start': 'התחלה',
            'aria.pause': 'השהיה',
            'aria.stop': 'סיום האימון',
            'aria.close': 'סגירה',
            'aria.back': 'חזרה',
            'aria.less': 'פחות',
            'aria.more': 'יותר',

            'step.in': 'שאיפה',
            'step.top': 'עוד שאיפה קצרה',
            'step.holdIn': 'עצירה',
            'step.out': 'נשיפה',
            'step.holdOut': 'עצירה',
            'step.outSlow': 'נשיפה איטית',
            'step.letGo': 'שחרור',
            'step.deepIn': 'שאיפה עמוקה',
            'step.retain': 'עצירה, ריאות ריקות',

            'done.title': 'כל הכבוד',
            'done.time': 'זמן',
            'done.breaths': 'נשימות',
            'done.holds': 'זמני עצירה: {list}',
            'done.button': 'סיום',

            'breathing.title': 'תרגילי נשימה',
            'tab.techniques': 'טכניקות',
            'tab.custom': 'מותאם אישית',
            'howTo': 'איך עושים את זה',
            'start': 'התחלה',
            'custom': 'מותאם אישית',
            'custom.in': 'שאיפה',
            'custom.holdIn': 'עצירה',
            'custom.out': 'נשיפה',
            'custom.holdOut': 'עצירה',
            'off': 'כבוי',
            'bpmHint': 'נשימה אחת נמשכת {c} שניות, בערך {n} נשימות בדקה.',
            'quick.coherent': 'קוהרנטית',
            'quick.relax': 'הרפיה',
            'quick.478': '4-7-8',
            'quick.tactical': 'טקטית',
            'quick.triangle': 'משולש',

            'sigh.name': 'אנחה מחזורית',
            'sigh.tagline': 'הדרך המהירה ביותר להירגע',
            'sigh.intro': 'שתי שאיפות דרך האף, ארוכה ואחריה עוד שאיפה קצרה, ואז נשיפה ארוכה ואיטית. במחקר של אוניברסיטת סטנפורד מ־2023, חמש דקות ביום שיפרו את מצב הרוח יותר ממדיטציה.',
            'sigh.steps': [
                'שאפו דרך האף עד שהריאות כמעט מלאות.',
                'קחו עוד שאיפה קצרה דרך האף כדי למלא אותן עד הסוף.',
                'נשפו לאט דרך הפה עד שהריאות מתרוקנות.',
                'המשיכו כך כחמש דקות.'
            ],
            'sigh.note': 'בכל קצב, הנשיפה ארוכה בערך פי שניים משתי השאיפות יחד. הנשיפה הארוכה והאיטית היא מה שמרגיע.',
            'sigh.describe': 'שאיפה {a} ש׳, שאיפה קצרה {b} ש׳, נשיפה {c} ש׳',
            'box.name': 'נשימת קופסה',
            'box.tagline': 'ריכוז ושקט תחת לחץ',
            'box.intro': 'ארבע צלעות שוות: שאיפה, עצירה, נשיפה, עצירה. ספורטאים, צוותי חירום ולוחמי הקומנדו של הצי האמריקאי משתמשים בה כדי להישאר רגועים וממוקדים תחת לחץ.',
            'box.steps': [
                'שאפו דרך האף.',
                'עצרו כשהריאות מלאות.',
                'נשפו לאט.',
                'עצרו כשהריאות ריקות, ואז התחילו מחדש.'
            ],
            'box.note': 'חדשים בזה? התחילו ב־3 שניות לכל צלע. נוח לכם? נסו 5 או 6.',
            'wimhof.name': 'וים הוף',
            'wimhof.tagline': 'אנרגיה ואיפוס',
            'wimhof.intro': 'סבבים של נשימות עמוקות ומהירות, אחריהם עצירה עם ריאות ריקות כל עוד זה נוח, ולבסוף נשימת התאוששות עמוקה. אנשים רבים מרגישים אחר כך מלאי אנרגיה וצלולים.',
            'wimhof.caution': 'תמיד בישיבה או בשכיבה. לעולם לא במים או לידם, בזמן נהיגה, או בכל מקום שבו התעלפות עלולה להיות מסוכנת. עקצוצים וסחרחורת קלה הם תופעה נפוצה; הפסיקו אם אתם לא מרגישים טוב. בהיריון, או אם יש לכם אפילפסיה, בעיות לב או לחץ דם גבוה, התייעצו קודם עם רופא.',
            'wimhof.steps': [
                'שאפו עמוק, ואז שחררו את האוויר בלי לדחוף אותו החוצה. עקבו אחרי הקצב.',
                'אחרי הנשימה האחרונה, נשפו ועצרו עם ריאות ריקות. לחצו על „שאיפה” כשאתם צריכים אוויר.',
                'שאפו עמוק והחזיקו 15 שניות, ואז שחררו. זה סבב אחד.'
            ],
            'wimhof.note': 'זמני העצירה שלכם יוצגו בסוף.',
            'control.pace': 'קצב',
            'control.eachSide': 'כל צלע',
            'control.breaths': 'נשימות',
            'control.rounds': 'סבבים',
            'pace.quick': 'מהיר',
            'pace.steady': 'יציב',
            'pace.slow': 'איטי',
            'pace.deep': 'עמוק',
            'pace.medium': 'בינוני',
            'pace.fast': 'מהיר',

            'sounds.title': 'צלילים',
            'sounds.cue': 'צליל הכוונה',
            'cue.bowl': 'קערה',
            'cue.chime': 'פעמון',
            'cue.tone': 'צליל רציף',
            'cue.off': 'כבוי',
            'sounds.cueVolume': 'עוצמת הצליל',
            'sounds.ambience': 'צלילי רקע',
            'sounds.mixHint': 'אפשר לשלב כמה שרוצים',
            'amb.rain': 'גשם',
            'amb.ocean': 'ים',
            'amb.stream': 'נחל',
            'amb.forest': 'יער',
            'amb.fireplace': 'אח בוערת',
            'amb.night': 'לילה',
            'amb.wind': 'רוח',
            'amb.brown': 'רעש רך',

            'settings.title': 'הגדרות',
            'settings.language': 'שפה',
            'settings.length': 'משך האימון',
            'settings.visual': 'תצוגה',
            'visual.shape': 'צורה',
            'visual.wave': 'גל',
            'settings.theme': 'ערכת צבעים',
            'settings.options': 'אפשרויות',
            'opt.prepare': 'ספירה לאחור של 3 שניות לפני ההתחלה',
            'opt.vibrate': 'רטט בכל שלב',
            'opt.wake': 'המסך נשאר דולק במהלך האימון',
            'length.min': ({ n }) => (n === 1 ? 'דקה' : `${n} דק׳`),
            'length.none': 'ללא הגבלה',
            'theme.day': 'יום',
            'theme.sunrise': 'זריחה',
            'theme.meadow': 'אחו',
            'theme.lavender': 'לבנדר',
            'theme.lagoon': 'לגונה',
            'theme.night': 'לילה',
            'theme.dusk': 'דמדומים',
            'theme.forest': 'יער',
            'about.title': 'אודות וקרדיטים לצלילים',
            'about.text': '„נשימה” היא מדריך רגוע לנשימה בקצב. עקבו אחרי הנקודה: היא עולה כשאתם שואפים, יורדת כשאתם נושפים, וזזה הצידה בזמן עצירה. הכול פועל במכשיר שלכם. האפליקציה אינה מהווה ייעוץ רפואי.',
            'about.recordings': 'הקלטות הרקע (דרך פרויקט הקוד הפתוח <a href="https://github.com/rafaelmardojai/blanket" target="_blank" rel="noopener">Blanket</a>):',
            'about.publicDomain': 'נחלת הכלל',
            'about.footer': 'ההקלטות נערכו על ידי פרויקט Blanket, והומרו ואוזנו בעוצמה עבור האפליקציה. צלילי הקערה, הפעמון והצליל הרציף נוצרים בזמן אמת.',

            'reminders.title': 'תזכורות',
            'reminders.intro': 'התזכורות נכנסות ליומן בטלפון, כך שהן מגיעות גם כשהאפליקציה סגורה. לחיצה על תזכורת תחזיר אתכם ישר לכאן.',
            'reminders.times': 'שעות',
            'reminders.add': '+ הוספת שעה',
            'reminders.repeat': 'ימים',
            'days.daily': 'כל יום',
            'days.sunthu': 'א׳–ה׳',
            'days.weekdays': 'ב׳–ו׳',
            'reminders.calendar': 'הוספה ליומן',
            'reminders.google': 'יומן Google',
            'reminders.googleAt': 'יומן Google · {time}',
            'reminders.ics': 'Apple, Samsung ויומנים אחרים',
            'reminders.hint': 'יומן Google נפתח פעם אחת לכל שעה. אם ההתראה מגיעה מוקדם מדי, שנו אותה ל„בזמן האירוע”.',
            'aria.reminderTime': 'שעת התזכורת',
            'aria.removeTime': 'הסרת השעה',
            'aria.backSettings': 'חזרה להגדרות',
            'event.title': 'זמן לנשום',
            'event.details': 'כמה דקות של רוגע ({min} דק׳). לפתיחת האפליקציה: {url}'
        }
    };

    const LANGUAGES = [['en', 'English'], ['he', 'עברית']];
    let lang = 'en';

    function has(key) {
        return key in STRINGS[lang] || key in STRINGS.en;
    }

    // t('timeLeft', { t: '4:53' }) → '4:53 left'. Arrays (like how-to steps) come back as they are.
    function t(key, vars = {}) {
        const s = key in STRINGS[lang] ? STRINGS[lang][key] : STRINGS.en[key];
        if (s === undefined) return key;
        if (typeof s === 'function') return s(vars);
        if (typeof s !== 'string') return s;
        return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
    }

    // The phone's own language decides the first-time choice.
    function detect() {
        const prefs = navigator.languages || [navigator.language || 'en'];
        return prefs.some(l => /^(he|iw)\b/i.test(l)) ? 'he' : 'en';
    }

    function setLanguage(code) {
        lang = STRINGS[code] ? code : 'en';
        const root = document.documentElement;
        root.lang = lang;
        root.dir = lang === 'he' ? 'rtl' : 'ltr';
        document.title = t('app.title');
        document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
        document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
        document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    }

    return { t, has, detect, setLanguage, LANGUAGES, get lang() { return lang; } };
})();
