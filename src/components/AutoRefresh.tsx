"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

const REFRESH_MS = 5 * 60 * 1000;
const MIN_FOCUS_REFRESH_GAP_MS = 60 * 1000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let lastRefreshAt = Date.now();
    const refresh = (minimumGapMs: number) => {
      const now = Date.now();
      if (document.visibilityState !== "visible" || now - lastRefreshAt < minimumGapMs) {
        return;
      }
      lastRefreshAt = now;
      startTransition(() => router.refresh());
    };
    const onInterval = () => refresh(0);
    const onVisibility = () => refresh(MIN_FOCUS_REFRESH_GAP_MS);
    const interval = window.setInterval(onInterval, REFRESH_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
