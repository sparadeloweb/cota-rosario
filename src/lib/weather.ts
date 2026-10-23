import { fetchWithRetry } from "@/lib/rain";
import { ROSARIO } from "@/lib/sources";
import { sourceTime } from "@/lib/time";
import { probability, requireRecent } from "@/lib/dataChecks";
import { FRESHNESS, readLiveSource } from "@/lib/liveSources";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEZONE = "America/Argentina/Buenos_Aires";
const PROBABILITY_HOURS = 6;

export type WeatherIcon = "sun" | "cloudy" | "overcast" | "fog" | "drizzle" | "rain" | "storm" | "hail";

export interface WeatherNow {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  wind: number;
  rainNow: number;
  rainProbability: number | null;
  windowHours: number;
  code: number;
  description: string;
  icon: WeatherIcon;
  measuredAt: string;
  fetchedAt: string;
}

interface CurrentResponse {
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    precipitation: number;
    weather_code: number;
  };
  hourly: { time: string[]; precipitation_probability: number[] };
}

const WMO: { codes: number[]; description: string; icon: WeatherIcon }[] = [
  { codes: [0], description: "Despejado", icon: "sun" },
  { codes: [1, 2], description: "Parcialmente nublado", icon: "cloudy" },
  { codes: [3], description: "Nublado", icon: "overcast" },
  { codes: [45, 48], description: "Niebla", icon: "fog" },
  { codes: [51, 53, 55, 56, 57], description: "Llovizna", icon: "drizzle" },
  { codes: [61, 63, 80, 81], description: "Lluvia", icon: "rain" },
  { codes: [65, 82], description: "Lluvia intensa", icon: "rain" },
  { codes: [66, 67, 71, 73, 75, 77, 85, 86], description: "Precipitación helada", icon: "hail" },
  { codes: [95], description: "Tormenta", icon: "storm" },
  { codes: [96, 99], description: "Tormenta con granizo", icon: "hail" },
];

function describe(code: number): { description: string; icon: WeatherIcon } {
  const match = WMO.find((entry) => entry.codes.includes(code));
  return match ? { description: match.description, icon: match.icon } : { description: "Sin descripción", icon: "cloudy" };
}

export async function fetchWeather(): Promise<WeatherNow> {
  return readLiveSource("openMeteo:weather", FRESHNESS.weather, fetchWeatherUncached);
}

async function fetchWeatherUncached(): Promise<WeatherNow> {
  const params = new URLSearchParams({
    latitude: String(ROSARIO.lat),
    longitude: String(ROSARIO.lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code",
    hourly: "precipitation_probability",
    forecast_days: "2",
    timezone: TIMEZONE,
  });
  const response = await fetchWithRetry(`${FORECAST_URL}?${params}`, "Open-Meteo");
  const data = (await response.json()) as CurrentResponse;
  const measuredAt = sourceTime(data.current.time, data.utc_offset_seconds);
  requireRecent(measuredAt, 2 * 3_600_000, "Clima de Open-Meteo");
  const now = Date.parse(measuredAt);
  for (const value of [data.current.temperature_2m, data.current.apparent_temperature, data.current.relative_humidity_2m, data.current.surface_pressure, data.current.wind_speed_10m, data.current.weather_code, data.current.precipitation]) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("El clima actual tiene datos faltantes.");
  }
  const upcoming = data.hourly.time
    .map((hour, index) => ({ t: Date.parse(sourceTime(hour, data.utc_offset_seconds)), p: probability(data.hourly.precipitation_probability[index]) }))
    .filter((entry) => entry.t >= now - 3_600_000)
    .slice(0, PROBABILITY_HOURS);
  const { description, icon } = describe(data.current.weather_code);
  return {
    temperature: Math.round(data.current.temperature_2m),
    feelsLike: Math.round(data.current.apparent_temperature),
    humidity: Math.round(data.current.relative_humidity_2m),
    pressure: Math.round(data.current.surface_pressure),
    wind: Math.round(data.current.wind_speed_10m),
    rainNow: data.current.precipitation,
    rainProbability: upcoming.length === PROBABILITY_HOURS && upcoming.every((entry) => entry.p !== null) ? Math.max(...upcoming.map((entry) => entry.p!)) : null,
    windowHours: PROBABILITY_HOURS,
    code: data.current.weather_code,
    description,
    icon,
    measuredAt,
    fetchedAt: new Date().toISOString(),
  };
}
