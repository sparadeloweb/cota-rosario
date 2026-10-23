"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const BUILD_ID = process.env.NEXT_PUBLIC_COTA_BUILD ?? "dev";

export function ServiceWorker() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage({ type: "cota:cache-page", url: window.location.href }))
      .catch(() => undefined);
  }, [pathname]);

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
        console.warn("Could not register the Cota service worker.", error);
      });
  }, []);
  return null;
}
