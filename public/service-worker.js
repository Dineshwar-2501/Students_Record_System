const CACHE_NAME = "pwa-cache-v3"; // Updated version for fresh cache
const API_CACHE_NAME = "api-cache";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/css/styles.css",
  "/js/studentDashboard.js",
  "/studentDashboard",
  "/proctorDashboard",
  "/adminDashboard",
  "/login.html"
];

// IndexedDB Config
const dbName = "UserSessionDB";
const storeName = "sessions";

// Open IndexedDB & ensure session store exists
const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
        console.log("✅ Object store created:", storeName);
    }
};

request.onsuccess = () => {
    console.log("📦 IndexedDB opened successfully");
};

// 🔹 Install Event - Cache essential assets
self.addEventListener("install", (event) => {
    console.log("🔹 Service Worker Installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("✅ Caching assets...");
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 🔹 Activate Event - Clean old caches & claim clients
self.addEventListener("activate", (event) => {
    console.log("🛠 Service Worker Activated");
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
                    .map((key) => {
                        console.log(`🗑 Removing old cache: ${key}`);
                        return caches.delete(key);
                    })
            );
        })
    );

    self.clients.claim().then(async () => {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach(client => client.postMessage({ action: "forceRefresh" }));
    });
});

// 🔹 Fetch Event - Handle requests dynamically
self.addEventListener("fetch", (event) => {
    const requestURL = new URL(event.request.url);

    // ✅ Always bypass cache for login & logout
    if (requestURL.pathname.includes("/login.html") || requestURL.pathname.includes("/logout")) {
        event.respondWith(fetch(event.request, { cache: "no-store" }));
        return;
    }

    // ✅ Bypass cache for admin dashboard (fetch fresh every time)
    if (requestURL.pathname.includes("/adminDashboard")) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (requestURL.pathname.includes("/proctorDashboard")) {
        event.respondWith(fetch(event.request));
        return;
    }
    if (requestURL.pathname.includes("/studentDashboard")) {
        event.respondWith(fetch(event.request));
        return;
    }

    // ✅ API Handling (Network-First)
    if (requestURL.pathname.includes("/api/")) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (!networkResponse || networkResponse.type === "opaque") {
                        return networkResponse; // Don't cache opaque responses
                    }
                    const clonedResponse = networkResponse.clone();
                    caches.open(API_CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                    return networkResponse;
                })
                .catch(() => caches.match(event.request) || caches.match("/offline.html"))
        );
        return;
    }

    // ✅ Static Assets Handling (Cache-First)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return (
                cachedResponse ||
                fetch(event.request).catch(() => {
                    if (event.request.destination === "document") {
                        return caches.match("/offline.html"); // Serve offline page if document request fails
                    }
                })
            );
        })
    );
});

// 🔹 Listen for messages from client (used for force refresh)
self.addEventListener("message", (event) => {
    if (event.data.action === "forceRefresh") {
        self.clients.matchAll().then((clients) => {
            clients.forEach(client => client.navigate(client.url));
        });
    }
});
