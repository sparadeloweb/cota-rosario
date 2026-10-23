import { ROSARIO_VIEWBOX } from "@/lib/placeReader";

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export type AddResult = { places: Place[]; error: null } | { places: Place[]; error: "full" | "duplicate" | "outside" | "name" };

export const PLACES_STORAGE_KEY = "cota:places";
export const MAX_PLACES = 5;
export const NAME_MAX_CHARS = 60;
const DUPLICATE_RADIUS_M = 30;
const EARTH_RADIUS_M = 6_371_000;

export function isInsideRosario(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat <= ROSARIO_VIEWBOX.north && lat >= ROSARIO_VIEWBOX.south && lon >= ROSARIO_VIEWBOX.west && lon <= ROSARIO_VIEWBOX.east;
}

export function distanceMeters(a: Pick<Place, "lat" | "lon">, b: Pick<Place, "lat" | "lon">): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") {
    return false;
  }
  const place = value as Record<string, unknown>;
  return typeof place.id === "string" && typeof place.name === "string" && place.name.trim().length > 0 && typeof place.lat === "number" && typeof place.lon === "number" && isInsideRosario(place.lat, place.lon);
}

export function parsePlaces(raw: string | null): Place[] {
  if (!raw) {
    return [];
  }
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(isPlace).slice(0, MAX_PLACES).map((place) => ({ ...place, name: place.name.trim().slice(0, NAME_MAX_CHARS) }));
  } catch {
    return [];
  }
}

export function serializePlaces(places: readonly Place[]): string {
  return JSON.stringify(places.map(({ id, name, lat, lon }) => ({ id, name, lat, lon })));
}

export function addPlace(places: readonly Place[], created: Place): AddResult {
  const name = created.name.trim().slice(0, NAME_MAX_CHARS);
  if (!name) {
    return { places: [...places], error: "name" };
  }
  if (!isInsideRosario(created.lat, created.lon)) {
    return { places: [...places], error: "outside" };
  }
  if (places.some((place) => distanceMeters(place, created) < DUPLICATE_RADIUS_M)) {
    return { places: [...places], error: "duplicate" };
  }
  if (places.length >= MAX_PLACES) {
    return { places: [...places], error: "full" };
  }
  return { places: [...places, { ...created, name }], error: null };
}

export function removePlace(places: readonly Place[], id: string): Place[] {
  return places.filter((place) => place.id !== id);
}

export function renamePlace(places: readonly Place[], id: string, name: string): Place[] {
  const clean = name.trim().slice(0, NAME_MAX_CHARS);
  return clean ? places.map((place) => (place.id === id ? { ...place, name: clean } : place)) : [...places];
}

export const ADD_ERROR: Record<Exclude<AddResult["error"], null>, string> = {
  full: `Ya guardaste ${MAX_PLACES} lugares. Quitá uno para agregar otro.`,
  duplicate: "Ese lugar ya está en tu lista.",
  outside: "Ese punto queda fuera de Rosario.",
  name: "Poné un nombre para reconocer el lugar.",
};
