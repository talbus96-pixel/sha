# How the code works

The app is plain HTML, CSS and JavaScript, with no build step and no libraries. Edit a file, refresh the browser, and you see the change.

```
index.html            page structure, icons, the three panels ("sheets")
css/style.css         themes and layout
js/audio.js           the sound engine                       (global: Sound)
js/programs.js        techniques, step timeline, shapes      (global: Programs)
js/visual.js          draws the shape and wave views          (global: Visual)
js/app.js             session clock, panels, settings        (runs once on load)
sounds/*.mp3          ambient recordings (MP3, 96 kbps, loudness-matched)
service-worker.js     offline cache
manifest.webmanifest  home-screen install info
```

## css/style.css
- **Themes** are sets of colour variables at the top (`day` is the default, plus `sunrise`, `meadow`, `lavender`, `lagoon`, `night`, `dusk`, `forest`). Colours must be written as `#rrggbb`, because the drawing code adds see-through versions of them. `app.js` sets `data-theme` on `<body>`. To add a theme, copy one of these blocks and add a matching entry to `THEMES` in `app.js`.
- The layout is built for phones first. `@media (min-width: 700px)` turns the bottom sheets into centred dialogs on larger screens, and `@media (max-height: 520px)` puts the visual and the controls side by side when a phone is held sideways.
- `body.zen` hides everything marked `.fade-ui` (calm mode). `body.running` is set while a session runs.

## js/programs.js (`Programs`)
- A breathing program is a list of **steps**. Each step has:
  - a `kind`: `in`, `top` (the extra sip of air in cyclic sighing), `holdIn` (hold with full lungs), `out` or `holdOut` (hold with empty lungs)
  - `secs`: how long it lasts
  - `from` / `to`: the lung level it moves between (0 = empty, 1 = full)
  - a `label`, the text shown on screen
- `TECHNIQUES` holds the texts and controls for Cyclic sighing, Box and Wim Hof. Cyclic sighing uses fixed paces (`SIGH_PACES`), which keep the breath out twice as long as the breaths in. Their settings are stored as `settings.sigh`, `settings.box` and `settings.wimhof`. `QUICK_PATTERNS` are the quick picks on the Custom tab.
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
| Breathing sheet | The Techniques tab is a list leading to a detail page (`showTechnique`, controls built by `renderTechControls`). The Custom tab is the steppers plus a live shape preview (`renderCustom`, `drawPreview`). |
| Wake lock, vibration, calm mode | As the names say. Switching apps pauses the session, because a web page can't keep accurate time in the background. |

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
