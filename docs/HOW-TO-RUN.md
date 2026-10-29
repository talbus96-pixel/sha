# How to run the app

This guide assumes no technical background. Pick the option that fits you.

- **Option A**: open it on your computer from a downloaded file (quickest, about 2 minutes, computer only).
- **Option B**: put it online for free with GitHub Pages, so you get a web address that works on **any phone and any computer**. It also lets you add the app to your phone's home screen like a real app. **Recommended.**

---

## Option A: open it on your computer (Chrome)

1. Go to the project page on GitHub: `https://github.com/talbus96-pixel/breath-app`
2. Near the top of the page, click the green **Code** button.
3. In the menu that opens, click **Download ZIP**. A file named something like `breath-app-main.zip` is saved to your **Downloads** folder.
4. Open your **Downloads** folder:
   - **Windows:** open the yellow folder icon (File Explorer) at the bottom of the screen, then click **Downloads** on the left.
   - **Mac:** click the smiling-face icon (Finder) in the Dock at the bottom of the screen, then click **Downloads** on the left.
5. Unpack the ZIP file:
   - **Windows:** right-click the ZIP file, choose **Extract All…**, then click **Extract**.
   - **Mac:** double-click the ZIP file. A normal folder appears next to it.
6. Open the new folder. Find the file named **`index.html`**.
7. Right-click `index.html` → **Open with** → **Google Chrome**.
8. The app opens in Chrome. Click **Start** to begin.

> Tip: the first time you press **Start**, or switch on a sound, Chrome may need that click before it will play any sound. That's normal.

In this option, the **nature sounds (Ambience)**, "install on phone" and "works offline" don't work. Chrome blocks a page opened from a file from loading other files. The breathing guide and the bowl/chime/tone cues still work. For everything, use Option B.

---

## Option B: put it online for free (works on phones too)

GitHub Pages is a free service that turns this project into a real website. You only set it up once.

### Step 1: make the code available on the main branch

Right now the files live on a branch (a separate working copy) named `claude/upbeat-clarke-xg2twz`. GitHub Pages needs to know which branch to publish.

1. Go to `https://github.com/talbus96-pixel/breath-app`
2. If you see a yellow box saying the branch "had recent pushes" with a green **Compare & pull request** button, click it. Then click **Create pull request**, and then **Merge pull request** → **Confirm merge**. Your files are now on the main branch.
3. If there was no yellow box and the project page already shows the files (`index.html`, `README.md`…), you can skip this step.

### Step 2: switch on GitHub Pages

1. On the project page, click **Settings** (the gear icon, in the row of tabs near the top. If you don't see it, click the **⋯** menu on that row).
2. In the list on the left, click **Pages**.
3. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** (or the branch that holds the files), leave the folder as **/ (root)**, and click **Save**.
5. Wait 1–2 minutes, then refresh the page. A box appears at the top: **"Your site is live at …"**. The address will be:

   **`https://talbus96-pixel.github.io/breath-app/`**

6. Click that address to open the app. You can send this link to your phone (by email or WhatsApp to yourself, for example).

### Step 3: add it to your phone's home screen (optional, but nice)

Once it's on your home screen, it opens full-screen like a normal app, with its own icon, and works without internet.

**Android (Chrome):**
1. Open the link above in **Chrome**.
2. Tap the **⋮** (three dots) at the top-right.
3. Tap **Add to Home screen** (or **Install app**), then **Install** / **Add**.
4. The "Breathe" icon is now on your home screen.

**iPhone (Safari):**
1. Open the link above in **Safari** (the blue compass app). Chrome on iPhone can't do this step.
2. Tap the **Share** button (a square with an arrow pointing up, at the bottom of the screen).
3. Scroll down and tap **Add to Home Screen**, then **Add** at the top-right.
4. The "Breathe" icon is now on your home screen.

### Sound on a phone

- **iPhone:** if you hear nothing, check the small switch on the side of the phone. Newer iPhones play the app's sound even on silent; older ones need the switch set to ring (no orange showing).
- Turn the volume up with the phone's side buttons. The app's own sliders (in 🔊 Sounds) only balance the sounds against each other.

---

## After you change the app

- **Option A:** save the file, then go back to Chrome and press the refresh button (or **Ctrl+R** on Windows / **Cmd+R** on Mac).
- **Option B:** the website updates by itself 1–2 minutes after the changes reach the main branch. On a phone where the app is installed, close it fully and open it again (sometimes twice) to get the new version.
  - Developer note: when you change files, also bump `CACHE_VERSION` in `service-worker.js` (for example `breathe-v1` → `breathe-v2`). This makes sure phones drop the old copy they saved for offline use.

## For developers: running a local server

The offline/install features need the app to be served over `http://`, not opened as a file. From the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in Chrome. To test on a phone on the same Wi-Fi network, open `http://<your-computer's-IP>:8000` on the phone. Note: installing and offline mode only work on `localhost` or on `https://` addresses, so for real phone testing use GitHub Pages.
