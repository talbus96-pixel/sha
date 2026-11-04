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
3. **More ideas to consider:** the tour needs a step for the new Progress card, the light/dark switch and the shape/wave buttons (not added yet).

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
- "Your practice" page (menu → Progress): a calm 5-week calendar, totals, time per technique. Stored only on the phone.
- Safety question before Wim Hof.
