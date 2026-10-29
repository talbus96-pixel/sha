// Lets the app open without internet once it has been visited, and makes it installable.
// When you change any app file, bump CACHE_VERSION so phones pick up the new version.
const CACHE_VERSION = 'breathe-v1';
const APP_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png'
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
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const copy = response.clone();
                caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
    );
});
