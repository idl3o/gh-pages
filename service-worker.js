/**
 * Service Worker for Web3 Streaming Platform
 * Provides offline functionality and performance improvements
 * Version 2.0 - Enhanced performance with multi-tier caching
 */

const CACHE_NAME = 'web3-stream-cache-v2';
const STATIC_CACHE = 'web3-static-v2';
const DYNAMIC_CACHE = 'web3-dynamic-v2';
const API_CACHE = 'web3-api-v2';

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/main.css',
  '/assets/css/mobile.css',
  '/assets/css/animations.css',
  '/assets/css/definitive.css',
  '/assets/js/performance.js',
  '/assets/images/placeholder.svg',
  '/assets/images/favicon.ico',
  '/assets/js/browser-compatibility.js'
];

// Assets to cache when they become available (non-blocking)
const SECONDARY_CACHE_ASSETS = [
  '/assets/fonts/web3-icons.woff2',
  '/assets/js/utils/compression.js',
  '/assets/js/charts.js',
  '/assets/images/logo.svg',
  '/manifest.json'
];

// Install event - precache key assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Primary cache - critical assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Pre-caching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      }),

      // Secondary cache - important but non-critical assets
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Preparing secondary cache');
        // We don't await this, as it's not critical for startup
        self.setTimeout(() => {
          cache
            .addAll(SECONDARY_CACHE_ASSETS)
            .catch(err => console.warn('Secondary caching error:', err));
        }, 3000);
        return Promise.resolve();
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => {
              console.log('Deleting obsolete cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker activated - claiming clients');
        return self.clients.claim();
      })
  );
});

// Helper function to determine if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || request.url.match(/\.(jpe?g|png|gif|svg|webp)$/i);
}

// Helper function to determine if request is for a document
function isDocumentRequest(request) {
  return request.destination === 'document' || request.mode === 'navigate';
}

// Helper function to determine if request is for stylesheet, script, or font
function isAssetRequest(request) {
  return (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.url.match(/\.(css|js|woff2?)$/i)
  );
}

// Helper function to determine if request is for API
function isApiRequest(request) {
  return (
    request.url.includes('/api/') ||
    request.url.includes('data.json') ||
    request.headers.get('accept')?.includes('application/json')
  );
}

// Helper function to determine if WebAssembly request
function isWasmRequest(request) {
  return request.url.endsWith('.wasm') || request.destination === 'wasm';
}

// Network first strategy with timeout for API calls and dynamic content
async function networkFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      resolve(
        new Response('Network timeout', {
          status: 408,
          headers: { 'X-SW-Cache-Status': 'network-timeout' }
        })
      );
    }, 3000); // 3 second timeout
  });

  try {
    // Try network with timeout
    const networkPromise = fetch(request.clone());
    const response = await Promise.race([networkPromise, timeoutPromise]);

    // If genuine network response (not our timeout response)
    if (response.status !== 408 || !response.headers.has('X-SW-Cache-Status')) {
      // Cache successful valid responses
      if (response && response.status === 200) {
        const cache = await caches.open(cacheName);
        // Clone the response before caching it and returning it
        cache.put(request, response.clone());
      }
      return response;
    }

    // If we got the timeout response, fall back to cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/offline.html');
  } catch (error) {
    // If network fails, try from cache
    console.log('Network request failed, falling back to cache:', error);
    const cachedResponse = await caches.match(request);

    // If not in cache, return offline page for documents
    if (!cachedResponse && isDocumentRequest(request)) {
      return caches.match('/offline.html');
    }

    return (
      cachedResponse ||
      new Response('Network and cache both failed', {
        status: 503,
        statusText: 'Service Unavailable'
      })
    );
  }
}

// Stale While Revalidate strategy - quick response from cache, then update cache
async function staleWhileRevalidateStrategy(request, cacheName = DYNAMIC_CACHE) {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);

  // Clone request for cache update
  const fetchPromise = fetch(request.clone())
    .then(response => {
      // Don't cache failed or non-successful responses
      if (!response || response.status !== 200) {
        return response;
      }

      // Update the cache with new version
      caches
        .open(cacheName)
        .then(cache => cache.put(request, response.clone()))
        .catch(err => console.warn('Cache update failed:', err));

      return response;
    })
    .catch(err => {
      console.warn('Fetch failed in stale-while-revalidate:', err);
      // Failover happens automatically since we return cached response first
    });

  // Return the cached version immediately if available
  return cachedResponse || fetchPromise;
}

// Cache first strategy for static assets
async function cacheFirstStrategy(request, cacheName = STATIC_CACHE) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return from cache immediately
    return cachedResponse;
  }

  // If not in cache, fetch from network and update cache
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('Cache-first network fetch failed:', error);

    // For images, return placeholder if available
    if (isImageRequest(request)) {
      const placeholder = await caches.match('/assets/images/placeholder.svg');
      if (placeholder) return placeholder;
    }

    // For documents, return offline page
    if (isDocumentRequest(request)) {
      return caches.match('/offline.html');
    }

    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// WebAssembly optimized strategy
async function wasmStrategy(request) {
  // First check if it's in the cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  // If not cached, fetch and process
  try {
    const response = await fetch(request);

    if (!response || !response.ok) {
      throw new Error('Failed to fetch WASM file');
    }

    // Cache the WASM file
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());

    return response;
  } catch (error) {
    console.error('WASM fetch error:', error);
    return new Response('WebAssembly module unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Fetch event - respond with appropriate strategy
self.addEventListener('fetch', event => {
  const request = event.request;

  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRequest(request)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Handle WebAssembly with optimized strategy
  if (isWasmRequest(request)) {
    event.respondWith(wasmStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (
    isAssetRequest(request) ||
    PRECACHE_ASSETS.some(asset => request.url.endsWith(asset)) ||
    SECONDARY_CACHE_ASSETS.some(asset => request.url.endsWith(asset))
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Handle images with stale-while-revalidate for best performance
  if (isImageRequest(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Use network-first for documents (HTML)
  if (isDocumentRequest(request)) {
    event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Use stale-while-revalidate for all other requests
  event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
});

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/images/notification-icon.png',
      badge: '/assets/images/badge-icon.png',
      data: {
        url: data.actionUrl
      },
      vibrate: [100, 50, 100]
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (err) {
    console.error('Push event processing failed:', err);
  }
});

// Open page when notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no open window with the URL, open one
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'update-cached-content') {
    event.waitUntil(updateCache());
  } else if (event.tag.startsWith('pending-')) {
    event.waitUntil(processPendingActions(event.tag));
  }
});

// Function to update cache with fresh content
async function updateCache() {
  const cache = await caches.open(STATIC_CACHE);

  // Update key pages
  const pagesToUpdate = ['/', '/index.html', '/streaming.html', '/docs.html'];

  return Promise.all(
    pagesToUpdate.map(async url => {
      try {
        const response = await fetch(url, {
          cache: 'reload',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (response && response.ok) {
          return cache.put(url, response);
        }
      } catch (error) {
        console.error(`Failed to update cache for ${url}:`, error);
      }
    })
  );
}

// Process pending offline actions
async function processPendingActions(syncTag) {
  // Extract action type from sync tag
  const actionType = syncTag.replace('pending-', '');

  try {
    // Open IndexedDB to get pending actions
    // This is just a placeholder - would need actual IndexedDB implementation
    const pendingActions = await getPendingActionsFromDB(actionType);

    // Process each pending action
    for (const action of pendingActions) {
      await processAction(action);
    }

    // Clear processed actions
    await clearProcessedActions(actionType);

    return true;
  } catch (error) {
    console.error('Error processing pending actions:', error);
    return false;
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingActionsFromDB(actionType) {
  // This would be implemented with actual IndexedDB code
  return [];
}

async function processAction(action) {
  // This would process the action against the API
  console.log('Processing action:', action);
}

async function clearProcessedActions(actionType) {
  // This would remove processed actions from IndexedDB
  console.log('Clearing processed actions for:', actionType);
}

// Periodic cache validation (e.g., daily)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'validate-cache') {
    event.waitUntil(validateCache());
  }
});

// Cache validation function
async function validateCache() {
  // Get all cache storage
  const cacheNames = await caches.keys();

  // Set storage limits (in bytes)
  const CACHE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

  let totalSize = 0;
  let oldestEntries = [];

  // Iterate through each cache to check size and age
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    // Basic implementation of calculating cache size
    // In a real implementation, would use Cache Storage API's size features
    for (const request of keys) {
      const response = await cache.match(request);

      // Skip if no response
      if (!response) continue;

      // Get size via Content-Length if available
      let size = parseInt(response.headers.get('Content-Length') || '0', 10);

      // If no Content-Length, get size from blob
      if (!size) {
        const blob = await response.blob();
        size = blob.size;
      }

      totalSize += size;

      // Track entry info for potential cleanup
      oldestEntries.push({
        url: request.url,
        cacheName: cacheName,
        size: size,
        date: response.headers.get('date') || Date.now()
      });
    }
  }

  console.log(`Cache size: ${totalSize / (1024 * 1024).toFixed(2)} MB`);

  // If over limit, clean up oldest entries first
  if (totalSize > CACHE_SIZE_LIMIT) {
    // Sort entries by date (oldest first)
    oldestEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let freedSize = 0;
    const sizeToFree = totalSize - CACHE_SIZE_LIMIT + 5 * 1024 * 1024; // Free extra 5MB

    // Remove oldest entries until enough space is freed
    for (const entry of oldestEntries) {
      if (freedSize >= sizeToFree) break;

      const cache = await caches.open(entry.cacheName);
      await cache.delete(new Request(entry.url));

      freedSize += entry.size;
      console.log(`Removed from cache: ${entry.url}, freed ${entry.size / 1024} KB`);
    }

    console.log(`Cache cleanup completed. Freed ${freedSize / (1024 * 1024).toFixed(2)} MB`);
  }
}

// Message handling from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then(cacheNames => {
          return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName))).then(() => {
            event.ports[0].postMessage({
              status: 'success',
              message: 'All caches cleared'
            });
          });
        })
        .catch(error => {
          console.error('Cache clearing failed:', error);
          event.ports[0].postMessage({
            status: 'error',
            message: error.toString()
          });
        })
    );
  }
});

console.log('Service Worker loaded with enhanced multi-tier caching');
