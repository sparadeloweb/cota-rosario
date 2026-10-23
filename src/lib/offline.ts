import { argentinaDateTime, argentinaTime } from "@/lib/time";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const JUST_NOW_MS = 2 * MINUTE_MS;

export const NO_READING = "sin lectura";
export const FROM_CACHE_FLAG = "__cotaFromCache";

export function describeAge(iso: string | undefined, now: number): string {
  const instant = iso ? Date.parse(iso) : Number.NaN;
  if (!Number.isFinite(instant) || instant > now + MINUTE_MS) {
    return NO_READING;
  }
  const age = now - instant;
  if (age < JUST_NOW_MS) {
    return "hace instantes";
  }
  if (age < HOUR_MS) {
    return `hace ${Math.floor(age / MINUTE_MS)} min`;
  }
  if (age < DAY_MS) {
    return `hace ${Math.floor(age / HOUR_MS)} h`;
  }
  return `del ${argentinaDateTime(iso!)}`;
}

export function offlineNotice(iso: string | undefined, now: number): string {
  const age = describeAge(iso, now);
  if (age === NO_READING) {
    return "Sin conexión · no hay una lectura guardada";
  }
  const hour = Date.parse(iso!) > now - DAY_MS ? ` (${argentinaTime(iso!)})` : "";
  return `Sin conexión · mostrando la última lectura, ${age}${hour}. No es el estado actual.`;
}

export function cachedCopyNotice(iso: string | undefined, now: number, online: boolean): string {
  const cause = online ? "No pudimos actualizar con el servidor" : "Sin conexión";
  const age = describeAge(iso, now);
  if (age === NO_READING) {
    return `${cause} · esta pantalla es una copia guardada sin hora de lectura. No es el estado actual.`;
  }
  const hour = Date.parse(iso!) > now - DAY_MS ? ` (${argentinaTime(iso!)})` : "";
  return `${cause} · mostrando la copia guardada de esta pantalla, ${age}${hour}. No es el estado actual.`;
}
