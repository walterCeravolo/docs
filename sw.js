// Tivù Player: tiene in memoria l'app (si apre anche senza rete) e le librerie del lettore. I canali non passano di qui.
const C = "tivu-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./lista.m3u"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin && u.pathname.includes("/dec/")) return;   // il decodificatore (32 MB) resta nella cache normale del browser
  if (u.origin === location.origin) {   // l'app: prima la rete (aggiornamenti subito), senza rete la copia salvata
    e.respondWith(fetch(r).then(x => { if (x.ok) { const cp = x.clone(); caches.open(C).then(c => c.put(r, cp)); } return x; }).catch(() => caches.match(r).then(x => x || caches.match("./index.html"))));
  } else if (u.hostname === "cdn.jsdelivr.net" || u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(r).then(x => x || fetch(r).then(y => { if (y.ok || y.type === "opaque") { const cp = y.clone(); caches.open(C).then(c => c.put(r, cp)); } return y; })));
  }
});
