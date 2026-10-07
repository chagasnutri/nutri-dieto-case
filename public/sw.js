// DietoCase Service Worker - Offline & PWA Support (v8 com bypass para verificação em tempo real)
// CACHE_NAME atualizado para dietocase-pwa-v8 (expurgo de caches legados incluindo dietocase-pwa-v7)
const CACHE_NAME = 'dietocase-pwa-v8';

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

// Estratégia Network-First com Fallback para Cache
// Prevenção Rigorosa de Cache Agressivo: NÃO interceptar status de casos, APIs, autenticação e Firebase
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // 1. Bypass por cabeçalhos de requisição crítica (ex: no-cache, no-store, bypass-sw)
  const cacheControl = event.request.headers.get('cache-control') || '';
  const pragma = event.request.headers.get('pragma') || '';
  if (
    cacheControl.includes('no-cache') ||
    cacheControl.includes('no-store') ||
    pragma.includes('no-cache') ||
    event.request.headers.get('x-bypass-sw') === 'true'
  ) {
    return;
  }

  // 2. Não interceptar requisições em tempo real, APIs do Firebase/Google, status e revalidações
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (e) {
    urlObj = null;
  }

  const isBypassUrl = 
    url.includes('firestore.googleapis.com') ||
    url.includes('google.firestore') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('identitytoolkit') ||
    url.includes('securetoken') ||
    url.includes('firebaseio.com') ||
    url.includes('_vercel') ||
    url.includes('vercel') ||
    url.includes('/api/') ||
    url.includes('status') ||
    url.includes('revalidate') ||
    (urlObj && (
      urlObj.searchParams.has('nocache') ||
      urlObj.searchParams.has('_t') ||
      urlObj.searchParams.has('caseId') ||
      urlObj.searchParams.has('status') ||
      urlObj.pathname.includes('/api/')
    ));

  if (isBypassUrl) {
    // Permite que o tráfego de status e tempo real vá diretamente para a rede sem cache
    return;
  }
  
  // 3. Estratégia Network-First para arquivos locais da aplicação:
  // Garante que o aluno sempre receba a versão mais recente da rede, com fallback offline se a rede falhar.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback para cache local apenas em caso de falha de conexão (offline)
        return caches.match(event.request);
      })
  );
});
