// Troque este nome ao atualizar os arquivos para o navegador baixar a nova versão.
const CACHE_NAME = "spotify-clone-mvc-v11";
// Arquivos do site que o navegador guarda para abrir a página sem internet.
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./admin.html",
  "./views/style.css",
  "./views/admin.css",
  "./models/firebase-config.js",
  "./models/songs-model.js",
  "./models/likes-model.js",
  "./views/player-view.js",
  "./views/admin-view.js",
  "./controllers/player-controller.js",
  "./controllers/admin-controller.js",
  "./assets/icon.svg",
  "./assets/cover-placeholder.svg",
  "./manifest.json"
];

// Na instalação, guarda uma cópia dos arquivos listados acima.
self.addEventListener("install", (event) => {
  const assetUrls = [];
  // Completa cada endereço usando a pasta onde este arquivo está.
  for (const asset of ASSETS_TO_CACHE) {
    assetUrls.push(new URL(asset, self.registration.scope).href);
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Guarda os arquivos. Se algum falhar, a instalação também falha.
      .then((cache) => cache.addAll(assetUrls))
      .then(() => self.skipWaiting())
  );
});

// Ao ativar a nova versão, apaga cópias antigas e controla as páginas abertas.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Quando a página pede um arquivo, usa a cópia salva ou busca na internet.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request, { cacheName: CACHE_NAME })
      .then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});
