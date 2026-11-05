# Sha · future plans

Ideas and decisions saved for later, in the owner's order.

## Next up
1. **Notifications from the app itself**, instead of calendar reminders.
   - The calendar route is clumsy:
     - The Google Calendar button needs you signed in to Google in that browser.
     - The calendar file (.ics) must be opened with Samsung Calendar on Android, because the Google Calendar app on Android can't open these files.
   - Plan: push notifications sent by a small free server (Supabase). People using the app won't log in anywhere; they only allow notifications. On iPhone this works only for an app added to the home screen (iOS 16.4+).
   - Supabase's free plan may pause a project after about a week without activity. Check this when building.
2. **Research page: content.** The page is built (menu → Learn) but hidden until the owner supplies studies. They go in `js/research.js` (format explained at the top of that file), with a title, a one-line summary and a link, in Hebrew, English and Russian.
3. **Tour:** needs new steps for the Progress card, the Learn card (once it has content), the light/dark switch, the shape/wave buttons, and the dot-color picker. None of these are in the 21-step tour yet.

## To think about, not to build yet
These are open questions the owner wants to keep thinking about. No code for them until there's a clearer answer.

1. **The cue sounds and tracking by ear.** Bowl, Chime, Kalimba, Marimba and Harp all leave a beautiful ring that fades — lovely to listen to, but the fade means you can't follow the breathing rhythm by sound alone once it's gone. "Tone" doesn't have this problem, since it never stops until the phase changes. Question to settle: should there be a cue style built to be followed by ear (a sound that still marks the passing of time, not just the start of a phase)? Or is the ringing meant to be atmosphere, with the visual carrying the rhythm?
2. **Paid extras in Look.** More developed backgrounds (nicer wallpapers) and more elaborate dot designs, offered as a paid option later. Needs a plan for payment and for what stays free.
3. **A personal "best pace" finder**, so someone doesn't have to discover by trial and error (as the owner did with box breathing) which pace suits them. Open questions: does the app recommend, or just record what was tried and let the person compare later? A pace that feels wrong on day one can turn out to be the best fit after a few days, so a single rating after one try isn't enough — any design needs to account for that.

## Also noted
- Rewrite the guided tour's texts (21 steps) if wanted.
- Have a native speaker check the Russian, and review the Hebrew wording.
- Voice guidance, more nature sounds.
- A real Android app / Google Play listing via PWABuilder ($25 one-time Google Play fee).
- A trademark check on "Sha" before commercial publishing (see README → About the name). Backup name: **Lev**.

## Good to know
- The app's address is **https://talbus96-pixel.github.io/sha/**. The project was renamed from breath-app.
- On the owner's Galaxy S23+, Chrome kept a broken "already installed" record from earlier attempts, so the app was installed through **Samsung Internet** instead (≡ → Add page to → Home screen).

## Done since the first plan
- Shape / wave choice moved to two small buttons on the main screen.
- Menu: Reminders below Options; About is a small underlined link.
- Default theme is now **Lagoon** (new users only; existing users keep their choice). Light/dark switch in the top bar; dark is **Night**, and the switch remembers the last light and dark theme you picked.
- Three more breathing cues: Kalimba, Marimba, Harp (Bowl and Chime unchanged). "Chime" is now פעמונית in Hebrew and Перезвон in Russian.
- "Your practice" page (menu → Progress): a calm 5-week calendar, totals, time per technique (plus how it was last set up — pace, seconds, or pattern), and the longest Wim Hof hold. Stored only on the phone.
- Safety question before Wim Hof.
- Two new full techniques: **Coherent breathing** (equal in/out, no holds) and **Wind Down** (the old "4-7-8" quick pattern, now with its own page, intro, steps and caution; the ratio stays fixed, the pace only scales it).
- A curated **dot color** picker in Look, independent of the theme.
