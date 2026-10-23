importScripts("/sw-strategy.js");

var VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
var CACHE = "cota-" + VERSION;
var SHELL = ["/", "/mas", "/operaciones", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return Promise.all(
          SHELL.map(function (url) {
            return cache.add(url).catch(function () {
              return undefined;
            });
          }),
        );
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.indexOf("cota-") === 0 && key !== CACHE;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

function isCacheable(response) {
  return response && response.ok && response.type === "basic";
}

function store(request, response) {
  if (!isCacheable(response)) {
    return response;
  }
  var copy = response.clone();
  caches.open(CACHE).then(function (cache) {
    cache.put(request, copy);
  });
  return response;
}

function networkFirst(request, fallbackUrl) {
  return fetch(request)
    .then(function (response) {
      return store(request, response);
    })
    .catch(function () {
      return caches.match(request, { ignoreSearch: request.mode === "navigate" }).then(function (cached) {
        if (cached) {
          return cached;
        }
        return fallbackUrl ? caches.match(fallbackUrl) : Response.error();
      });
    });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    return (
      cached ||
      fetch(request).then(function (response) {
        return store(request, response);
      })
    );
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(function (cached) {
    var refresh = fetch(request)
      .then(function (response) {
        return store(request, response);
      })
      .catch(function () {
        return cached;
      });
    return cached || refresh;
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);
  var isRsc = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  var strategy = isRsc
    ? "network-only"
    : self.cotaStrategyFor({ method: request.method, mode: request.mode, pathname: url.pathname, sameOrigin: url.origin === self.location.origin });

  if (strategy === "network-first") {
    event.respondWith(networkFirst(request, request.mode === "navigate" ? "/" : null));
  } else if (strategy === "cache-first") {
    event.respondWith(cacheFirst(request));
  } else if (strategy === "stale-while-revalidate") {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("message", function (event) {
  var data = event.data || {};
  if (data.type !== "cota:precache" || !Array.isArray(data.urls)) {
    return;
  }
  var urls = data.urls.filter(function (href) {
    var url = new URL(href, self.location.origin);
    return url.origin === self.location.origin && self.cotaStrategyFor({ method: "GET", mode: "no-cors", pathname: url.pathname, sameOrigin: true }) === "cache-first";
  });
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        urls.map(function (url) {
          return cache.match(url).then(function (hit) {
            return hit || cache.add(url).catch(function () {
              return undefined;
            });
          });
        }),
      );
    }),
  );
});
