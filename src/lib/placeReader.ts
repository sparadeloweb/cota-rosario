import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import {
  categoriaDesdeGris,
  featureAt,
  lecturaDistrito,
  nearestFeature,
  type CategoriaClima,
  type ClimaMeta,
  type DefensaCivil,
  type Hallazgo,
  type LecturaTerreno,
  type TerrainMeta,
} from "@/lib/lookup";
import { loadPixels, rasterOffset } from "@/lib/rasters";

export const PLACE_DATA = {
  areas: "/data/areas-inundables.json",
  terreno: "/data/terreno.json",
  terrenoPng: "/data/terreno.png",
  clima: "/data/riesgo-clima.json",
  defensaCivil: "/data/defensa-civil.json",
  distritos: "/data/distritos.json",
  barrios: "/data/barrios.json",
} as const;

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
export const ROSARIO_VIEWBOX = { west: -60.79, north: -32.83, east: -60.58, south: -33.06 } as const;
const LOW_POINT_MIN_M = 1;
const MASK_THRESHOLD = 127;
const ALPHA_MAX = 255;
const ALPHA_CHANNEL = 3;
const ADDRESS_PARTS = 3;

type Areas = FeatureCollection<Polygon | MultiPolygon, Record<string, string>>;

export type LecturaLugar = Omit<Hallazgo, "etiqueta" | "nivel">;

export interface Geocodificado {
  lat: number;
  lon: number;
  etiqueta: string;
}

interface Datos {
  areas: Areas | null;
  terreno: TerrainMeta | null;
  clima: ClimaMeta | null;
  defensaCivil: DefensaCivil | null;
  distritos: Areas | null;
  barrios: Areas | null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function geocodificar(termino: string): Promise<Geocodificado | null> {
  const params = new URLSearchParams({
    q: `${termino}, Rosario, Santa Fe, Argentina`,
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
  return { lat: Number(results[0].lat), lon: Number(results[0].lon), etiqueta: results[0].display_name.split(",").slice(0, ADDRESS_PARTS).join(", ") };
}

export function createPlaceReader() {
  let datos: Promise<Datos> | null = null;
  let terrenoPixels: Promise<[Uint8ClampedArray, Uint8ClampedArray]> | null = null;
  let climaPixels: Promise<Uint8ClampedArray> | null = null;

  const cargar = () => {
    datos ??= Promise.all([
      fetchJson<Areas>(PLACE_DATA.areas),
      fetchJson<TerrainMeta>(PLACE_DATA.terreno),
      fetchJson<ClimaMeta>(PLACE_DATA.clima),
      fetchJson<DefensaCivil>(PLACE_DATA.defensaCivil),
      fetchJson<Areas>(PLACE_DATA.distritos),
      fetchJson<Areas>(PLACE_DATA.barrios),
    ]).then(([areas, terreno, clima, defensaCivil, distritos, barrios]) => ({ areas, terreno, clima, defensaCivil, distritos, barrios }));
    return datos;
  };

  const terrenoEn = async (meta: TerrainMeta | null, lat: number, lon: number): Promise<LecturaTerreno> => {
    if (!meta) {
      return null;
    }
    terrenoPixels ??= Promise.all([loadPixels(PLACE_DATA.terrenoPng, meta), loadPixels(`/data/${meta.mascaraEdificado}`, meta)]);
    const [relieve, mascara] = await terrenoPixels;
    const offset = rasterOffset(meta, lat, lon);
    if (offset === null) {
      return null;
    }
    if (mascara[offset] > MASK_THRESHOLD) {
      return { estado: "edificado", metros: 0 };
    }
    const metros = (relieve[offset + ALPHA_CHANNEL] / ALPHA_MAX) * meta.escalaMaximaMetros;
    return { estado: metros >= LOW_POINT_MIN_M ? "bajo" : "plano", metros };
  };

  const climaEn = async (meta: ClimaMeta | null, lat: number, lon: number): Promise<CategoriaClima | null> => {
    if (!meta) {
      return null;
    }
    climaPixels ??= loadPixels(`/data/${meta.archivoCategorias}`, meta);
    const offset = rasterOffset(meta, lat, lon);
    return offset === null ? null : categoriaDesdeGris(meta, (await climaPixels)[offset]);
  };

  return {
    terreno: async () => (await cargar()).terreno,
    async leer(lat: number, lon: number): Promise<LecturaLugar> {
      const { areas, terreno, clima, defensaCivil, distritos, barrios } = await cargar();
      const match = areas ? featureAt(areas, lat, lon) : undefined;
      const cercano = areas && !match ? nearestFeature(areas, lat, lon) : null;
      const distrito = distritos ? featureAt(distritos, lat, lon)?.properties.distrito : undefined;
      const [lecturaTerreno, categoriaClima] = await Promise.all([terrenoEn(terreno, lat, lon).catch(() => null), climaEn(clima, lat, lon).catch(() => null)]);
      return {
        zona: match?.properties.zona?.trim(),
        dentro: Boolean(match),
        cercano: cercano ? { zona: cercano.feature.properties.zona?.trim() ?? "?", metros: cercano.metros } : null,
        terreno: lecturaTerreno,
        clima: categoriaClima,
        distrito: defensaCivil && distrito ? lecturaDistrito(defensaCivil, distrito) : null,
        barrio: barrios ? (featureAt(barrios, lat, lon)?.properties.barrio ?? null) : null,
      };
    },
  };
}

export type PlaceReader = ReturnType<typeof createPlaceReader>;
