"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { PLACES_STORAGE_KEY, parsePlaces, serializePlaces, type Place } from "@/lib/places";

const CHANGE_EVENT = "cota:places";

function read(): string | null {
  try {
    return window.localStorage.getItem(PLACES_STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === PLACES_STORAGE_KEY) {
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function isStorageAvailable(): boolean {
  try {
    const probe = `${PLACES_STORAGE_KEY}:prueba`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export interface PlacesState {
  places: Place[];
  available: boolean;
  ready: boolean;
  save: (places: readonly Place[]) => boolean;
}

export function usePlaces(): PlacesState {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  const available = useSyncExternalStore(subscribe, isStorageAvailable, () => true);
  const places = useMemo(() => parsePlaces(raw ?? null), [raw]);

  const save = useCallback((added: readonly Place[]) => {
    try {
      window.localStorage.setItem(PLACES_STORAGE_KEY, serializePlaces(added));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { places, available, ready: raw !== undefined, save };
}
