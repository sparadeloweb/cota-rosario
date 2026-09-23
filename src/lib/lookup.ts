import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { RasterMeta } from "@/lib/rasters";
import type { RiskLevel } from "@/lib/risk";

export type CategoriaClima = "muy bajo" | "bajo" | "medio" | "alto";

export interface ClimaMeta extends RasterMeta {
  nombre: string;
  fuente: string;
  unidad: string;
  categorias: string[];
  categoriaGris: number[];
  archivoCategorias: string;
}

export interface MesPico {
  mes: string;
  casos: number;
  lluviaMm: number;
}

export interface ResumenAnegamientos {
  total: number;
  porAnio: Record<string, number>;
  mesPico: MesPico | null;
}

export interface DefensaCivil {
  periodo: { desde: string; hasta: string };
  mesesPorAnio: Record<string, number>;
  distritos: Record<string, ResumenAnegamientos>;
  ciudad: ResumenAnegamientos;
}

export interface LecturaDistrito {
  distrito: string;
  anio: string;
  casosAnio: number;
  participacion: number;
  mesPico: MesPico | null;
}

export interface TerrainMeta extends RasterMeta {
  escalaMaximaMetros: number;
  ventanaMetros: number;
  mascaraEdificado: string;
}

export type LecturaTerreno = { estado: "bajo" | "plano" | "edificado"; metros: number } | null;

export interface Hallazgo {
  etiqueta: string;
  zona?: string;
  nivel?: RiskLevel;
  dentro: boolean;
  cercano: { zona: string; metros: number } | null;
  terreno: LecturaTerreno;
  clima: CategoriaClima | null;
  distrito: LecturaDistrito | null;
  barrio: string | null;
}

type AnyPolygonFeature = Feature<Polygon | MultiPolygon, Record<string, string>>;

const MONTHS_IN_YEAR = 12;
const EARTH_RADIUS_M = 6371000;
const MES_LABEL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
      const [lonA, latA] = ring[index];
      const [lonB, latB] = ring[previous];
      const crosses = latA > lat !== latB > lat && lon < ((lonB - lonA) * (lat - latA)) / (latB - latA) + lonA;
      if (crosses) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function ringsOf(feature: AnyPolygonFeature): number[][][][] {
  return feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
}

export function featureAt(collection: FeatureCollection<Polygon | MultiPolygon, Record<string, string>>, lat: number, lon: number) {
  return collection.features.find((feature) => ringsOf(feature).some((rings) => pointInPolygon(lat, lon, rings)));
}

function haversineM(latA: number, lonA: number, latB: number, lonB: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(latB - latA);
  const dLon = toRad(lonB - lonA);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function nearestFeature(collection: FeatureCollection<Polygon | MultiPolygon, Record<string, string>>, lat: number, lon: number) {
  return collection.features.reduce<{ feature: AnyPolygonFeature; metros: number } | null>((best, feature) => {
    const metros = ringsOf(feature)
      .flat(2)
      .reduce((min, [vertexLon, vertexLat]) => Math.min(min, haversineM(lat, lon, vertexLat, vertexLon)), Number.POSITIVE_INFINITY);
    return best === null || metros < best.metros ? { feature, metros } : best;
  }, null);
}

export function categoriaDesdeGris(meta: ClimaMeta, gris: number): CategoriaClima | null {
  const index = meta.categoriaGris.findIndex((value) => Math.abs(value - gris) <= 1);
  if (index <= 0) {
    return null;
  }
  return meta.categorias[index] as CategoriaClima;
}

export function lecturaDistrito(datos: DefensaCivil, distrito: string): LecturaDistrito | null {
  const propio = datos.distritos[distrito];
  if (!propio) {
    return null;
  }
  const aniosCompletos = Object.entries(datos.mesesPorAnio)
    .filter(([, meses]) => meses === MONTHS_IN_YEAR)
    .map(([anio]) => anio)
    .sort();
  const anio = aniosCompletos[aniosCompletos.length - 1] ?? datos.periodo.hasta.slice(0, 4);
  const casosAnio = propio.porAnio[anio] ?? 0;
  const ciudadAnio = datos.ciudad.porAnio[anio] ?? 0;
  return {
    distrito,
    anio,
    casosAnio,
    participacion: ciudadAnio === 0 ? 0 : Math.round((casosAnio / ciudadAnio) * 100),
    mesPico: propio.mesPico,
  };
}

export function etiquetaMes(mes: string): string {
  const [anio, numero] = mes.split("-");
  return `${MES_LABEL[Number(numero) - 1]} de ${anio}`;
}

export function formatoDistancia(metros: number): string {
  return metros < 1000 ? `${Math.round(metros / 10) * 10} m` : `${(metros / 1000).toFixed(1)} km`;
}
