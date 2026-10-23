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
