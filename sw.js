const CACHE_NAME = 'datacasa-v1';

// O fragmento do URL da tua API para o SW detetar
const API_ENDPOINT = 'api/data/'; 

// Ficheiros da "App Shell" (Estes são guardados logo na instalação)
const STATIC_ASSETS = [
    './',
    './index.html',
    './freguesias_fundao.geojson', // O GeoJSON continua a ser estático
    './icon-192.png',
    './icon-512.png',
    './manifest.json'
];

// 1. Instalação: Cache dos ficheiros estáticos (App Shell)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// 2. Ativação: Limpeza de caches antigas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// 3. Interceção de Pedidos (A Mágica acontece aqui)
self.addEventListener('fetch', (event) => {
    
    // CASO 1: Pedidos à API (Dados Dinâmicos)
    // Estratégia: Network First (Tenta Internet -> Falha -> Vai à Cache)
    if (event.request.url.includes(API_ENDPOINT)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Se a API responder bem, clonamos a resposta para a cache
                    // para usar quando estivermos offline
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Se não houver net, devolvemos o JSON que guardámos da última vez
                    return caches.match(event.request);
                })
        );
        return;
    }

    // CASO 2: Ficheiros Estáticos (HTML, CSS, JS, Imagens, GeoJSON)
    // Estratégia: Cache First (ou Stale-While-Revalidate)
    // Aqui usamos Cache First para performance máxima, com fallback para rede
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});