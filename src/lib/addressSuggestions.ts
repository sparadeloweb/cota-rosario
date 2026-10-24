import { isInsideRosario } from "@/lib/places";
import { ROSARIO_VIEWBOX } from "@/lib/placeReader";
import { SUGGESTION_ORIGIN } from "@/lib/securityHeaders";
export const MIN_QUERY_CHARS = 3;
const SUGGESTION_LIMIT = 8;
const SHOWN_SUGGESTIONS = 5;
const CITY = "Rosario";
const CITY_CENTER = { lat: -32.9468, lon: -60.6393 };

export interface AddressSuggestion {
  label: string;
  detail: string;
  lat: number;
  lon: number;
}

export function suggestionUrl(term: string): string | null {
  const query = term.trim();
  if (query.length < MIN_QUERY_CHARS) {
    return null;
  }
  const params = new URLSearchParams({
    q: query,
    limit: String(SUGGESTION_LIMIT),
    lat: String(CITY_CENTER.lat),
    lon: String(CITY_CENTER.lon),
    bbox: `${ROSARIO_VIEWBOX.west},${ROSARIO_VIEWBOX.south},${ROSARIO_VIEWBOX.east},${ROSARIO_VIEWBOX.north}`,
  });
  return `${SUGGESTION_ORIGIN}/api/?${params}`;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toSuggestion(candidate: unknown): AddressSuggestion | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  const { geometry, properties } = candidate as { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> };
  const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
  const lon = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!properties || text(properties.city) !== CITY || !isInsideRosario(lat, lon)) {
    return null;
  }
  const name = text(properties.name);
  const street = text(properties.street);
  const number = text(properties.housenumber);
  const address = street && number ? `${street} ${number}` : "";
  const label = name || address || street;
  if (!label) {
    return null;
  }
  const detail = name && address ? address : text(properties.district) || CITY;
  return { label, detail, lat, lon };
}

export function parseSuggestions(payload: unknown): AddressSuggestion[] {
  const features: unknown[] = payload && typeof payload === "object" && Array.isArray((payload as { features?: unknown }).features) ? (payload as { features: unknown[] }).features : [];
  const seen = new Set<string>();
  return features
    .map(toSuggestion)
    .filter((suggestion): suggestion is AddressSuggestion => {
      if (!suggestion || seen.has(suggestion.label)) {
        return false;
      }
      seen.add(suggestion.label);
      return true;
    })
    .slice(0, SHOWN_SUGGESTIONS);
}

const NEAREST_LIMIT = 5;
const NEAREST_RADIUS_KM = 0.2;

export interface NearestAddress {
  label: string;
  detail: string;
}

export function nearestAddressUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), limit: String(NEAREST_LIMIT), radius: String(NEAREST_RADIUS_KM) });
  return `${SUGGESTION_ORIGIN}/reverse?${params}`;
}

function nearestCandidate(feature: unknown): (NearestAddress & { rank: number }) | null {
  if (!feature || typeof feature !== "object") {
    return null;
  }
  const { geometry, properties } = feature as { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> };
  const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
  if (!properties || text(properties.city) !== CITY || !isInsideRosario(Number(coordinates[1]), Number(coordinates[0]))) {
    return null;
  }
  const street = text(properties.street);
  const number = text(properties.housenumber);
  const name = text(properties.name);
  const detail = text(properties.district) || CITY;
  if (street && number) {
    return { label: `${street} ${number}`, detail, rank: 0 };
  }
  if (street) {
    return { label: street, detail, rank: 1 };
  }
  return name ? { label: name, detail, rank: 2 } : null;
}

export function parseNearestAddress(payload: unknown): NearestAddress | null {
  const features: unknown[] = payload && typeof payload === "object" && Array.isArray((payload as { features?: unknown }).features) ? (payload as { features: unknown[] }).features : [];
  const best = features
    .map(nearestCandidate)
    .filter((candidate): candidate is NearestAddress & { rank: number } => candidate !== null)
    .reduce<(NearestAddress & { rank: number }) | null>((current, candidate) => (!current || candidate.rank < current.rank ? candidate : current), null);
  return best ? { label: best.label, detail: best.detail } : null;
}
