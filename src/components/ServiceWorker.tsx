"use client";

import { useEffect } from "react";

const BUILD_ID = process.env.NEXT_PUBLIC_COTA_BUILD ?? "dev";

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(BUILD_ID)}`, { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const urls = performance.getEntriesByType("resource").map((entry) => entry.name);
        registration.active?.postMessage({ type: "cota:precache", urls });
      })
      .catch((error: unknown) => {
        console.warn("No se pudo registrar el service worker de Cota.", error);
      });
  }, []);
  return null;
}
