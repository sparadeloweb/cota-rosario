import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import {
  categoryFromGray,
  featureAt,
  districtReading,
  nearestFeature,
  type ClimateCategory,
  type ClimateMeta,
  type CivilDefense,
  type Finding,
  type TerrainReading,
  type TerrainMeta,
} from "@/lib/lookup";
import { loadPixels, rasterOffset } from "@/lib/rasters";

export const PLACE_DATA = {
  floodZones: "/data/flood-zones.json",
  terrain: "/data/terrain.json",
  terrainPng: "/data/terrain.png",
  climateRisk: "/data/climate-risk.json",
  civilDefense: "/data/civil-defense.json",
  districts: "/data/districts.json",
  neighbourhoods: "/data/neighbourhoods.json",
} as const;

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
export const ROSARIO_VIEWBOX = { west: -60.79, north: -32.83, east: -60.58, south: -33.06 } as const;
const LOW_POINT_MIN_M = 1;
const MASK_THRESHOLD = 127;
const ALPHA_MAX = 255;
const ALPHA_CHANNEL = 3;
const ADDRESS_PARTS = 3;

type FloodZones = FeatureCollection<Polygon | MultiPolygon, Record<string, string>>;

export type PlaceReading = Omit<Finding, "label" | "level">;

export interface GeocodedPlace {
  lat: number;
  lon: number;
  label: string;
}

interface PlaceData {
  floodZones: FloodZones | null;
  terrain: TerrainMeta | null;
  climateRisk: ClimateMeta | null;
  civilDefense: CivilDefense | null;
  districts: FloodZones | null;
  neighbourhoods: FloodZones | null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function geocode(term: string): Promise<GeocodedPlace | null> {
  const params = new URLSearchParams({
    q: `${term}, Rosario, Santa Fe, Argentina`,
    format: "json",
    limit: "1",
    viewbox: `${ROSARIO_VIEWBOX.west},${ROSARIO_VIEWBOX.north},${ROSARIO_VIEWBOX.east},${ROSARIO_VIEWBOX.south}`,
    bounded: "1",
  });
  const response = await fetch(`${NOMINATIM}?${params}`, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error("El buscador de direcciones no respondió.");
  }
  const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  if (!results.length) {
    return null;
  }
  return { lat: Number(results[0].lat), lon: Number(results[0].lon), label: results[0].display_name.split(",").slice(0, ADDRESS_PARTS).join(", ") };
}

export function createPlaceReader() {
  let data: Promise<PlaceData> | null = null;
  let terrainPixels: Promise<[Uint8ClampedArray, Uint8ClampedArray]> | null = null;
  let climatePixels: Promise<Uint8ClampedArray> | null = null;

  const load = () => {
    data ??= Promise.all([
      fetchJson<FloodZones>(PLACE_DATA.floodZones),
      fetchJson<TerrainMeta>(PLACE_DATA.terrain),
      fetchJson<ClimateMeta>(PLACE_DATA.climateRisk),
      fetchJson<CivilDefense>(PLACE_DATA.civilDefense),
      fetchJson<FloodZones>(PLACE_DATA.districts),
      fetchJson<FloodZones>(PLACE_DATA.neighbourhoods),
    ]).then(([floodZones, terrain, climateRisk, civilDefense, districts, neighbourhoods]) => ({ floodZones, terrain, climateRisk, civilDefense, districts, neighbourhoods }));
    return data;
  };

  const terrainAt = async (meta: TerrainMeta | null, lat: number, lon: number): Promise<TerrainReading> => {
    if (!meta) {
      return null;
    }
    terrainPixels ??= Promise.all([loadPixels(PLACE_DATA.terrainPng, meta), loadPixels(`/data/${meta.builtMask}`, meta)]);
    const [relief, mask] = await terrainPixels;
    const offset = rasterOffset(meta, lat, lon);
    if (offset === null) {
      return null;
    }
    if (mask[offset] > MASK_THRESHOLD) {
      return { status: "built", meters: 0 };
    }
    const meters = (relief[offset + ALPHA_CHANNEL] / ALPHA_MAX) * meta.maxScaleMeters;
    return { status: meters >= LOW_POINT_MIN_M ? "low" : "flat", meters };
  };

  const climateAt = async (meta: ClimateMeta | null, lat: number, lon: number): Promise<ClimateCategory | null> => {
    if (!meta) {
      return null;
    }
    climatePixels ??= loadPixels(`/data/${meta.categoriesFile}`, meta);
    const offset = rasterOffset(meta, lat, lon);
    return offset === null ? null : categoryFromGray(meta, (await climatePixels)[offset]);
  };

  return {
    terrain: async () => (await load()).terrain,
    async read(lat: number, lon: number): Promise<PlaceReading> {
      const { floodZones, terrain, climateRisk, civilDefense, districts, neighbourhoods } = await load();
      const match = floodZones ? featureAt(floodZones, lat, lon) : undefined;
      const nearest = floodZones && !match ? nearestFeature(floodZones, lat, lon) : null;
      const district = districts ? featureAt(districts, lat, lon)?.properties.district : undefined;
      const [terrainReading, climateCategory] = await Promise.all([terrainAt(terrain, lat, lon).catch(() => null), climateAt(climateRisk, lat, lon).catch(() => null)]);
      return {
        zone: match?.properties.zone?.trim(),
        inside: Boolean(match),
        nearest: nearest ? { zone: nearest.feature.properties.zone?.trim() ?? "?", meters: nearest.meters } : null,
        terrain: terrainReading,
        climateRisk: climateCategory,
        district: civilDefense && district ? districtReading(civilDefense, district) : null,
        neighbourhood: neighbourhoods ? (featureAt(neighbourhoods, lat, lon)?.properties.neighbourhood ?? null) : null,
      };
    },
  };
}

export type PlaceReader = ReturnType<typeof createPlaceReader>;
