"use client";

import { useEffect, useState } from "react";
import { nearestAddressUrl, parseNearestAddress, type NearestAddress } from "@/lib/addressSuggestions";

const DEBOUNCE_MS = 400;

interface Lookup {
  key: string;
  address: NearestAddress | null;
}

export function useNearestAddress(lat: number | null, lon: number | null, enabled: boolean): NearestAddress | null | undefined {
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const key = enabled && lat !== null && lon !== null ? `${lat},${lon}` : null;

  useEffect(() => {
    if (key === null || lat === null || lon === null) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(nearestAddressUrl(lat, lon), { signal: controller.signal, headers: { accept: "application/json" } })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: unknown) => setLookup({ key, address: parseNearestAddress(payload) }))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            console.warn("Nearest address lookup failed:", error);
            setLookup({ key, address: null });
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, lat, lon]);

  return lookup && lookup.key === key ? lookup.address : undefined;
}
