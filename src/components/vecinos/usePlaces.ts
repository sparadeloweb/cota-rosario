"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { PLACES_STORAGE_KEY, parseLugares, serializeLugares, type Lugar } from "@/lib/places";

const CHANGE_EVENT = "cota:lugares";

function leer(): string | null {
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

function almacenamientoDisponible(): boolean {
  try {
    const prueba = `${PLACES_STORAGE_KEY}:prueba`;
    window.localStorage.setItem(prueba, "1");
    window.localStorage.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
}

export interface PlacesState {
  lugares: Lugar[];
  disponible: boolean;
  listo: boolean;
  guardar: (lugares: readonly Lugar[]) => boolean;
}

export function usePlaces(): PlacesState {
  const raw = useSyncExternalStore(subscribe, leer, () => undefined);
  const disponible = useSyncExternalStore(subscribe, almacenamientoDisponible, () => true);
  const lugares = useMemo(() => parseLugares(raw ?? null), [raw]);

  const guardar = useCallback((nuevos: readonly Lugar[]) => {
    try {
      window.localStorage.setItem(PLACES_STORAGE_KEY, serializeLugares(nuevos));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { lugares, disponible, listo: raw !== undefined, guardar };
}
