// Офлайн-доступ к шпаргалке.
// Стратегия: сначала сеть, при её отсутствии — кэш.
// Так свежая версия подхватывается сразу после деплоя, а без интернета всё открывается из кэша.

const CACHE = 'dotnet-cheatsheet-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();                       // новая версия активируется, не дожидаясь закрытия вкладок
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // в кэш — только удачные ответы; opaque — шрифты с других сайтов, их статус не виден
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        }
        // ошибка сервера (например, 404 во время деплоя) — отдать сохранённую копию, если есть
        return caches.match(e.request).then((hit) => hit || res);
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
