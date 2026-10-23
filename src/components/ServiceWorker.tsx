"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const BUILD_ID = process.env.NEXT_PUBLIC_COTA_BUILD ?? "dev";
const IDLE_TIMEOUT_MS = 3_000;

export function ServiceWorker() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }
    const href = window.location.href;
    const postWhenIdle = () =>
      navigator.serviceWorker.ready
        .then((registration) => registration.active?.postMessage({ type: "cota:cache-page", url: href }))
        .catch((error: unknown) => console.warn("Could not ask the service worker to keep this page.", error));
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(postWhenIdle, { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(postWhenIdle, IDLE_TIMEOUT_MS);
    return () => clearTimeout(timer);
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
