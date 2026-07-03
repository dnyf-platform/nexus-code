// =====================================================
// NexusCode Studio IDE - Service Worker
// Version: 2.0.0
// Provides offline support and caching
// =====================================================

const CACHE_NAME = 'nexuscode-v2.0.0';
const RUNTIME_CACHE = 'nexuscode-runtime';

// All files to cache on install
const PRECACHE_ASSETS = [
    // Root files
    '/',
    '/index.html',
    '/manifest.json',
    
    // CSS - Themes
    '/css/themes/dark-theme.css',
    '/css/themes/light-theme.css',
    '/css/themes/high-contrast.css',
    
    // CSS - Core Layout
    '/css/layout-engine.css',
    '/css/webview-fix.css',
    
    // CSS - Features
    '/css/preview-engine.css',
    '/css/dashboard.css',
    '/css/terminal.css',
    '/css/settings.css',
    '/css/templates.css',
    
    // CSS - Main
    '/css/styles.css',
    
    // JS - Core System
    '/js/core/eventBus.js',
    '/js/core/reactiveState.js',
    '/js/core/renderEngine.js',
    '/js/core/reactiveBootstrap.js',
    
    // JS - Editor Engine
    '/js/editor/cursorManager.js',
    '/js/editor/selectionManager.js',
    '/js/editor/inputHandler.js',
    '/js/editor/editorCore.js',
    
    // JS - Feature Modules
    '/js/previewEngine.js',
    '/js/searchEngine.js',
    '/js/recentProjects.js',
    '/js/fileManager.js',
    
    // JS - Dashboard
    '/js/dashboard/dashboardManager.js',
    '/js/dashboard/widgets.js',
    
    // JS - Terminal
    '/js/terminal/terminalEngine.js',
    '/js/terminal/terminalCommands.js',
    
    // JS - Templates
    '/js/templates/templateEngine.js',
    '/js/templates/templateLibrary.js',
    
    // JS - Settings
    '/js/settings/settingsManager.js',
    '/js/settings/settingsPanels.js',
    
    // JS - Plugins
    '/js/plugins/pluginManager.js',
    '/js/plugins/builtinPlugins.js',
    
    // JS - Workspace
    '/js/workspaceManager.js',
];

// =====================================================
// INSTALL EVENT - Cache all core assets
// =====================================================
self.addEventListener('install', (event) => {
    console.log('🔧 NexusCode SW: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching core assets...');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('✅ All assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Cache failed:', error);
            })
    );
});

// =====================================================
// ACTIVATE EVENT - Clean old caches
// =====================================================
self.addEventListener('activate', (event) => {
    console.log('🚀 NexusCode SW: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('🗑 Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Old caches cleaned');
                return self.clients.claim();
            })
    );
});

// =====================================================
// FETCH EVENT - Serve from cache, fallback to network
// =====================================================
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension and other non-http(s) requests
    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;
    
    // Handle API calls differently (network first)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(event.request));
        return;
    }
    
    // For all other requests: Cache first, then network
    event.respondWith(cacheFirst(event.request));
});

// =====================================================
// CACHE STRATEGIES
// =====================================================

// Cache First Strategy (for static assets)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Return cached response immediately
        // Update cache in background
        updateCache(request);
        return cachedResponse;
    }
    
    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);
        
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, return offline fallback
        console.warn('⚠️ Network request failed:', request.url);
        
        // For HTML requests, return index.html (SPA fallback)
        if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/index.html');
        }
        
        // Return a simple offline response
        return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain',
            }),
        });
    }
}

// Network First Strategy (for API calls)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache the response
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return error
        return new Response(JSON.stringify({ error: 'Network unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Background cache update (stale-while-revalidate)
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
    } catch (error) {
        // Silent fail - will try again on next request
    }
}

// =====================================================
// MESSAGE HANDLING
// =====================================================
self.addEventListener('message', (event) => {
    console.log('📨 SW Message received:', event.data);
    
    switch (event.data.action) {
        case 'skipWaiting':
            self.skipWaiting();
            break;
            
        case 'clearCache':
            event.waitUntil(
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(name => caches.delete(name))
                    );
                })
            );
            console.log('🗑 All caches cleared');
            break;
            
        case 'updateCache':
            // Force update specific assets
            event.waitUntil(
                caches.open(CACHE_NAME).then(cache => {
                    return cache.addAll(PRECACHE_ASSETS);
                })
            );
            console.log('🔄 Cache updated');
            break;
            
        default:
            console.log('Unknown action:', event.data.action);
    }
});

// =====================================================
// PUSH NOTIFICATIONS (Optional)
// =====================================================
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || 'New notification from NexusCode',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'open', title: 'Open IDE' },
            { action: 'close', title: 'Dismiss' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('NexusCode IDE', options)
    );
});

// =====================================================
// NOTIFICATION CLICK HANDLER
// =====================================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('🟢 NexusCode Service Worker v2.0.0 Ready');
