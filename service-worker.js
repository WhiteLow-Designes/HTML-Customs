'use strict';

var CACHE_NAME = 'patrick-desktop-v17';
var CORE_ASSETS = [
  './',
  './index.html',
  './assets/css/windows11.css',
  './assets/js/app.js',
  './assets/images/samurai-wallpaper.png',
  './assets/icons/app-icon.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(CORE_ASSETS);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== CACHE_NAME;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.indexOf('/api/') !== -1 || event.request.method !== 'GET') {
    return;
  }
  event.respondWith(fetch(event.request, { cache: 'no-store' }).then(function (response) {
    if (response && response.ok && response.type === 'basic') {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
    }
    return response;
  }).catch(function () {
    return caches.match(event.request).then(function (cached) {
      return cached || caches.match('./index.html');
    });
  }));
});
