import { INA_STATION } from "@/lib/sources";
import { requireRecent } from "@/lib/dataChecks";
import { FRESHNESS, readLiveSource } from "@/lib/liveSources";

const WFS_BASE = "https://alerta.ina.gob.ar/geoserver/ows";
const LAYER = "public2:ultimas_alturas_con_timeseries";
const MAX_FEATURES = 500;
const HISTORY_DAYS = 14;
const MILLIS_PER_DAY = 86_400_000;
const INA_TIMEOUT_MS = 30_000;
const EXCEPTION_MESSAGE_CHARS = 120;

export interface RiverReading {
  date: string;
  meters: number;
}

export interface RiverStation {
  name: string;
  river: string;
  meters: number;
  date: string;
  trend: string;
  status: string;
  alert: number | null;
  evacuation: number | null;
  lowWater: number | null;
  lat: number;
  lon: number;
}

export interface RiverSnapshot {
  station: RiverStation;
  series: RiverReading[];
  marginToAlert: number | null;
  network: RiverStation[];
  fetchedAt: string;
}

interface WfsProperties {
  "nombre"?: string;
  "rio"?: string;
  "valor"?: string | number;
  "fecha"?: string;
  "tendencia"?: string;
  "estado"?: string;
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
  const meters = toNumber(properties["valor"]);
  if (meters === null || !properties["nombre"]) {
    return null;
  }
  const [lon, lat] = feature.geometry?.coordinates ?? [0, 0];
  return {
    name: properties["nombre"],
    river: properties["rio"] ?? "",
    meters,
    date: properties["fecha"] ?? "",
    trend: properties["tendencia"] ?? "",
    status: properties["estado"] ?? "",
    alert: toNumber(properties.nivel_de_alerta),
    evacuation: toNumber(properties.nivel_de_evacuacion),
    lowWater: toNumber(properties.nivel_de_aguas_bajas),
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
    .map(([date, value]) => ({ date, meters: Number(value) }))
    .filter((reading) => Number.isFinite(reading.meters))
    .sort((a, b) => a.date.localeCompare(b.date));
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

function serviceExceptionMessage(body: string): string {
  const match = body.match(/<ServiceException(?:\s[^>]*)?>([\s\S]*?)<\/ServiceException>/);
  const detail = match ? match[1].replace(/\s+/g, " ").trim() : "";
  return detail.slice(0, EXCEPTION_MESSAGE_CHARS) || "excepción del servicio sin detalle";
}

async function getCollection(url: string, label: string, timeoutMs = INA_TIMEOUT_MS): Promise<{ features: WfsFeature[] }> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new Error(`El servicio del INA respondió ${response.status} al pedir ${label}`);
  }
  const body = await response.text();
  if (body.trimStart().startsWith("<")) {
    throw new Error(`El INA devolvió una excepción al pedir ${label}: ${serviceExceptionMessage(body)}`);
  }
  return JSON.parse(body) as { features: WfsFeature[] };
}

export async function fetchRiver(historyDays: number = HISTORY_DAYS): Promise<RiverSnapshot> {
  return readLiveSource(`ina:${historyDays}`, FRESHNESS.river, () => fetchRiverUncached(historyDays));
}

async function fetchRiverUncached(historyDays: number): Promise<RiverSnapshot> {
  const [detail, fullNetwork] = await Promise.all([
    getCollection(
      wfsUrl({
        CQL_FILTER: `nombre='${INA_STATION}'`,
        viewParams: `timeStart:${isoDay(-historyDays)};timeEnd:${isoDay(1)};`,
      }),
      `la estación ${INA_STATION}`,
      historyDays > HISTORY_DAYS ? 90_000 : INA_TIMEOUT_MS,
    ),
    getCollection(wfsUrl({ propertyName: NETWORK_FIELDS, maxFeatures: String(MAX_FEATURES) }), "la red completa"),
  ]);

  const target = detail.features[0];
  const station = target ? toStation(target) : null;
  if (!station) {
    throw new Error(`El INA no devolvió la estación ${INA_STATION}`);
  }
  requireRecent(station.date, 48 * 3_600_000, "Estación Rosario del INA");

  const network = fullNetwork.features.map(toStation).filter((station): station is RiverStation => station !== null);

  return {
    station,
    series: toSeries(target?.properties.timeseries),
    marginToAlert: station.alert === null ? null : Number((station.alert - station.meters).toFixed(2)),
    network: network.sort((a, b) => a.name.localeCompare(b.name)),
    fetchedAt: new Date().toISOString(),
  };
}
