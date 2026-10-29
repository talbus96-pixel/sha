# Breathing Visualizer & Music Sync

A simple breathing-exercise web app. It shows a shape on screen with a ball moving along it to guide your breathing (in, hold, out, hold). It can play calm background sounds and a soft tone at each change. It also has a **Music Sync** mode that paces your breathing to the beat of a song you choose.

Everything runs inside the web browser. No account, no server, and no internet are needed once it's loaded. Songs you pick stay on your device and are never uploaded anywhere.

- **How to open it on a computer or phone:** see [docs/HOW-TO-RUN.md](docs/HOW-TO-RUN.md)
- **How the code works (for making changes):** see [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md)

---

## What the app does

### Screen 1: Breathing Visualizer (the main screen)

**Breathing guide**
- A blue shape is drawn in the middle of the screen. An orange ball travels along it and leaves a fading trail.
- The middle of the screen shows the current step (**Inhale / Hold / Exhale / Hold**) and how many seconds are left in it.
- The shape changes with the pattern:
  - **Square**: all four steps are the same length (Box Breathing).
  - **Rectangle**: Tactical-style patterns, e.g. 4-2-4-2.
  - **Line that grows and shrinks**: patterns with no holds (e.g. 4-0-4-0).
  - **Triangle / uneven shape**: other patterns (e.g. 4-7-8). Each corner sits further along the shape the longer its step is.
- The ball speeds up and slows down smoothly during Inhale and Exhale, so the movement feels like a natural breath.

**Routines (ready-made patterns)**
| Name | Inhale | Hold | Exhale | Hold |
|---|---|---|---|---|
| Box Breathing | 4s | 4s | 4s | 4s |
| Relaxing Breath (4-7-8) | 4s | 7s | 8s | — |
| Tactical Breath | 4s | 2s | 4s | 2s |
| Deep Calm | 4s | — | 4s | — |

**Custom Intervals**: type your own number of seconds for each of the four steps. A step set to 0 is skipped.

**Session timer**: choose how many minutes the session lasts (1 to 60, 5 by default). The countdown is at the bottom, with **Start / Pause / Reset** buttons.

**Sound & feel** (top-right bar)
- 🔊 Turns the sound on or off, and the slider sets the master volume.
- A soft tone plays at every step change. Each step has its own pitch: higher for Inhale, lower for Exhale, middle for Hold.
- 📳 **Vibration** at each step change. It works on Android phones only (iPhones don't let websites vibrate).
- **Line** slider: how thick the shape is drawn.

**Ambient Soundscapes**: three background sounds. Each has its own on/off switch and volume. They are generated live by the app (they aren't recordings):
- 🔥 Desert Campfire: low rumble plus random crackles
- 🏞️ Distant Waterfall: deep rushing water
- 🌫️ Pink Noise Bed: a soft, steady hiss

**Zen mode**: while a session is running, all the buttons fade away after 3.5 seconds without touching or moving the mouse, so only the shape is left. Move the mouse or touch the screen to bring them back.

### Screen 2: Music Sync

Open it with the **🎵 Music Sync** button.

1. Pick a song file from your device (MP3 or most other audio formats). On a computer you can also drag the file onto the page.
2. The app listens to the song and works out its **tempo** (BPM, or beats per minute) and where the first strong beat is.
3. It builds a breathing pattern that fits whole musical bars:
   - Each breath (in or out) lasts at least 4 seconds, rounded up to complete bars.
   - If a breath would last 7.5 seconds or more, the app adds a short hold of about 2 seconds (rounded to whole beats) after the inhale and after the exhale.
4. The song plays. A ball slides left and right along a line, and the line gets thicker as you breathe in. A ring pulses around the ball on every beat.

**Controls**
- **Pause / Resume, Stop**, and a slider to jump anywhere in the song.
- **Sync Beat (Space)**: if the breathing feels off the beat, press this button (or the spacebar) exactly on a strong beat. The breathing cycle restarts from that moment.
- **Slower (2x)**: makes each breath twice as long. **Faster (½x)**: makes each breath half as long.
- **← Back to Generator** stops the song and returns to the main screen.

---

## Files in this project

| File | What it is |
|---|---|
| `index.html` | **The whole app**: layout, look, and behaviour all live in this one file. |
| `manifest.webmanifest` | Lets phones "install" the app on the home screen with its own name and icon. |
| `service-worker.js` | Keeps a copy of the app on the device so it opens even without internet. |
| `icons/` | The app icon in the sizes phones and browsers need. |
| `docs/HOW-TO-RUN.md` | Step-by-step guide to opening the app on a computer and on a phone. |
| `docs/HOW-IT-WORKS.md` | A map of the code, for making changes. |

## Known issues / ideas to work on next

- **The layout is cramped on phones**, especially in portrait (upright) mode. The top bar is cut off on the left, the Routines menu covers the breathing shape, and the bottom bar spills past the edge of the screen. The Music Sync buttons don't fit well either.
- In Music Sync, the **music doesn't follow the volume slider or mute button**. Those only control the tones and background sounds.
- After **Stop** in Music Sync, the Play button says "Start", but pressing it starts the song again from the beginning without re-checking the tempo. That's fine, but worth knowing.
- The automatic tempo detection is simple. It can sometimes lock onto half or double the real tempo. The Slower/Faster and Sync Beat buttons are there to correct this.
- **iPhone:** if the ring/silent switch on the side of the phone is set to silent, the app may make no sound. Vibration isn't supported on iPhone.
- Settings (chosen routine, volumes, etc.) are not remembered when the page is reopened.
