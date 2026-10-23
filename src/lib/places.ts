import { ROSARIO_VIEWBOX } from "@/lib/placeReader";

export interface Lugar {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
}

export type ResultadoAlta = { lugares: Lugar[]; error: null } | { lugares: Lugar[]; error: "lleno" | "duplicado" | "fuera" | "nombre" };

export const PLACES_STORAGE_KEY = "cota:lugares";
export const MAX_LUGARES = 5;
export const NAME_MAX_CHARS = 60;
const DUPLICATE_RADIUS_M = 30;
const EARTH_RADIUS_M = 6_371_000;

export function dentroDeRosario(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat <= ROSARIO_VIEWBOX.north && lat >= ROSARIO_VIEWBOX.south && lon >= ROSARIO_VIEWBOX.west && lon <= ROSARIO_VIEWBOX.east;
}

export function distanciaMetros(a: Pick<Lugar, "lat" | "lon">, b: Pick<Lugar, "lat" | "lon">): number {
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function esLugar(valor: unknown): valor is Lugar {
  if (!valor || typeof valor !== "object") {
    return false;
  }
  const lugar = valor as Record<string, unknown>;
  return typeof lugar.id === "string" && typeof lugar.nombre === "string" && lugar.nombre.trim().length > 0 && typeof lugar.lat === "number" && typeof lugar.lon === "number" && dentroDeRosario(lugar.lat, lugar.lon);
}

export function parseLugares(raw: string | null): Lugar[] {
  if (!raw) {
    return [];
  }
  try {
    const datos: unknown = JSON.parse(raw);
    if (!Array.isArray(datos)) {
      return [];
    }
    return datos.filter(esLugar).slice(0, MAX_LUGARES).map((lugar) => ({ ...lugar, nombre: lugar.nombre.trim().slice(0, NAME_MAX_CHARS) }));
  } catch {
    return [];
  }
}

export function serializeLugares(lugares: readonly Lugar[]): string {
  return JSON.stringify(lugares.map(({ id, nombre, lat, lon }) => ({ id, nombre, lat, lon })));
}

export function agregarLugar(lugares: readonly Lugar[], nuevo: Lugar): ResultadoAlta {
  const nombre = nuevo.nombre.trim().slice(0, NAME_MAX_CHARS);
  if (!nombre) {
    return { lugares: [...lugares], error: "nombre" };
  }
  if (!dentroDeRosario(nuevo.lat, nuevo.lon)) {
    return { lugares: [...lugares], error: "fuera" };
  }
  if (lugares.some((lugar) => distanciaMetros(lugar, nuevo) < DUPLICATE_RADIUS_M)) {
    return { lugares: [...lugares], error: "duplicado" };
  }
  if (lugares.length >= MAX_LUGARES) {
    return { lugares: [...lugares], error: "lleno" };
  }
  return { lugares: [...lugares, { ...nuevo, nombre }], error: null };
}

export function quitarLugar(lugares: readonly Lugar[], id: string): Lugar[] {
  return lugares.filter((lugar) => lugar.id !== id);
}

export function renombrarLugar(lugares: readonly Lugar[], id: string, nombre: string): Lugar[] {
  const limpio = nombre.trim().slice(0, NAME_MAX_CHARS);
  return limpio ? lugares.map((lugar) => (lugar.id === id ? { ...lugar, nombre: limpio } : lugar)) : [...lugares];
}

export const ERROR_ALTA: Record<Exclude<ResultadoAlta["error"], null>, string> = {
  lleno: `Ya guardaste ${MAX_LUGARES} lugares. Quitá uno para agregar otro.`,
  duplicado: "Ese lugar ya está en tu lista.",
  fuera: "Ese punto queda fuera de Rosario.",
  nombre: "Poné un nombre para reconocer el lugar.",
};
