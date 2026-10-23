import type { RiverReading } from "@/lib/river";

export interface ProjectedLevel {
  date: string;
  meters: number;
  lower: number;
  upper: number;
}

export interface TrendProjection {
  windowDays: number;
  metersPerDay: number;
  sigmaMeters: number;
  projection: ProjectedLevel[];
  daysUntil: Record<string, number | null>;
}

export interface RatingCurve {
  a: number;
  b: number;
  r2: number;
  sigmaMeters: number;
  n: number;
  lagDays: number;
  projection: ProjectedLevel[];
}

interface DischargeDay {
  date: string;
  discharge: number;
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

function addDays(date: string, days: number): string {
  return new Date(new Date(date).getTime() + days * MILLIS_PER_DAY).toISOString().slice(0, 10);
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

export function trendProjection(series: RiverReading[], windowDays: number, horizonDays: number, thresholds: Record<string, number | null>): TrendProjection | null {
  const last = series[series.length - 1];
  if (!last) {
    return null;
  }
  const from = new Date(last.date).getTime() - windowDays * MILLIS_PER_DAY;
  const trendWindow = series.filter((reading) => new Date(reading.date).getTime() >= from);
  if (trendWindow.length < MIN_POINTS) {
    return null;
  }
  const xs = trendWindow.map((reading) => (new Date(reading.date).getTime() - from) / MILLIS_PER_DAY);
  const { slope, sigma } = ols(xs, trendWindow.map((reading) => reading.meters));
  const projection = Array.from({ length: horizonDays }, (_, index) => {
    const days = index + 1;
    const meters = last.meters + slope * days;
    const band = BAND_SIGMAS * sigma * Math.sqrt(1 + days / windowDays);
    return { date: addDays(last.date, days), meters: round(meters), lower: round(meters - band), upper: round(meters + band) };
  });
  const daysUntil = Object.fromEntries(
    Object.entries(thresholds).map(([name, threshold]) => {
      if (threshold === null || slope <= 0 || threshold <= last.meters) {
        return [name, null];
      }
      return [name, Math.round((threshold - last.meters) / slope)];
    }),
  );
  return { windowDays, metersPerDay: Number(slope.toFixed(3)), sigmaMeters: round(sigma), projection, daysUntil };
}

function fitLaggedCurve(series: RiverReading[], dischargeByDay: Map<string, number>, lag: number) {
  const pairs = series.flatMap((reading) => {
    const discharge = dischargeByDay.get(addDays(reading.date, -lag));
    return discharge && discharge > 0 ? [{ x: Math.log(discharge), y: reading.meters }] : [];
  });
  if (pairs.length < MIN_POINTS) {
    return null;
  }
  return { lag, n: pairs.length, ...ols(pairs.map((pair) => pair.x), pairs.map((pair) => pair.y)) };
}

export function ratingCurve(series: RiverReading[], pastDischarge: DischargeDay[], futureDischarge: DischargeDay[]): RatingCurve | null {
  const dischargeByDay = new Map([...pastDischarge, ...futureDischarge].map((day) => [day.date, day.discharge]));
  const best = Array.from({ length: MAX_LAG_DAYS + 1 }, (_, lag) => fitLaggedCurve(series, dischargeByDay, lag))
    .filter((fit): fit is NonNullable<typeof fit> => fit !== null)
    .reduce<ReturnType<typeof fitLaggedCurve>>((best, fit) => (best === null || fit.r2 > best.r2 ? fit : best), null);
  if (!best) {
    return null;
  }
  const { slope, intercept, sigma, r2, lag, n } = best;
  const projection = futureDischarge.flatMap((day) => {
    const discharge = dischargeByDay.get(addDays(day.date, -lag));
    if (!discharge || discharge <= 0) {
      return [];
    }
    const meters = intercept + slope * Math.log(discharge);
    return [{ date: day.date, meters: round(meters), lower: round(meters - BAND_SIGMAS * sigma), upper: round(meters + BAND_SIGMAS * sigma) }];
  });
  return { a: Number(intercept.toFixed(3)), b: Number(slope.toFixed(3)), r2: Number(r2.toFixed(3)), sigmaMeters: round(sigma), n, lagDays: lag, projection };
}
