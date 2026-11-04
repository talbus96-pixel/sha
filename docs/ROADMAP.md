# Sha · future plans

Ideas and decisions saved for later, in the owner's order.

## Next up
1. **Notifications from the app itself**, instead of calendar reminders.
   - The calendar route is clumsy:
     - The Google Calendar button needs you signed in to Google in that browser.
     - The calendar file (.ics) must be opened with Samsung Calendar on Android, because the Google Calendar app on Android can't open these files.
   - Plan: push notifications sent by a small free server (Supabase). People using the app won't log in anywhere; they only allow notifications. On iPhone this works only for an app added to the home screen (iOS 16.4+).
   - Supabase's free plan may pause a project after about a week without activity. Check this when building.
2. **Menu changes**
   - Move **Reminders** below **Options**.
   - Make **About** less prominent: smaller, or tucked away (for example a small link at the bottom of the menu instead of a full section).
3. **More breathing cue sounds** that are as pleasant as the current ones. Keep Bowl and Chime as they are.
   - Rethink how "Chime" is translated. It's currently "bell" in Hebrew (פעמון) and Russian (Колокольчик), but the sound is a soft, warm tone. Options: Hebrew **צליל רך** or **פעמונית**; Russian **Перезвон**.
4. **Look**
   - Choose the best default among the **light** themes.
   - Add a **light / dark switch** button. Dark mode uses a dark theme chosen in advance (from Night, Dusk, Forest).
5. **Statistics page** (a screen of its own)
   - A log of the breathing sessions done: which technique, how many breaths, how much time.
   - Something that shows which days you practised, and how much, with no pressure. The goal is to encourage more practice, not to make anyone feel bad about missed days. So no streak counters that reset to zero and no red or "you missed" messages. Ideas: a calm calendar or week view where practised days simply glow, and warm, optional wording.
   - Data stays on the phone (localStorage), so no login is needed. It should also show Wim Hof hold records.
6. **Research page** (a screen of its own)
   - A short overview of each technique and of the scientific findings behind it.
   - Links to papers. **Every link is checked by hand (opened and read) before it goes in**, and the page says only what the paper actually shows. Nothing is added from memory.
   - Must be available in Hebrew, English and Russian, and clearly say the app isn't medical advice.

## Also noted
- Rewrite the guided tour's texts (21 steps) if wanted.
- Have a native speaker check the Russian, and review the Hebrew wording.
- Voice guidance, more nature sounds.
- A real Android app / Google Play listing via PWABuilder ($25 one-time Google Play fee).
- A trademark check on "Sha" before commercial publishing (see README → About the name). Backup name: **Lev**.

## Good to know
- The app's address is **https://talbus96-pixel.github.io/sha/**. The project was renamed from breath-app.
- On the owner's Galaxy S23+, Chrome kept a broken "already installed" record from earlier attempts, so the app was installed through **Samsung Internet** instead (≡ → Add page to → Home screen).
