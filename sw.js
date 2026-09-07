// DietoCase Service Worker - Offline & PWA Support
const CACHE_NAME = 'dietocase-pwa-v6';

// Configurações do PWA para forçar atualização automática de cache no cliente
const pwaConfig = {
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true
};

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './favicon.ico',
  './css/styles.css',
  './manifest.json',
  './js/cases-data.js',
  './js/tacoData.js',
  './js/portuguese-reviser.js',
  './js/case-builder.js',
  './js/chat-engine.js',
  './js/student-prontuario.js',
  './js/docx-generator.js',
  './js/firebase-config.js',
  './js/firebase.js',
  './js/firebase-sync.js',
  './js/sync-engine.js',
  './js/admin-manager.js',
  './js/app.js',
  './lib/mini-docx.js',
  './icons/favicon.ico',
  './icons/favicon.png',
  './icons/favicon-32x32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalação do Service Worker - ativa skipWaiting imediatamente
self.addEventListener('install', (event) => {
  if (pwaConfig.skipWaiting) {
    self.skipWaiting();
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Algum arquivo falhou no pré-cache do SW:', err);
      });
    }).then(() => {
      if (pwaConfig.skipWaiting) {
        return self.skipWaiting();
      }
    })
  );
});

// Ativação e limpeza de caches legados - assume controle com clients.claim()
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 PWA: Removendo cache legado:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      if (pwaConfig.clientsClaim) {
        return self.clients.claim();
      }
    })
  );
});

// Escuta mensagem SKIP_WAITING enviada pelo cliente durante novo deploy
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

// Estratégia Stale-While-Revalidate com fallback para cache
// Ignora conexões do Firebase Firestore para não interferir com o onSnapshot em tempo real
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // Não interceptar requisições em tempo real do Firestore
  if (url.includes('firestore.googleapis.com') || url.includes('google.firestore')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
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
