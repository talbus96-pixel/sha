// Lets the app open without internet once it has been visited, and makes it installable.
// When you change any app file, bump CACHE_VERSION so phones pick up the new version.
const CACHE_VERSION = 'breathe-v19';
const APP_FILES = [
    './',
    './index.html',
    './css/style.css',
    './js/i18n.js',
    './js/audio.js',
    './js/programs.js',
    './js/visual.js',
    './js/reminders.js',
    './js/tour.js',
    './js/app.js',
    './manifest-sha.webmanifest',
    './icons/sha.svg',
    './icons/sha-192.png',
    './icons/sha-512.png',
    './icons/sha-maskable-512.png',
    './icons/sha-apple-touch-180.png',
    './sounds/rain.mp3',
    './sounds/ocean.mp3',
    './sounds/stream.mp3',
    './sounds/forest.mp3',
    './sounds/fireplace.mp3',
    './sounds/night.mp3',
    './sounds/wind.mp3'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_FILES)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

// Network first, so updates show up right away when online; fall back to the cache when offline.
// 'no-cache' makes the browser check with the website every time instead of reusing a
// copy it kept from earlier, so a phone never mixes old and new files after an update.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const sameSite = new URL(event.request.url).origin === self.location.origin;
    const request = sameSite ? new Request(event.request.url, { cache: 'no-cache' }) : event.request;
    event.respondWith(
        fetch(request)
            .then(response => {
                const copy = response.clone();
                caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
    );
});
