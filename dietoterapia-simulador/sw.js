// DietoCase Service Worker - Offline & PWA Support
const CACHE_NAME = 'dietocase-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/cases-data.js',
  './js/admin-manager.js',
  './js/case-builder.js',
  './js/chat-engine.js',
  './js/student-prontuario.js',
  './js/docx-generator.js',
  './js/app.js',
  './lib/mini-docx.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Algum arquivo falhou no pré-cache do SW:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches legados
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia Stale-While-Revalidate / Network-First com fallback para cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
