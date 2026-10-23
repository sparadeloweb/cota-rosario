"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaceReader, PlaceReading } from "@/lib/placeReader";
import type { Place } from "@/lib/places";

export type ReadingState = { status: "loading" } | { status: "ready"; reading: PlaceReading } | { status: "failed" };

const LOADING: ReadingState = { status: "loading" };

function keyOf(place: Pick<Place, "lat" | "lon">): string {
  return `${place.lat},${place.lon}`;
}

export function usePlaceReadings(places: readonly Place[], reader: PlaceReader): (place: Place) => ReadingState {
  const [readings, setReadings] = useState<Record<string, ReadingState>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    for (const place of places) {
      const key = keyOf(place);
      if (requested.current.has(key)) {
        continue;
      }
      requested.current.add(key);
      reader
        .read(place.lat, place.lon)
        .then((reading) => setReadings((current) => ({ ...current, [key]: { status: "ready", reading } })))
        .catch((error: unknown) => {
          console.warn("Could not read the layers for a saved place:", error);
          requested.current.delete(key);
          setReadings((current) => ({ ...current, [key]: { status: "failed" } }));
        });
    }
  }, [places, reader]);

  return (place) => readings[keyOf(place)] ?? LOADING;
}
