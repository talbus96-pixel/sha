# How the code works

The app is plain HTML, CSS and JavaScript, with no build step and no libraries. Edit a file, refresh the browser, and you see the change.

```
index.html            page structure, icons, the three panels ("sheets")
css/style.css         themes and layout
js/i18n.js            all text: English, Hebrew, Russian     (global: I18n)
js/audio.js           the sound engine                       (global: Sound)
js/programs.js        techniques, step timeline, shapes      (global: Programs)
js/visual.js          draws the shape and wave views          (global: Visual)
js/reminders.js       calendar reminders (Google link, .ics)  (global: Reminders)
js/tour.js            the guided tour                         (global: Tour)
js/app.js             session clock, panels, settings        (runs once on load)
sounds/*.mp3          ambient recordings (MP3, 96 kbps, loudness-matched)
service-worker.js     offline cache
manifest.webmanifest  home-screen install info
```

## css/style.css
- **Themes** are sets of colour variables at the top (`day` is the default, plus `sunrise`, `meadow`, `lavender`, `lagoon`, `night`, `dusk`, `forest`). Colours must be written as `#rrggbb`, because the drawing code adds see-through versions of them. `app.js` sets `data-theme` on `<body>`. To add a theme, copy one of these blocks and add a matching entry to `THEMES` in `app.js`.
- The layout is built for phones first. `@media (min-width: 700px)` turns the bottom sheets into centred dialogs on larger screens, and `@media (max-height: 520px)` puts the visual and the controls side by side when a phone is held sideways.
- `body.zen` hides everything marked `.fade-ui` (calm mode). `body.running` is set while a session runs.

## js/i18n.js (`I18n`)
- Every piece of text lives in `STRINGS.en`, `STRINGS.he` and `STRINGS.ru`. If a key is missing in a language, the English text is shown. Russian plurals (1 вдох, 2 вдоха, 5 вдохов) use `ruPlural()`. `detect()` picks the first of the phone's preferred languages that the app knows.
- In the page, `data-i18n="key"` sets an element's text, `data-i18n-html` is for text containing a link, and `data-i18n-aria` sets a button's spoken label. In code, `I18n.t('timeLeft', { t: '4:53' })` fills in `{t}`. Some entries are small functions, for plurals (`breathCount`).
- `setLanguage(code)` switches the text and sets `dir="rtl"` for Hebrew. The CSS uses start/end spacing (`padding-inline`, `margin-inline-start`), so most of the layout mirrors by itself. The `[dir="rtl"]` rules at the end of `style.css` handle the rest: arrows, switches and slider fill.
- **To add a language:** copy the `en` block under a new code (e.g. `fr`), translate it, add it to `LANGUAGES` (with its name in its own script), and teach `detect()` its code. The picker in the menu's corner (`renderLanguagePicker()` in `app.js`) lists it automatically.

## js/programs.js (`Programs`)
- A breathing program is a list of **steps**. Each step has:
  - a `kind`: `in`, `top` (the extra sip of air in cyclic sighing), `holdIn` (hold with full lungs), `out` or `holdOut` (hold with empty lungs)
  - `secs`: how long it lasts
  - `from` / `to`: the lung level it moves between (0 = empty, 1 = full)
  - a `label`, the text shown on screen
- `TECHNIQUES` holds the controls for Cyclic sighing, Box and Wim Hof. Their texts are in `i18n.js` (`sigh.intro`, `box.steps`…) and are read with `Programs.text(id, field)`. A step's `label` is a translation key, looked up when it's shown. Cyclic sighing uses fixed paces (`SIGH_PACES`), which keep the breath out twice as long as the breaths in. Their settings are stored as `settings.sigh`, `settings.box` and `settings.wimhof`. `QUICK_PATTERNS` are the quick picks on the Custom tab.
- `build(settings)` turns the chosen technique into a program:
  - `{ cycle }`: steps that repeat until the session time runs out
  - `{ list }`: a fixed list with an end (Wim Hof). Wim Hof's breath hold has `secs: Infinity` and `open: true`. It lasts until the person taps "Breathe in", which calls `timeline.close()`.
- `timeline(program)` lays the steps out in time:
  - `stepAt(t)`: the step running at time t (`null` once a fixed program has ended)
  - `progress(step, t)`: how far through that step, with a smooth ease for breaths
  - `levelAt(t)`: the lung level, which is what the wave view draws
- `buildShape(steps)` makes the shape for one cycle. The dot goes **up while breathing in, down while breathing out, and sideways while holding**. Holds with full lungs go right, holds with empty lungs go left, and the breath out moves sideways by whatever amount closes the shape. A hold's width is its length divided by the breath-in length, so equal steps give a square. Cycles with no holds become a `loop`, split into arcs in proportion to each step's length.

## js/visual.js (`Visual`)
- `drawShape(ctx, box, shape, activeEdge, dot, trail)` draws the shape and the dot with a soft fading trail. `shapePoint(step, progress, box)` gives the dot's position.
- `drawWave(ctx, box, levelAt, t, windowSecs)` draws the scrolling curve. The dot stays 30% from the left, so the part to its right shows what's coming.
- Colours come from the theme's CSS variables (`--accent`, `--hold`, `--ball`…). `readColors()` refreshes them after a theme change.

## js/app.js
| Piece | What it does |
|---|---|
| `settings` / `DEFAULTS` | Everything the user chooses. Saved to `localStorage` under `breathe.settings.v2`. |
| `program`, `line` | The current program and its timeline. `rebuildProgram()` is called when the technique or pattern changes. |
| `session` | `state` is `idle`, `prepare` (get-ready countdown), `running` or `paused`. `time` counts breathing time, `clock` is the position on the timeline, and `holds` collects Wim Hof hold times. |
| `tick()` | Runs every screen frame. It moves the clock, finds the current step, and when the step changes plays its cue (`onStepStart`). When the time limit is reached, it ends after the next full breath out. |
| `render()` | Draws the shape or the wave for the current moment. |
| Menu (`#sheet-settings`) | One sheet of folding sections (`.fold`, `data-fold="sounds"`…). `openFold(key)` opens one and closes the rest, and `updateSummaries()` writes the current choice on each heading. `openSheet('sheet-settings', 'length')` opens the menu with a section already open. |
| Mute | `settings.muted`, toggled by the speaker button. `Sound.setMuted()` silences everything at the master volume. |
| Breathing sheet | The Techniques tab is a list leading to a detail page (`showTechnique`, controls built by `renderTechControls`). The Custom tab is the steppers plus a live shape preview (`renderCustom`, `drawPreview`). |
| Wake lock, vibration, calm mode | As the names say. Switching apps pauses the session, because a web page can't keep accurate time in the background. |

## js/reminders.js (`Reminders`)
- Web pages can't schedule their own notifications while closed, so reminders become **repeating calendar events**.
- `googleLink(time, days, minutes)` builds a Google Calendar "new event" link that repeats daily or on weekdays. `icsFile()` / `downloadIcs()` build one standard calendar file (.ics) holding every time, each with an alert at the start.
- Times are written without a time zone ("floating"), so 9:00 means 9:00 wherever the phone is. The event links back to the app (the public site address when the page isn't hosted there).
- Settings live in `settings.reminders` (`times`, `days`). The sheet is built in `renderReminders()` in `app.js`.

## js/tour.js (`Tour`)
- `STEPS` lists what to light up (a CSS selector, or `null` for a message in the middle of the screen). Each step's title and text are `tour.<key>.title` / `tour.<key>.text` in `i18n.js`.
- `screen` says which panel must be showing (`'breathing'`, `'technique'`, `'menu'`, or none for the main screen). The app's `tourHooks.show(screen)` switches panels, so Back and Next always land on the right one.
- `tap: true` steps hide Next and pulse the highlight. A tap inside it presses the real button underneath (`tapTarget()`), and the tour moves on once the new panel has slid in.
- The dimming is one element (`.tour-spot`) with a huge shadow around it. It slides over each target, and the card goes below it, above it, or (for big areas) along the bottom of the screen.
- Started by the tour button at the top of the menu, and automatically once on a person's first visit. The app closes any open panel and pauses a running session first.
- **To add a step:** add an entry to `STEPS`, then add its two texts in both languages.

## js/audio.js (`Sound`)
- `Sound.ensure()` creates the audio system. Browsers only allow this after a tap or click, so it's called from button handlers. On iPhone it also asks to play even when the silent switch is on (Safari 17+).
- **Signal path**:
  - cues → `cueBus` (cue volume) → master, plus a reverb send
  - ambience → one gain per sound → `ambientBus` (on/off "gate") → master
  - master → gentle compressor → speakers
- **Cues**:
  - `bowl()`: five inharmonic overtones, each played as two slightly detuned tones so they shimmer
  - `chime()`: a warm fundamental with soft overtones
  - `mallet()`: a tiny noise "tap" that makes struck sounds feel real
  - the breath tone: a quiet chord through a low-pass filter. `shapeTone()` opens the filter and raises the volume over the length of each inhale, and does the reverse on the exhale.
  - The notes are in `BOWL_NOTES` and `CHIME_NOTES`.
  - `cue(kind)` picks the sound for each step kind. `powerIn` (Wim Hof's quick breaths) only plays a soft tick, and `retain` (the start of the Wim Hof hold) plays a deep bowl.
- **Reverb**: `makeImpulse()` generates a soft, dark room echo, so no reverb recording is needed.
- **Ambience**: `getBuffer()` loads and decodes a recording. `makeSeamless()` blends its last 3 seconds into its first 3, so it loops forever with no click or gap. `setAmbient(id, on, level)` fades a sound in or out. `setAmbientGate(open)` fades all ambience together, at session start, pause and end.
- `cue(phase, seconds)` is called at each phase change. `pause()`, `resume()` and `finish()` handle the tone voice and the closing bells.

## Common changes
- **Add a quick pattern:** add a line to `QUICK_PATTERNS` in `js/programs.js`.
- **Add a technique:**
  1. Add an entry to `TECHNIQUES` in `js/programs.js`, with its texts, `controls` and `summary`.
  2. Add a branch to `build()` that turns its settings into steps.
  3. Add its default settings to `DEFAULTS` in `js/app.js`.
- **Add an ambient sound:**
  1. Put a looping `.mp3` file in `sounds/`.
  2. Add it to `AMBIENT_FILES` in `js/audio.js`.
  3. Add it to `AMBIENTS` in `js/app.js`, with an icon (`<symbol id="i-…">` in `index.html`).
  4. Add it to the list in `service-worker.js`.

  To convert and loudness-match a recording:
  ```bash
  ffmpeg -i input.wav -t 90 -af "loudnorm=I=-24:TP=-3:LRA=11" -c:a libmp3lame -b:a 96k sounds/name.mp3
  ```
- **Change cue notes:** `BOWL_NOTES` / `CHIME_NOTES` in `js/audio.js`.
- **Change calm-mode delay:** `ZEN_DELAY` in `js/app.js`.
- **After any change:** bump `CACHE_VERSION` in `service-worker.js` (e.g. `breathe-v3` → `breathe-v4`), so phones that installed the app pick up the new version.
