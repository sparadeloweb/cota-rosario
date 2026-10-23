"use client";

import { useEffect, useState } from "react";
import { FROM_CACHE_FLAG, cachedCopyNotice, offlineNotice } from "@/lib/offline";

interface OfflineBannerProps {
  updatedAt?: string;
}

interface Situation {
  fromCache: boolean;
  online: boolean;
  now: number;
}

function cachedHref(): string | undefined {
  const value: unknown = Reflect.get(window, FROM_CACHE_FLAG);
  return typeof value === "string" ? value : undefined;
}

export function OfflineBanner({ updatedAt }: OfflineBannerProps) {
  const [situation, setSituation] = useState<Situation | null>(null);

  useEffect(() => {
    const update = () => setSituation({ fromCache: cachedHref() === window.location.href, online: navigator.onLine, now: Date.now() });
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!situation || (situation.online && !situation.fromCache)) {
    return null;
  }
  const text = situation.fromCache ? cachedCopyNotice(updatedAt, situation.now, situation.online) : offlineNotice(updatedAt, situation.now);
  return (
    <p role="status" className="shrink-0 border-b border-rule bg-watch/10 px-4 py-2 text-xs text-ink">
      <span className="mr-2 inline-block size-1.5 rounded-full bg-ink-faint align-middle" aria-hidden="true" />
      {text}{" "}
      {situation.fromCache && situation.online ? (
        <button type="button" onClick={() => window.location.reload()} className="underline decoration-rule underline-offset-4 hover:text-ink">
          Reintentar
        </button>
      ) : null}
    </p>
  );
}
