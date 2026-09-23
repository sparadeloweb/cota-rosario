import type { RiverReading } from "@/lib/river";

export interface ProjectedLevel {
  fecha: string;
  metros: number;
  inferior: number;
  superior: number;
}

export interface TrendProjection {
  ventanaDias: number;
  metrosPorDia: number;
  sigmaMetros: number;
  proyeccion: ProjectedLevel[];
  diasHasta: Record<string, number | null>;
}

export interface RatingCurve {
  a: number;
  b: number;
  r2: number;
  sigmaMetros: number;
  n: number;
  desfaseDias: number;
  proyeccion: ProjectedLevel[];
}

interface DischargeDay {
  fecha: string;
  caudal: number;
}

const MILLIS_PER_DAY = 86_400_000;
const BAND_SIGMAS = 2;
const MIN_POINTS = 5;
const MAX_LAG_DAYS = 10;

function ols(xs: number[], ys: number[]): { slope: number; intercept: number; sigma: number; r2: number } {
  const n = xs.length;
  const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n;
  const sxx = xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  const sxy = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = meanY - slope * meanX;
  const residuals = ys.map((value, index) => value - (intercept + slope * xs[index]));
  const sse = residuals.reduce((sum, value) => sum + value ** 2, 0);
  const sst = ys.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  return { slope, intercept, sigma: Math.sqrt(sse / Math.max(1, n - 2)), r2: sst === 0 ? 0 : 1 - sse / sst };
}

function addDays(fecha: string, days: number): string {
  return new Date(new Date(fecha).getTime() + days * MILLIS_PER_DAY).toISOString().slice(0, 10);
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

export function trendProjection(serie: RiverReading[], ventanaDias: number, horizonteDias: number, umbrales: Record<string, number | null>): TrendProjection | null {
  const ultimo = serie[serie.length - 1];
  if (!ultimo) {
    return null;
  }
  const desde = new Date(ultimo.fecha).getTime() - ventanaDias * MILLIS_PER_DAY;
  const ventana = serie.filter((reading) => new Date(reading.fecha).getTime() >= desde);
  if (ventana.length < MIN_POINTS) {
    return null;
  }
  const xs = ventana.map((reading) => (new Date(reading.fecha).getTime() - desde) / MILLIS_PER_DAY);
  const { slope, sigma } = ols(xs, ventana.map((reading) => reading.metros));
  const proyeccion = Array.from({ length: horizonteDias }, (_, index) => {
    const dias = index + 1;
    const metros = ultimo.metros + slope * dias;
    const banda = BAND_SIGMAS * sigma * Math.sqrt(1 + dias / ventanaDias);
    return { fecha: addDays(ultimo.fecha, dias), metros: round(metros), inferior: round(metros - banda), superior: round(metros + banda) };
  });
  const diasHasta = Object.fromEntries(
    Object.entries(umbrales).map(([nombre, umbral]) => {
      if (umbral === null || slope <= 0 || umbral <= ultimo.metros) {
        return [nombre, null];
      }
      return [nombre, Math.round((umbral - ultimo.metros) / slope)];
    }),
  );
  return { ventanaDias, metrosPorDia: Number(slope.toFixed(3)), sigmaMetros: round(sigma), proyeccion, diasHasta };
}

function fitLaggedCurve(serie: RiverReading[], caudalPorDia: Map<string, number>, lag: number) {
  const pares = serie.flatMap((reading) => {
    const caudal = caudalPorDia.get(addDays(reading.fecha, -lag));
    return caudal && caudal > 0 ? [{ x: Math.log(caudal), y: reading.metros }] : [];
  });
  if (pares.length < MIN_POINTS) {
    return null;
  }
  return { lag, n: pares.length, ...ols(pares.map((par) => par.x), pares.map((par) => par.y)) };
}

export function ratingCurve(serie: RiverReading[], caudalPasado: DischargeDay[], caudalFuturo: DischargeDay[]): RatingCurve | null {
  const caudalPorDia = new Map([...caudalPasado, ...caudalFuturo].map((dia) => [dia.fecha, dia.caudal]));
  const mejor = Array.from({ length: MAX_LAG_DAYS + 1 }, (_, lag) => fitLaggedCurve(serie, caudalPorDia, lag))
    .filter((fit): fit is NonNullable<typeof fit> => fit !== null)
    .reduce<ReturnType<typeof fitLaggedCurve>>((best, fit) => (best === null || fit.r2 > best.r2 ? fit : best), null);
  if (!mejor) {
    return null;
  }
  const { slope, intercept, sigma, r2, lag, n } = mejor;
  const proyeccion = caudalFuturo.flatMap((dia) => {
    const caudal = caudalPorDia.get(addDays(dia.fecha, -lag));
    if (!caudal || caudal <= 0) {
      return [];
    }
    const metros = intercept + slope * Math.log(caudal);
    return [{ fecha: dia.fecha, metros: round(metros), inferior: round(metros - BAND_SIGMAS * sigma), superior: round(metros + BAND_SIGMAS * sigma) }];
  });
  return { a: Number(intercept.toFixed(3)), b: Number(slope.toFixed(3)), r2: Number(r2.toFixed(3)), sigmaMetros: round(sigma), n, desfaseDias: lag, proyeccion };
}
