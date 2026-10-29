# How the code works

All of the app lives in `index.html`. It has three parts, top to bottom:

1. **`<style>`**: colours, sizes, and layout. The main colours are set once at the top, under `:root`:
   - `--bg-color` (cream background)
   - `--shape-color` (blue)
   - `--ball-color` (orange)

   The `@media (max-width: 600px)` block at the end of the styles holds the phone layout.
2. **`<body>`**: the two screens:
   - `#view-standard`: the main breathing screen
   - `#view-music`: the Music Sync screen

   Only the one with the class `active` is shown.
3. **`<script>`**: all the behaviour, in the sections below.

## Script sections

### Shared audio (`initAudio`)
- Creates one Web Audio `AudioContext` the first time the user clicks something. Browsers block sound until the user interacts with the page.
- Signal path: every sound → `masterGainNode` (the volume slider, multiplied by 3.5) → `limiter` (a compressor that stops clipping) → speakers.

### Section 1: Standard visualizer
| Piece | What it does |
|---|---|
| `phases` | The pattern in seconds: `[inhale, hold1, exhale, hold2]`. Set by the preset buttons (`data-preset="4,7,8,0"`) or the custom inputs. |
| `animateStd()` | Runs every screen refresh. Moves time forward, counts down the session timer, and moves to the next step when the current one finishes (skipping steps set to 0). Plays a tone and vibrates on each change. |
| `getGeometry()` | Decides the shape: a **line** if only 2 steps are active, a **square** if all four are equal, a **rectangle** for A-B-A-B patterns, otherwise corners placed around a circle in proportion to each step's length. |
| `drawStd()` | Draws the shape, the ball (positioned along the current edge), and the fading trail on `#canvas-standard`. |
| `easeInOutSine()` | The smooth speed-up/slow-down used for Inhale and Exhale. |
| `playPhaseTone()` | The bell-like tone: C4 for Inhale, G3 for Exhale, A3 for Hold, each with a soft overtone an octave above. |
| `triggerHaptic()` | Vibration patterns (Android only). |
| `createCampfireSound()`, `createWaterfallSound()`, `createPinkNoiseSound()` | The ambient sounds, built from filtered random noise. |
| `resetInactivity()` | Zen mode: adds the `zen-mode` class to `<body>` after 3.5 s of no movement, which hides every `.ui-panel`. |

### Section 2: Music Sync
| Piece | What it does |
|---|---|
| `handleMusicUpload()` | Reads the chosen file and decodes it into audio data (`trackBuffer`). |
| `computeBPMAndInit()` | Tempo detection. It filters the first 90 s of the song down to the bass (around 100 Hz), measures its loudness 100 times per second, then finds the repeat interval between 60 and 180 BPM that best matches itself (autocorrelation). The first downbeat is estimated from the loudest moment in the first 15 s. |
| `calculateAdaptiveFormula()` | Turns the tempo into a breathing pattern. Each breath takes the fewest whole bars that last at least 4 s, multiplied by the Slower/Faster setting (`barsMultiplier`). If that's 7.5 s or longer, a hold of about 2 s (whole beats) is taken out of it after each breath. |
| `startMusicPlayback()` / `pauseMusicPlayback()` / `stopMusicTrack()` | Play control. Note: the music plays straight to the speakers, **not** through the master volume. |
| `syncMusicDownbeat()` | The "Sync Beat" button and spacebar: restarts the breathing cycle from the current moment of the song. |
| `animateMusic()` / `drawMusic()` | Every frame, works out where in the breath cycle the song is, and draws the line, the ball and the beat ring on `#canvas-music`. |

### Offline / install support (end of the script)
Registers `service-worker.js` when the page is served from a web address (not from a file). The service worker loads fresh files when online and falls back to saved copies when offline. `manifest.webmanifest` gives the app its name, colours and icons when it's added to a home screen.

## Common changes and where to make them
- **Add a routine:** copy a `<button class="preset-btn" data-preset="...">` line in the Routines section of the HTML and change the numbers and the name.
- **Change colours:** edit the `:root` variables. The drawing code also has the colours written in directly (`'#4A90E2'`, `'#E76F51'`, `rgba(231, 111, 81, …)`), so change those too.
- **Change zen-mode delay:** the `3500` (milliseconds) in `resetInactivity()`.
- **Change tones:** the frequencies in `playPhaseTone()`.
- **Phone layout:** the `@media (max-width: 600px)` block in the styles.
- After any change, bump `CACHE_VERSION` in `service-worker.js` so installed copies update.
