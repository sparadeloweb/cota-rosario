import { fechaHoraArgentina, horaArgentina } from "@/lib/time";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const JUST_NOW_MS = 2 * MINUTE_MS;

export const SIN_LECTURA = "sin lectura";

export function antiguedad(iso: string | undefined, ahora: number): string {
  const instante = iso ? Date.parse(iso) : Number.NaN;
  if (!Number.isFinite(instante) || instante > ahora + MINUTE_MS) {
    return SIN_LECTURA;
  }
  const edad = ahora - instante;
  if (edad < JUST_NOW_MS) {
    return "hace instantes";
  }
  if (edad < HOUR_MS) {
    return `hace ${Math.floor(edad / MINUTE_MS)} min`;
  }
  if (edad < DAY_MS) {
    return `hace ${Math.floor(edad / HOUR_MS)} h`;
  }
  return `del ${fechaHoraArgentina(iso!)}`;
}

export function avisoSinConexion(iso: string | undefined, ahora: number): string {
  const edad = antiguedad(iso, ahora);
  if (edad === SIN_LECTURA) {
    return "Sin conexión · no hay una lectura guardada";
  }
  const hora = Date.parse(iso!) > ahora - DAY_MS ? ` (${horaArgentina(iso!)})` : "";
  return `Sin conexión · mostrando la última lectura, ${edad}${hora}. No es el estado actual.`;
}
