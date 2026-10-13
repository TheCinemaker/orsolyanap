/*
 * Szándékosan ÜRES service worker.
 *
 * Csak azért van, mert az Android/Chrome telepítő ablaka megköveteli a
 * meglétét. NEM gyorsítótáraz semmit -- és ez tudatos döntés: egy
 * gyorsítótárazó service worker a vásár alatt régi étlapot vagy régi képet
 * mutatna, és a látogató telefonján NEM lehetne kijavítani. Minden kérés megy
 * a hálózatra, ahogy eddig.
 *
 * A `fetch` figyelő üres: a telepíthetőséghez léteznie kell, de nem nyúlunk
 * bele a kérésekbe.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
