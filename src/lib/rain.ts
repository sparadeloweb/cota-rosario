import { PARANA_GLOFAS_CELL, ROSARIO } from "@/lib/sources";
import { addCalendarDays, argentinaDay, sourceTime } from "@/lib/time";
import { nonNegative, probability } from "@/lib/dataChecks";
import { FRESHNESS, readLiveSource } from "@/lib/liveSources";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const TIMEZONE = "America/Argentina/Buenos_Aires";
const HOUR_MS = 3_600_000;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

export async function fetchWithRetry(url: string, label: string): Promise<Response> {
  const attempt = () => fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  const first = await attempt().catch(() => null);
  if (first && !RETRY_STATUSES.has(first.status)) {
    if (!first.ok) throw new Error(`${label} respondió ${first.status}`);
    return first;
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  const second = await attempt();
  if (!second.ok) throw new Error(`${label} respondió ${second.status} después del reintento`);
  return second;
}

export interface RainHour { hour: string; millimeters: number; probability: number | null }
export interface RainSnapshot {
  hours: RainHour[];
  accumulated24h: number;
  peakWindow: { millimeters: number; from: string; until: string } | null;
  fetchedAt: string;
}
export interface DischargeDay { date: string; discharge: number }
export interface DischargeSnapshot {
  cell: { lat: number; lon: number };
  days: DischargeDay[];
  past: DischargeDay[];
  current: number | null;
  fetchedAt: string;
}
export interface RainOutlookDay { date: string; millimeters: number; probability: number | null; max2h: number }
export interface RainOutlook {
  windowDays: number;
  days: RainOutlookDay[];
  total: number;
  max2h: number;
  maxDay: RainOutlookDay;
  fetchedAt: string;
}
export interface ForecastResponse {
  utc_offset_seconds: number;
  hourly: { time: string[]; precipitation: (number | null)[]; precipitation_probability?: (number | null)[] };
  daily?: { time: string[]; precipitation_sum: (number | null)[]; precipitation_probability_max?: (number | null)[] };
}
interface FloodResponse { latitude: number; longitude: number; daily: { time: string[]; river_discharge: (number | null)[] } }

function peakWindow(hours: RainHour[]): RainSnapshot["peakWindow"] {
  let best: RainSnapshot["peakWindow"] = null;
  for (let i = 0; i + 1 < hours.length; i++) {
    if (Date.parse(hours[i + 1].hour) - Date.parse(hours[i].hour) !== HOUR_MS) throw new Error("El pronóstico tiene horas faltantes.");
    const mm = hours[i].millimeters + hours[i + 1].millimeters;
    if (!Number.isFinite(mm)) throw new Error("El pico de lluvia está fuera del rango numérico.");
    if (!best || mm > best.millimeters) best = { millimeters: Number(mm.toFixed(1)), from: hours[i].hour, until: hours[i + 1].hour };
  }
  return best;
}

function indexedHours(data: ForecastResponse): { hour: string; index: number }[] {
  if (!Array.isArray(data.hourly?.time) || !Array.isArray(data.hourly.precipitation)) throw new Error("La fuente no devolvió una serie horaria válida.");
  return data.hourly.time.map((hour, index) => ({ hour: sourceTime(hour, data.utc_offset_seconds), index }));
}

export function rainFromResponse(data: ForecastResponse, now = Date.now()): RainSnapshot {
  const wanted = indexedHours(data).filter(({ hour }) => Date.parse(hour) >= now - HOUR_MS).slice(0, 48);
  if (wanted.length !== 48 || Date.parse(wanted[0].hour) > now + HOUR_MS) throw new Error("El pronóstico no cubre las próximas 48 horas desde ahora.");
  const hours = wanted.map(({ hour, index }) => ({ hour, millimeters: nonNegative(data.hourly.precipitation[index], "Lluvia horaria"), probability: probability(data.hourly.precipitation_probability?.[index]) }));
  return { hours, accumulated24h: sum(hours.slice(0, 24).map((hour) => hour.millimeters)), peakWindow: peakWindow(hours), fetchedAt: new Date(now).toISOString() };
}

export async function fetchRain(): Promise<RainSnapshot> {
  return readLiveSource("rain:48h", FRESHNESS.hourlyRain, fetchRainUncached);
}

async function fetchRainUncached(): Promise<RainSnapshot> {
  const params = forecastParams({ hourly: "precipitation,precipitation_probability", forecast_days: "3" });
  return rainFromResponse(await (await fetchWithRetry(`${FORECAST_URL}?${params}`, "Open-Meteo")).json());
}

export async function fetchDischarge(pastDays = 0): Promise<DischargeSnapshot> {
  return readLiveSource(`glofas:${pastDays}`, FRESHNESS.discharge, () => fetchDischargeUncached(pastDays));
}

async function fetchDischargeUncached(pastDays: number): Promise<DischargeSnapshot> {
  const params = new URLSearchParams({ latitude: String(PARANA_GLOFAS_CELL.lat), longitude: String(PARANA_GLOFAS_CELL.lon), daily: "river_discharge", forecast_days: "7", past_days: String(Math.max(1, pastDays)) });
  const data = (await (await fetchWithRetry(`${FLOOD_URL}?${params}`, "GloFAS")).json()) as FloodResponse;
  if (!Array.isArray(data.daily?.time) || !Array.isArray(data.daily.river_discharge)) throw new Error("GloFAS no devolvió una serie diaria válida.");
  const today = argentinaDay();
  const pairs = data.daily.time.map((date, index) => ({ date, value: data.daily.river_discharge[index] }));
  const wanted = pairs.filter((day) => day.date >= today).slice(0, 7);
  if (wanted.length !== 7 || wanted.some((day, i) => day.date !== addCalendarDays(today, i))) throw new Error("El caudal no cubre los próximos siete días.");
  const days = wanted.map(({ date, value }) => ({ date, discharge: nonNegative(value, "Caudal pronosticado") }));
  const past = pairs.filter((day) => day.date < today && typeof day.value === "number" && Number.isFinite(day.value) && day.value >= 0).map(({ date, value }) => ({ date, discharge: value as number }));
  return { cell: { lat: data.latitude, lon: data.longitude }, days, past, current: days[0].discharge, fetchedAt: new Date().toISOString() };
}

export function outlookFromResponse(data: ForecastResponse, now = Date.now()): RainOutlook {
  const today = argentinaDay(now);
  if (!Array.isArray(data.daily?.time) || !Array.isArray(data.daily.precipitation_sum)) throw new Error("La fuente no devolvió días de pronóstico.");
  const daily = data.daily;
  const wanted = daily.time.map((date, index) => ({ date, index })).filter((day) => day.date >= today).slice(0, 7);
  if (wanted.length !== 7 || wanted.some((day, i) => day.date !== addCalendarDays(today, i))) throw new Error("El pronóstico no cubre los próximos siete días desde hoy.");
  const hourly = indexedHours(data).filter(({ hour }) => hour.slice(0, 10) >= today && hour.slice(0, 10) <= wanted[6].date).map(({ hour, index }) => ({ hour, millimeters: nonNegative(data.hourly.precipitation[index], "Lluvia horaria de la semana"), probability: null }));
  if (hourly.length !== 7 * 24) throw new Error("La semana tiene horas de lluvia faltantes.");
  const max2hByDay = new Map<string, number>();
  for (let i = 0; i + 1 < hourly.length; i++) {
    if (Date.parse(hourly[i + 1].hour) - Date.parse(hourly[i].hour) !== HOUR_MS) throw new Error("La semana tiene horas discontinuas.");
    const day = hourly[i].hour.slice(0, 10);
    const mm = hourly[i].millimeters + hourly[i + 1].millimeters;
    if (!Number.isFinite(mm)) throw new Error("El pico semanal está fuera del rango numérico.");
    max2hByDay.set(day, Math.max(max2hByDay.get(day) ?? 0, mm));
  }
  const days = wanted.map(({ date, index }) => ({ date, millimeters: Number(nonNegative(daily.precipitation_sum[index], "Lluvia diaria").toFixed(1)), probability: probability(daily.precipitation_probability_max?.[index]), max2h: Number((max2hByDay.get(date) ?? 0).toFixed(1)) }));
  return { windowDays: 7, days, total: sum(days.map((day) => day.millimeters)), max2h: Number(Math.max(...days.map((day) => day.max2h)).toFixed(1)), maxDay: days.reduce((best, day) => day.millimeters > best.millimeters ? day : best), fetchedAt: new Date(now).toISOString() };
}

export async function fetchRainOutlook(): Promise<RainOutlook> {
  return readLiveSource("rain:7d", FRESHNESS.hourlyRain, fetchRainOutlookUncached);
}

async function fetchRainOutlookUncached(): Promise<RainOutlook> {
  const params = forecastParams({ hourly: "precipitation", daily: "precipitation_sum,precipitation_probability_max", forecast_days: "7" });
  return outlookFromResponse(await (await fetchWithRetry(`${FORECAST_URL}?${params}`, "Open-Meteo")).json());
}

function forecastParams(extra: Record<string, string>): URLSearchParams {
  return new URLSearchParams({ latitude: String(ROSARIO.lat), longitude: String(ROSARIO.lon), timezone: TIMEZONE, ...extra });
}
function sum(values: number[]): number {
  const total = values.reduce((acc, value) => acc + value, 0);
  if (!Number.isFinite(total)) throw new Error("La suma de lluvia está fuera del rango numérico.");
  return Number(total.toFixed(1));
}

export interface RainBalance {
  localNow: string;
  fallen24h: number;
  fallen72h: number;
  expected24h: number;
  expected48h: number;
  maxProbability24h: number | null;
  byDay: { date: string; fallenMm: number; expectedMm: number }[];
  fetchedAt: string;
}
export interface MonthRain { month: string; accumulatedMm: number; daysWithData: number; until: string | null; complete: boolean; fetchedAt: string }

export async function fetchRainBalance(): Promise<RainBalance> {
  return readLiveSource("rain:balance", FRESHNESS.hourlyRain, fetchRainBalanceUncached);
}

async function fetchRainBalanceUncached(): Promise<RainBalance> {
  const params = forecastParams({ hourly: "precipitation,precipitation_probability", past_days: "3", forecast_days: "3" });
  const data = (await (await fetchWithRetry(`${FORECAST_URL}?${params}`, "Open-Meteo")).json()) as ForecastResponse;
  const now = Date.now();
  const boundary = Math.floor(now / HOUR_MS) * HOUR_MS;
  const all = indexedHours(data);
  const past = all.filter(({ hour }) => Date.parse(hour) < boundary).slice(-72);
  const future = all.filter(({ hour }) => Date.parse(hour) >= boundary).slice(0, 48);
  if (past.length !== 72 || future.length !== 48) throw new Error("La serie no cubre 72 horas pasadas y 48 futuras.");
  const rows = [...past, ...future].map(({ hour, index }) => ({ hour, mm: nonNegative(data.hourly.precipitation[index], "Lluvia del balance"), prob: probability(data.hourly.precipitation_probability?.[index]) }));
  peakWindow(rows.map((row) => ({ hour: row.hour, millimeters: row.mm, probability: row.prob })));
  const pastRows = rows.slice(0, 72);
  const futureRows = rows.slice(72);
  const probs = futureRows.slice(0, 24).map((hour) => hour.prob);
  const days = [...new Set(rows.map((hour) => hour.hour.slice(0, 10)))];
  return { localNow: futureRows[0].hour.slice(0, 13), fallen24h: sum(pastRows.slice(-24).map((hour) => hour.mm)), fallen72h: sum(pastRows.map((hour) => hour.mm)), expected24h: sum(futureRows.slice(0, 24).map((hour) => hour.mm)), expected48h: sum(futureRows.map((hour) => hour.mm)), maxProbability24h: probs.every((p) => p !== null) ? Math.max(...probs as number[]) : null, byDay: days.map((date) => ({ date, fallenMm: sum(pastRows.filter((hour) => hour.hour.startsWith(date)).map((hour) => hour.mm)), expectedMm: sum(futureRows.filter((hour) => hour.hour.startsWith(date)).map((hour) => hour.mm)) })), fetchedAt: new Date(now).toISOString() };
}

export async function fetchMonthToDateRain(): Promise<MonthRain> {
  return readLiveSource("rain:month", FRESHNESS.hourlyRain, fetchMonthToDateRainUncached);
}

async function fetchMonthToDateRainUncached(): Promise<MonthRain> {
  const today = argentinaDay();
  const params = forecastParams({ start_date: `${today.slice(0, 7)}-01`, end_date: today, daily: "precipitation_sum" });
  const data = await (await fetchWithRetry(`${ARCHIVE_URL}?${params}`, "Archivo de Open-Meteo")).json() as { daily: { time: string[]; precipitation_sum: (number | null)[] } };
  if (!Array.isArray(data.daily?.time) || !Array.isArray(data.daily.precipitation_sum)) throw new Error("El archivo no devolvió días del mes.");
  const rows = data.daily.time.map((date, i) => ({ date, mm: data.daily.precipitation_sum[i] })).filter((row) => row.date.slice(0, 7) === today.slice(0, 7) && row.date <= today && typeof row.mm === "number" && Number.isFinite(row.mm) && row.mm >= 0);
  if (rows.length === 0) throw new Error("No hay lluvia del mes disponible en el archivo.");
  return { month: today.slice(0, 7), accumulatedMm: sum(rows.map((row) => row.mm as number)), daysWithData: rows.length, until: rows.at(-1)?.date ?? null, complete: rows.length === Number(today.slice(-2)), fetchedAt: new Date().toISOString() };
}
