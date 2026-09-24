import { PARANA_GLOFAS_CELL, ROSARIO } from "@/lib/sources";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood";
const TIMEZONE = "America/Argentina/Buenos_Aires";
const FORECAST_DAYS = 3;
const OUTLOOK_DAYS = 7;
const DISCHARGE_FORECAST_DAYS = 7;
const WINDOW_HOURS = 2;
const REVALIDATE_SECONDS = 300;
const RETRY_DELAY_MS = 1500;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

export async function fetchWithRetry(url: string, etiqueta: string): Promise<Response> {
  const attempt = () => fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  const first = await attempt().catch(() => null);
  if (first && !RETRY_STATUSES.has(first.status)) {
    if (!first.ok) {
      throw new Error(`${etiqueta} respondió ${first.status}`);
    }
    return first;
  }
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  const second = await attempt();
  if (!second.ok) {
    throw new Error(`${etiqueta} respondió ${second.status} dos veces seguidas`);
  }
  return second;
}

export interface RainHour {
  hora: string;
  milimetros: number;
  probabilidad: number;
}

export interface RainSnapshot {
  horas: RainHour[];
  acumulado24h: number;
  picoVentana: { milimetros: number; desde: string; hasta: string } | null;
  consultadoEn: string;
}

export interface DischargeDay {
  fecha: string;
  caudal: number;
}

export interface DischargeSnapshot {
  celda: { lat: number; lon: number };
  dias: DischargeDay[];
  pasado: DischargeDay[];
  actual: number | null;
  consultadoEn: string;
}

export interface RainOutlookDay {
  fecha: string;
  milimetros: number;
  probabilidad: number;
  max2h: number;
}

export interface RainOutlook {
  ventanaDias: number;
  dias: RainOutlookDay[];
  total: number;
  max2h: number;
  maximoDia: RainOutlookDay;
  consultadoEn: string;
}

interface ForecastResponse {
  hourly: { time: string[]; precipitation: number[]; precipitation_probability: number[] };
}

interface OutlookResponse {
  hourly: { time: string[]; precipitation: number[] };
  daily: { time: string[]; precipitation_sum: number[]; precipitation_probability_max: number[] };
}

interface FloodResponse {
  latitude: number;
  longitude: number;
  daily: { time: string[]; river_discharge: number[] };
}

function peakWindow(horas: RainHour[]): RainSnapshot["picoVentana"] {
  if (horas.length < WINDOW_HOURS) {
    return null;
  }
  let best = { milimetros: -1, desde: "", hasta: "" };
  for (let index = 0; index + WINDOW_HOURS <= horas.length; index += 1) {
    const slice = horas.slice(index, index + WINDOW_HOURS);
    const total = slice.reduce((sum, hour) => sum + hour.milimetros, 0);
    if (total > best.milimetros) {
      best = {
        milimetros: Number(total.toFixed(1)),
        desde: slice[0].hora,
        hasta: slice[slice.length - 1].hora,
      };
    }
  }
  return best.milimetros < 0 ? null : best;
}

export async function fetchRain(): Promise<RainSnapshot> {
  const params = new URLSearchParams({
    latitude: String(ROSARIO.lat),
    longitude: String(ROSARIO.lon),
    hourly: "precipitation,precipitation_probability",
    forecast_days: String(FORECAST_DAYS),
    timezone: TIMEZONE,
  });

  const response = await fetchWithRetry(`${FORECAST_URL}?${params}`, "Open-Meteo");

  const data = (await response.json()) as ForecastResponse;
  const now = Date.now();
  const horas: RainHour[] = data.hourly.time
    .map((hora, index) => ({
      hora,
      milimetros: data.hourly.precipitation[index] ?? 0,
      probabilidad: data.hourly.precipitation_probability[index] ?? 0,
    }))
    .filter((hour) => new Date(hour.hora).getTime() >= now - 3_600_000);

  const proximas24 = horas.slice(0, 24);

  return {
    horas,
    acumulado24h: Number(proximas24.reduce((sum, hour) => sum + hour.milimetros, 0).toFixed(1)),
    picoVentana: peakWindow(horas.slice(0, 48)),
    consultadoEn: new Date().toISOString(),
  };
}

export async function fetchDischarge(pastDays = 0): Promise<DischargeSnapshot> {
  const params = new URLSearchParams({
    latitude: String(PARANA_GLOFAS_CELL.lat),
    longitude: String(PARANA_GLOFAS_CELL.lon),
    daily: "river_discharge",
    forecast_days: String(DISCHARGE_FORECAST_DAYS),
    past_days: String(pastDays),
  });

  const response = await fetchWithRetry(`${FLOOD_URL}?${params}`, "La API de inundaciones (GloFAS)");

  const data = (await response.json()) as FloodResponse;
  const hoy = new Date().toISOString().slice(0, 10);
  const todos = data.daily.time.map((fecha, index) => ({ fecha, caudal: data.daily.river_discharge[index] ?? 0 }));
  const dias = todos.filter((dia) => dia.fecha >= hoy);

  return {
    celda: { lat: data.latitude, lon: data.longitude },
    dias,
    pasado: todos.filter((dia) => dia.fecha < hoy),
    actual: dias[0]?.caudal ?? null,
    consultadoEn: new Date().toISOString(),
  };
}

export async function fetchRainOutlook(): Promise<RainOutlook> {
  const params = new URLSearchParams({
    latitude: String(ROSARIO.lat),
    longitude: String(ROSARIO.lon),
    hourly: "precipitation",
    daily: "precipitation_sum,precipitation_probability_max",
    forecast_days: String(OUTLOOK_DAYS),
    timezone: TIMEZONE,
  });

  const response = await fetchWithRetry(`${FORECAST_URL}?${params}`, "Open-Meteo");

  const data = (await response.json()) as OutlookResponse;
  const horas = data.hourly.precipitation.map((mm) => mm ?? 0);
  const ventanas = horas.map((mm, index) => mm + (horas[index + 1] ?? 0));
  const max2hPorDia = data.hourly.time.reduce<Record<string, number>>((acc, hora, index) => {
    const dia = hora.slice(0, 10);
    return { ...acc, [dia]: Math.max(acc[dia] ?? 0, ventanas[index]) };
  }, {});
  const dias = data.daily.time.map((fecha, index) => ({
    fecha,
    milimetros: Number((data.daily.precipitation_sum[index] ?? 0).toFixed(1)),
    probabilidad: data.daily.precipitation_probability_max[index] ?? 0,
    max2h: Number((max2hPorDia[fecha] ?? 0).toFixed(1)),
  }));
  const max2h = Math.max(0, ...ventanas);
  const maximoDia = dias.reduce((best, dia) => (dia.milimetros > best.milimetros ? dia : best), dias[0]);

  return {
    ventanaDias: OUTLOOK_DAYS,
    dias,
    total: Number(dias.reduce((sum, dia) => sum + dia.milimetros, 0).toFixed(1)),
    max2h: Number(max2h.toFixed(1)),
    maximoDia,
    consultadoEn: new Date().toISOString(),
  };
}

const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const BALANCE_PAST_DAYS = 3;
const BALANCE_FORECAST_DAYS = 3;
const HOURS_24 = 24;
const HOURS_48 = 48;
const HOURS_72 = 72;

export interface RainBalance {
  ahoraLocal: string;
  caido24h: number;
  caido72h: number;
  prevista24h: number;
  prevista48h: number;
  probabilidadMax24h: number;
  porDia: { fecha: string; caidoMm: number; previstoMm: number }[];
  consultadoEn: string;
}

export interface MonthRain {
  mes: string;
  acumuladoMm: number;
  diasConDato: number;
  consultadoEn: string;
}

interface BalanceResponse {
  hourly: { time: string[]; precipitation: (number | null)[]; precipitation_probability: (number | null)[] };
}

interface ArchiveResponse {
  daily: { time: string[]; precipitation_sum: (number | null)[] };
}

function localNowKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}`;
}

function sum(values: number[]): number {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(1));
}

export async function fetchRainBalance(): Promise<RainBalance> {
  const params = new URLSearchParams({
    latitude: String(ROSARIO.lat),
    longitude: String(ROSARIO.lon),
    hourly: "precipitation,precipitation_probability",
    past_days: String(BALANCE_PAST_DAYS),
    forecast_days: String(BALANCE_FORECAST_DAYS),
    timezone: TIMEZONE,
  });
  const response = await fetchWithRetry(`${FORECAST_URL}?${params}`, "Open-Meteo");
  const data = (await response.json()) as BalanceResponse;
  const ahora = localNowKey();
  const horas = data.hourly.time.map((hora, index) => ({ hora, mm: data.hourly.precipitation[index] ?? 0, prob: data.hourly.precipitation_probability[index] ?? 0 }));
  const pasadas = horas.filter((hora) => hora.hora.slice(0, 13) < ahora);
  const futuras = horas.filter((hora) => hora.hora.slice(0, 13) >= ahora);
  const dias = [...new Set(horas.map((hora) => hora.hora.slice(0, 10)))].sort();
  return {
    ahoraLocal: ahora,
    caido24h: sum(pasadas.slice(-HOURS_24).map((hora) => hora.mm)),
    caido72h: sum(pasadas.slice(-HOURS_72).map((hora) => hora.mm)),
    prevista24h: sum(futuras.slice(0, HOURS_24).map((hora) => hora.mm)),
    prevista48h: sum(futuras.slice(0, HOURS_48).map((hora) => hora.mm)),
    probabilidadMax24h: Math.max(0, ...futuras.slice(0, HOURS_24).map((hora) => hora.prob)),
    porDia: dias.map((fecha) => ({
      fecha,
      caidoMm: sum(pasadas.filter((hora) => hora.hora.startsWith(fecha)).map((hora) => hora.mm)),
      previstoMm: sum(futuras.filter((hora) => hora.hora.startsWith(fecha)).map((hora) => hora.mm)),
    })),
    consultadoEn: new Date().toISOString(),
  };
}

export async function fetchMonthToDateRain(): Promise<MonthRain> {
  const hoy = localNowKey().slice(0, 10);
  const inicio = `${hoy.slice(0, 7)}-01`;
  const params = new URLSearchParams({ latitude: String(ROSARIO.lat), longitude: String(ROSARIO.lon), start_date: inicio, end_date: hoy, daily: "precipitation_sum", timezone: TIMEZONE });
  const response = await fetchWithRetry(`${ARCHIVE_URL}?${params}`, "El archivo histórico de Open-Meteo");
  const data = (await response.json()) as ArchiveResponse;
  const valores = data.daily.precipitation_sum.filter((value): value is number => value !== null);
  return { mes: hoy.slice(0, 7), acumuladoMm: sum(valores), diasConDato: valores.length, consultadoEn: new Date().toISOString() };
}
