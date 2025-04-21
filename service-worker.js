/**
 * Service Worker for GH-Pages
 * Provides offline functionality and performance optimization
 * Created: April 21, 2025
 */

const CACHE_NAME = 'gh-pages-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.css',
  '/assets/js/app.js',
  '/assets/js/browser-compatibility.js',
  '/assets/images/icons/favicon.ico'
  // Add other important assets here
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy for API requests
  if (event.request.url.includes('/api/')) {
    return event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If network fails, try the cache
          return caches.match(event.request);
        })
    );
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        // Cache the fetched response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/assets/images/icons/notification-icon.png',
    badge: '/assets/images/icons/badge-icon.png',
    data: data
  });
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // Open the app and navigate to a specific page
  event.waitUntil(clients.openWindow('/'));
});
