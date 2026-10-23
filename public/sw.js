importScripts("/sw-strategy.js");

var VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
var CACHE = "cota-" + VERSION;
var CACHE_MARK = "<script>window.__cotaFromCache=location.href</script>";
var SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png"];
var PAGE_COPY_MAX_AGE_MS = 10 * 60 * 1000;
var NAVIGATION_TIMEOUT_MS = 4000;

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

var OFFLINE_HTML =
  '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<meta name="theme-color" content="#0b0c0e"><title>Sin conexión · Cota</title><style>' +
  "html,body{height:100%;margin:0;background:#0b0c0e;color:#eceef1;font-family:system-ui,-apple-system,Segoe UI,sans-serif}" +
  "main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;box-sizing:border-box}" +
  "h1{font-size:20px;margin:0}p{max-width:24rem;margin:0;color:#b0b6c0;font-size:14px;line-height:1.6}" +
  "nav{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}a{color:#eceef1;text-decoration:none;border:1px solid #2a2d33;border-radius:6px;padding:8px 16px;font-size:14px}" +
  "a.primary{border-color:#b0b6c0}</style></head><body><main>" +
  "<h1>Esta pantalla no está guardada</h1>" +
  "<p>No hay conexión con Cota y esta sección todavía no se abrió en este dispositivo, así que no hay una copia para mostrar.</p>" +
  '<nav><a class="primary" href="/">Volver al mapa</a><a href="javascript:location.reload()">Reintentar</a><a href="tel:103">Defensa Civil · 103</a></nav>' +
  "</main></body></html>";

function offlinePage() {
  return new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function isRecentCopy(response) {
  var stamped = response ? Date.parse(response.headers.get("Date") || "") : NaN;
  return Number.isFinite(stamped) && Date.now() - stamped < PAGE_COPY_MAX_AGE_MS;
}

function cachePage(href) {
  var url = new URL(href, self.location.origin);
  if (url.origin !== self.location.origin) {
    return Promise.resolve();
  }
  url.hash = "";
  return caches
    .match(url.href, { ignoreSearch: true })
    .then(function (existing) {
      if (isRecentCopy(existing)) {
        return undefined;
      }
      return fetchPageCopy(url);
    });
}

function fetchPageCopy(url) {
  return fetch(url.href, { credentials: "same-origin", headers: { Accept: "text/html" } })
    .then(function (response) {
      if (isCacheable(response) && (response.headers.get("Content-Type") || "").indexOf("text/html") === 0) {
        return caches.open(CACHE).then(function (cache) {
          return cache.put(url.href, response);
        });
      }
      return undefined;
    })
    .catch(function () {
      return undefined;
    });
}

function markFromCache(response) {
  return response.text().then(function (html) {
    var marked = html.indexOf("<head>") >= 0 ? html.replace("<head>", "<head>" + CACHE_MARK) : CACHE_MARK + html;
    var headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(marked, { status: 200, headers: headers });
  });
}

function fromCacheOrOffline(request, navigation) {
  return caches.match(request, { ignoreSearch: navigation }).then(function (cached) {
    if (cached) {
      return navigation ? markFromCache(cached) : cached;
    }
    if (!navigation) {
      return Response.error();
    }
    return offlinePage();
  });
}

function networkFirst(request, event) {
  var navigation = request.mode === "navigate";
  var network = fetch(request).then(function (response) {
    return store(request, response);
  });
  if (!navigation) {
    return network.catch(function () {
      return fromCacheOrOffline(request, false);
    });
  }
  event.waitUntil(network.catch(function () {
    return undefined;
  }));
  var slowNetwork = new Promise(function (resolve) {
    setTimeout(function () {
      caches.match(request, { ignoreSearch: true }).then(function (cached) {
        if (cached) {
          resolve(markFromCache(cached));
        }
      });
    }, NAVIGATION_TIMEOUT_MS);
  });
  return Promise.race([
    network.catch(function () {
      return fromCacheOrOffline(request, true);
    }),
    slowNetwork,
  ]);
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
    event.respondWith(networkFirst(request, event));
  } else if (strategy === "cache-first") {
    event.respondWith(cacheFirst(request));
  } else if (strategy === "stale-while-revalidate") {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("message", function (event) {
  var data = event.data || {};
  if (data.type === "cota:cache-page" && typeof data.url === "string") {
    event.waitUntil(cachePage(data.url));
    return;
  }
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
