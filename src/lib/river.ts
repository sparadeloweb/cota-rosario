import { INA_STATION } from "@/lib/sources";

const WFS_BASE = "https://alerta.ina.gob.ar/geoserver/ows";
const LAYER = "public2:ultimas_alturas_con_timeseries";
const MAX_FEATURES = 500;
const HISTORY_DAYS = 14;
const REVALIDATE_SECONDS = 900;
const MILLIS_PER_DAY = 86_400_000;

export interface RiverReading {
  fecha: string;
  metros: number;
}

export interface RiverStation {
  nombre: string;
  rio: string;
  metros: number;
  fecha: string;
  tendencia: string;
  estado: string;
  alerta: number | null;
  evacuacion: number | null;
  aguasBajas: number | null;
  lat: number;
  lon: number;
}

export interface RiverSnapshot {
  estacion: RiverStation;
  serie: RiverReading[];
  margenHastaAlerta: number | null;
  red: RiverStation[];
  consultadoEn: string;
}

interface WfsProperties {
  nombre?: string;
  rio?: string;
  valor?: string | number;
  fecha?: string;
  tendencia?: string;
  estado?: string;
  nivel_de_alerta?: string | number | null;
  nivel_de_evacuacion?: string | number | null;
  nivel_de_aguas_bajas?: string | number | null;
  timeseries?: string | [string, string][];
}

interface WfsFeature {
  properties: WfsProperties;
  geometry: { coordinates: [number, number] } | null;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStation(feature: WfsFeature): RiverStation | null {
  const properties = feature.properties;
  const metros = toNumber(properties.valor);
  if (metros === null || !properties.nombre) {
    return null;
  }
  const [lon, lat] = feature.geometry?.coordinates ?? [0, 0];
  return {
    nombre: properties.nombre,
    rio: properties.rio ?? "",
    metros,
    fecha: properties.fecha ?? "",
    tendencia: properties.tendencia ?? "",
    estado: properties.estado ?? "",
    alerta: toNumber(properties.nivel_de_alerta),
    evacuacion: toNumber(properties.nivel_de_evacuacion),
    aguasBajas: toNumber(properties.nivel_de_aguas_bajas),
    lat,
    lon,
  };
}

function toSeries(raw: WfsProperties["timeseries"]): RiverReading[] {
  if (!raw) {
    return [];
  }
  const entries = typeof raw === "string" ? (JSON.parse(raw) as [string, string][]) : raw;
  return entries
    .map(([fecha, valor]) => ({ fecha, metros: Number(valor) }))
    .filter((reading) => Number.isFinite(reading.metros))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * MILLIS_PER_DAY).toISOString().slice(0, 10);
}

const NETWORK_FIELDS = "nombre,rio,valor,fecha,tendencia,estado,nivel_de_alerta,nivel_de_evacuacion,nivel_de_aguas_bajas";

function wfsUrl(extra: Record<string, string>): string {
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: LAYER,
    outputFormat: "application/json",
    ...extra,
  });
  return `${WFS_BASE}?${params}`;
}

async function getCollection(url: string, etiqueta: string): Promise<{ features: WfsFeature[] }> {
  const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) {
    throw new Error(`El servicio del INA respondió ${response.status} al pedir ${etiqueta}`);
  }
  return (await response.json()) as { features: WfsFeature[] };
}

export async function fetchRiver(): Promise<RiverSnapshot> {
  const [detalle, redCompleta] = await Promise.all([
    getCollection(
      wfsUrl({
        CQL_FILTER: `nombre='${INA_STATION}'`,
        viewParams: `timeStart:${isoDay(-HISTORY_DAYS)};timeEnd:${isoDay(1)};`,
      }),
      `la estación ${INA_STATION}`,
    ),
    getCollection(wfsUrl({ propertyName: NETWORK_FIELDS, maxFeatures: String(MAX_FEATURES) }), "la red completa"),
  ]);

  const target = detalle.features[0];
  const estacion = target ? toStation(target) : null;
  if (!estacion) {
    throw new Error(`El INA no devolvió la estación ${INA_STATION}`);
  }

  const red = redCompleta.features.map(toStation).filter((station): station is RiverStation => station !== null);

  return {
    estacion,
    serie: toSeries(target?.properties.timeseries),
    margenHastaAlerta: estacion.alerta === null ? null : Number((estacion.alerta - estacion.metros).toFixed(2)),
    red: red.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    consultadoEn: new Date().toISOString(),
  };
}
