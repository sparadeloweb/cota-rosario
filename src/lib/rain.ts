import { PARANA_GLOFAS_CELL, ROSARIO } from "@/lib/sources";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood";
const TIMEZONE = "America/Argentina/Buenos_Aires";
const FORECAST_DAYS = 3;
const OUTLOOK_DAYS = 7;
const DISCHARGE_FORECAST_DAYS = 7;
const WINDOW_HOURS = 2;
const REVALIDATE_SECONDS = 300;

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

  const response = await fetch(`${FORECAST_URL}?${params}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) {
    throw new Error(`Open-Meteo respondió ${response.status}`);
  }

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

  const response = await fetch(`${FLOOD_URL}?${params}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) {
    throw new Error(`La API de inundaciones respondió ${response.status}`);
  }

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

  const response = await fetch(`${FORECAST_URL}?${params}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) {
    throw new Error(`Open-Meteo respondió ${response.status}`);
  }

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
