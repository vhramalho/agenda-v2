const CACHE_NAME = "agenda-cache-v1.04";
const urlsToCache = [
    "/index.html",
    "/menu.html",
    "/pagamento.html",
    "/pgtoPedentes.html",
    "/relatorio.html",
    "/servicos.html",
    "/whatsapp.html",
    "/css/index.css",
    "/css/pagamento.css",
    "/css/relatorio.css",
    "/css/servicos.css",
    "/css/whatsapp.css",
    "/javaScript/index.js",
    "/javaScript/menu.js",
    "/javaScript/pagamento.js",
    "/javaScript/pgtoPedentes.js",
    "/javaScript/relatorio.js",
    "/javaScript/servicos.js",
    "/javaScript/whatsapp.js",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});