const CACHE_NAME = 'jewelry-seo-v1';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Cache URLs
const STATIC_URLS = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/products',
  '/api/analytics/summary'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('jewelry-seo-') && !cacheName.includes(CACHE_NAME)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests
    if (request.method === 'GET' && API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
      event.respondWith(
        caches.open(API_CACHE).then(cache => {
          return cache.match(request).then(response => {
            // Return cached response if available
            if (response) {
              // Fetch fresh data in background
              fetch(request).then(freshResponse => {
                cache.put(request, freshResponse.clone());
              });
              return response;
            }

            // Fetch from network
            return fetch(request).then(response => {
              // Cache successful responses
              if (response.ok) {
                const responseClone = response.clone();
                cache.put(request, responseClone);
              }
              return response;
            });
          });
        })
      );
    }
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then(response => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Clone the request because it's a stream
      const fetchRequest = request.clone();

      return fetch(fetchRequest).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response because it's a stream
        const responseToCache = response.clone();

        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If both cache and network fail, return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline');
        }
      });
    })
  );
});

// Handle background sync for failed API requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-failed-requests') {
    event.waitUntil(
      // Implement retry logic for failed requests
      syncFailedRequests()
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/badge.png',
      data: data.url,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

// Sync failed requests helper
async function syncFailedRequests() {
  // Get failed requests from IndexedDB
  const failedRequests = await getFailedRequests();

  // Retry each request
  for (const request of failedRequests) {
    try {
      const response = await fetch(request.url, request.options);
      if (response.ok) {
        await removeFailedRequest(request.id);
      }
    } catch (error) {
      console.error('Failed to sync request:', error);
    }
  }
}

// IndexedDB helpers for failed requests
function getFailedRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FailedRequestsDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('requests', 'readonly');
      const store = transaction.objectStore('requests');
      const getAll = store.getAll();

      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject(getAll.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
    };
  });
}

function removeFailedRequest(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FailedRequestsDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('requests', 'readwrite');
      const store = transaction.objectStore('requests');
      store.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}