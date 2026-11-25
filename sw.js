// il sito e' stato spostato: questo service worker cancella la vecchia copia salvata e si disattiva
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.map(n => caches.delete(n)))).then(() => self.registration.unregister()).then(() => self.clients.matchAll()).then(cs => cs.forEach(c => c.navigate(c.url)))));
