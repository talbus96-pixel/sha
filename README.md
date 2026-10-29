# Breathe

A calm, minimalist breathing guide.

A small dot travels along a line: **up while you breathe in, down while you breathe out, and sideways while you hold**. Your breathing timings draw the shape: Box breathing is a square, 4-7-8 is a triangle, and a pattern with no holds is a loop. If you prefer, a **wave** view shows the same thing as a scrolling curve. Gentle sounds mark each step, and you can add real nature recordings in the background.

Everything runs in the web browser, on a computer or a phone. There's no account, nothing to download from an app store, and once the app has been opened it also works without internet.

- **How to open it on a computer or phone:** [docs/HOW-TO-RUN.md](docs/HOW-TO-RUN.md)
- **How the code works (for making changes):** [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md)

---

## What you see

The main screen is kept minimal:
- **At the top:** what to do now ("Breathe in", "Hold", "Breathe out"…) and the seconds left, plus two small icons: 🔊 **Sounds** and ⚙ **Settings**.
- **In the middle:** the shape and the moving dot. The side you're on now lights up. Breathing sides are blue, holding sides are lilac.
- **At the bottom:**
  - the technique's name (tap it to choose another)
  - the **play / pause** button
  - the session length on the left
  - a **stop** button that appears once a session has started
  - the time left and how many breaths you've taken
- **Calm mode:** while you breathe, the buttons fade away after 4 seconds. Touch the screen to bring them back.
- **Finished screen:** when time is up, the app waits for your last breath out, rings a soft closing bell, and shows your time and number of breaths.

## Techniques

Tap the technique name at the bottom → **Techniques**. Each one has a short explanation, a fold-out "How to do it", and a few controls. Press **Start** to begin.

| Technique | What it is | You can set |
|---|---|---|
| **Cyclic sighing** | Breathe in through the nose, take a short extra sip of air to fill the lungs, then a long, slow breath out. In a 2023 Stanford study, 5 minutes a day lifted mood more than meditation. | Breath in length, breath out length |
| **Box breathing** | Breathe in, hold, breathe out, hold, all the same length. Used to stay calm and focused under pressure. | The length of each side |
| **Wim Hof** | Rounds of quick, deep breaths, then a hold on empty lungs (you tap **Breathe in** when you need air), then a 15-second recovery hold. Includes a safety note. Your hold times are shown at the end. | Breaths per round, number of rounds, pace |

## Custom patterns

The **Custom** tab lets you set **Breathe in, Hold, Breathe out, Hold** yourself, in half-second steps (holds can be off). A small preview shows the shape your pattern makes. Quick picks: Coherent (5.5 · 5.5), Relax (4 · 6), 4-7-8, Tactical (4 · 2 · 4 · 2), Triangle (4 · 4 · 4).

How the shape follows the timings:
- All four steps equal → **square**
- Equal holds, but different from the breaths → **rectangle**
- Only one hold → **triangle**
- No holds at all → **loop** (the breath in is the left side going up, the breath out the right side going down; the longer step gets more of the loop)

## Sounds

**Breathing cue**: the sound at each change of step:
- **Bowl**: a Tibetan singing bowl. A higher note means breathe in, a lower note means breathe out, and a soft small "ting" means hold. The extra sip in cyclic sighing gets its own lighter note.
- **Chime**: a soft, warm chime with a similar high/low pattern.
- **Tone**: a continuous, gentle hum that swells and brightens as you breathe in and settles as you breathe out. It's good if you prefer to follow sound rather than look at the screen.
- **Off**: silence.

All cues are created live by the app, with a soft "room" echo added.

**Ambience**: real nature recordings. You can mix as many as you like, each with its own volume: Rain, Ocean, Stream, Forest (birds), Fire (crackling fireplace), Night (crickets), Wind, and Noise (soft brown noise). The recordings loop without a gap, and each one starts from a random point, so it doesn't sound the same every time. Ambience plays during your session, and while the Sounds panel is open so you can hear your mix.

In Wim Hof's quick breathing, the cue is only a soft tick, because a full bell every 2 seconds would be too much. A deep bowl marks the start of the breath hold.

## Settings

- **Session length**: 1, 3, 5, 10, 15, 20 or 30 minutes, or no limit. (Wim Hof uses rounds instead.)
- **Visual**: **Shape** (the default) or **Wave**.
- **Theme**: **Night** (deep blue, the default), **Dusk** (plum and peach), **Forest** (deep green), **Day** (light).
- **Get-ready countdown**: a 3-second countdown before the first breath.
- **Vibrate on each phase**: Android phones only. iPhones don't let websites vibrate.
- **Keep screen on**: stops the phone screen from dimming during a session.
- **About & sound credits**.

All your choices are remembered on your device.

## What was removed

The old version had a **"Music Sync"** screen. You picked a song file, the app tried to work out the song's tempo, and it paced the breathing to the beat. It was removed for three reasons:
- it often guessed the tempo wrong
- it only worked with music files saved on the device, not with Spotify or other streaming apps
- it cluttered an app that's meant to be simple

It can come back later if you miss it.

## Files

| File / folder | What it is |
|---|---|
| `index.html` | The page structure: the screen, the buttons, the panels. |
| `css/style.css` | The look: colours, themes, sizes, layout. |
| `js/programs.js` | The techniques (texts and settings), custom patterns, the timing of each step, and the shape each pattern makes. |
| `js/visual.js` | Draws the shape view and the wave view. |
| `js/app.js` | Ties it together: the session clock, the buttons and panels, saving your settings. |
| `js/audio.js` | All the sound: the bowl, chime and tone cues, and playing the nature recordings. |
| `sounds/` | The nature recordings. |
| `manifest.webmanifest`, `service-worker.js`, `icons/` | Let phones install the app on the home screen and use it without internet. |

## Sound credits

The ambient recordings come from the open-source [Blanket](https://github.com/rafaelmardojai/blanket) project. They were re-encoded and their volumes evened out for this app.

| Sound | Recorded by | License |
|---|---|---|
| [Rain](https://freesound.org/people/alex36917/sounds/524605/) | alex36917 | CC BY |
| [Ocean](https://freesound.org/people/Luftrum/sounds/48412/) | Luftrum | CC BY |
| [Stream](https://freesound.org/people/gluckose/sounds/333987/) | gluckose | CC0 |
| [Forest](https://freesound.org/people/kvgarlic/sounds/156826/) | kvgarlic | CC0 |
| [Fireplace](https://soundbible.com/1543-Fireplace.html) | ezwa | Public domain |
| [Night](https://soundbible.com/2083-Crickets-Chirping-At-Night.html) | Lisa Redfern | Public domain |
| [Wind](https://freesound.org/people/felix.blume/sounds/217506/) | felix.blume | CC0 |

"CC BY" means the sound is free to use as long as the recordist is credited. The app does this in Settings → About.

## Ideas for later

- A history screen showing your sessions per day (and Wim Hof hold records).
- Voice guidance ("breathe in… breathe out").
- More ambient recordings.
