import { PARANA_GLOFAS_CELL, ROSARIO } from "@/lib/sources";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood";
const TIMEZONE = "America/Argentina/Buenos_Aires";
const FORECAST_DAYS = 3;
const WINDOW_HOURS = 2;
const REVALIDATE_SECONDS = 900;

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

export interface DischargeSnapshot {
  celda: { lat: number; lon: number };
  dias: { fecha: string; caudal: number }[];
  actual: number | null;
  consultadoEn: string;
}

interface ForecastResponse {
  hourly: { time: string[]; precipitation: number[]; precipitation_probability: number[] };
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

export async function fetchDischarge(): Promise<DischargeSnapshot> {
  const params = new URLSearchParams({
    latitude: String(PARANA_GLOFAS_CELL.lat),
    longitude: String(PARANA_GLOFAS_CELL.lon),
    daily: "river_discharge",
    forecast_days: "7",
  });

  const response = await fetch(`${FLOOD_URL}?${params}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) {
    throw new Error(`La API de inundaciones respondió ${response.status}`);
  }

  const data = (await response.json()) as FloodResponse;
  const dias = data.daily.time.map((fecha, index) => ({ fecha, caudal: data.daily.river_discharge[index] ?? 0 }));

  return {
    celda: { lat: data.latitude, lon: data.longitude },
    dias,
    actual: dias[0]?.caudal ?? null,
    consultadoEn: new Date().toISOString(),
  };
}
