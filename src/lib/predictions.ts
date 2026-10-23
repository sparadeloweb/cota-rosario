import models from "../../public/data/models.json";
import { loadStatus, type Status, type SourceFailure, type SourceId } from "@/lib/status";
import { empiricalRank, exceedanceProbability, returnPeriodYears, type ExtremeRainModel } from "@/lib/forecast/gumbel";
import { districtExpectations, expectedCases, splitByDay, type DistrictExpectation, type PoissonModel } from "@/lib/forecast/poisson";
import { ratingCurve, trendProjection, type RatingCurve, type TrendProjection } from "@/lib/forecast/river";
import { fetchDischarge, fetchRainOutlook, type DischargeDay, type RainOutlook } from "@/lib/rain";
import { type RiverReading } from "@/lib/river";
import { mergeRiverHistory } from "@/lib/riverHistory";

const DISCHARGE_HISTORY_DAYS = 210;
const TREND_WINDOW_DAYS = 14;
const HORIZON_DAYS = 7;
const CHART_HISTORY_DAYS = 60;
const ARGENTINA_UTC_OFFSET_HOURS = -3;
const MILLIS_PER_DAY = 86_400_000;
const REFERENCE_DAILY_THRESHOLD_MM = 30;

const poissonModel = models.flooding as PoissonModel;
const extremeModel = models.extremeRain as ExtremeRainModel;

export interface FloodingForecast {
  mode: "exploratory";
  temporalValidation: "monthly";
  windowDays: number;
  rain: { total: number; max2h: number };
  cityExpected: number;
  byDistrict: DistrictExpectation[];
  model: Pick<PoissonModel, "formula" | "pseudoR2" | "n" | "crossValidation" | "coefficients" | "usedVariables" | "candidates">;
}

export interface RainForecast {
  days: RainOutlook["days"];
  maxDay: RainOutlook["maxDay"];
  returnPeriodYears: number;
  annualProbability: number;
  historicalRank: { larger: number; total: number };
  quantiles: ExtremeRainModel["quantiles"];
  gumbel: ExtremeRainModel["gumbel"];
  period: ExtremeRainModel["period"];
  climatology: { month: number; meanMm: number; dayProbability: number; thresholdMm: number };
}

export interface RiverForecast {
  current: number;
  date: string;
  alert: number | null;
  evacuation: number | null;
  history: RiverReading[];
  seriesFrom: string;
  trend: TrendProjection | null;
  curve: RatingCurve | null;
  discharge: { current: number | null; days: DischargeDay[] } | null;
}

export interface DailyForecast {
  date: string;
  rainMm: number;
  probability: number | null;
  expectedFloods: number | null;
  probabilityAtLeastOne: number | null;
  riverMeters: number | null;
}

export interface Predictions {
  byDay: DailyForecast[];
  flooding: FloodingForecast | null;
  rain: RainForecast | null;
  river: RiverForecast | null;
  failures: SourceFailure[];
  fetches: Partial<Record<SourceId, string>>;
  validity: { modelsComputedAt: string; civilDefenseUntil: string; historicalRainUntil: number; lastRiverReading: string | null };
  generatedAt: string;
}

function failure(source: SourceId, reason: unknown): SourceFailure {
  return { source, message: reason instanceof Error ? reason.message : String(reason), at: new Date().toISOString() };
}

function currentMonthInArgentina(): number {
  return new Date(Date.now() + ARGENTINA_UTC_OFFSET_HOURS * 3_600_000).getUTCMonth() + 1;
}

function buildRain(outlook: RainOutlook): RainForecast {
  const mm = outlook.maxDay.millimeters;
  const climatology = extremeModel.monthlyClimatology.find((entry) => entry.month === currentMonthInArgentina());
  return {
    days: outlook.days,
    maxDay: outlook.maxDay,
    returnPeriodYears: Number(returnPeriodYears(extremeModel.gumbel, mm).toFixed(1)),
    annualProbability: Number(exceedanceProbability(extremeModel.gumbel, mm).toFixed(3)),
    historicalRank: empiricalRank(extremeModel, mm),
    quantiles: extremeModel.quantiles,
    gumbel: extremeModel.gumbel,
    period: extremeModel.period,
    climatology: {
      month: climatology?.month ?? 0,
      meanMm: climatology?.meanMm ?? 0,
      dayProbability: climatology?.dayProbability[String(REFERENCE_DAILY_THRESHOLD_MM)] ?? 0,
      thresholdMm: REFERENCE_DAILY_THRESHOLD_MM,
    },
  };
}

function buildFlooding(outlook: RainOutlook): FloodingForecast {
  const rain = { total: outlook.total, max2h: outlook.max2h };
  const cityExpected = expectedCases(poissonModel, rain, outlook.windowDays);
  const { formula, pseudoR2, n, crossValidation, coefficients, usedVariables, candidates } = poissonModel;
  return {
    mode: "exploratory",
    temporalValidation: "monthly",
    windowDays: outlook.windowDays,
    rain,
    cityExpected,
    byDistrict: districtExpectations(poissonModel, cityExpected),
    model: { formula, pseudoR2, n, crossValidation, coefficients, usedVariables, candidates },
  };
}

export async function loadPredictions(input?: Status | Promise<Status>): Promise<Predictions> {
  const [status, [rainResult, dischargeResult]] = await Promise.all([input ?? loadStatus(), Promise.allSettled([fetchRainOutlook(), fetchDischarge(DISCHARGE_HISTORY_DAYS)])]);
  const failures: SourceFailure[] = status.failures.filter((failure) => failure.source === "ina");
  if (rainResult.status === "rejected") {
    failures.push(failure("openMeteo", rainResult.reason));
  }
  if (dischargeResult.status === "rejected") {
    failures.push(failure("glofas", dischargeResult.reason));
  }

  const outlook = rainResult.status === "fulfilled" ? rainResult.value : null;
  const river = status.river;
  const discharge = dischargeResult.status === "fulfilled" ? dischargeResult.value : null;

  const history = river ? mergeRiverHistory(river.series) : null;
  const riverForecast: RiverForecast | null =
    river && history
      ? {
          current: river.station.meters,
          date: river.station.date,
          alert: river.station.alert,
          evacuation: river.station.evacuation,
          history: history.series.filter((reading) => Date.now() - new Date(reading.date).getTime() <= CHART_HISTORY_DAYS * MILLIS_PER_DAY),
          seriesFrom: history.from,
          trend: trendProjection(history.series, TREND_WINDOW_DAYS, HORIZON_DAYS, { alert: river.station.alert, evacuation: river.station.evacuation }),
          curve: discharge ? ratingCurve(history.series, discharge.past, discharge.days) : null,
          discharge: discharge ? { current: discharge.current, days: discharge.days } : null,
        }
      : null;

  let flooding: FloodingForecast | null = null;
  if (outlook) {
    try { flooding = buildFlooding(outlook); }
    catch (error) { failures.push(failure("models", error)); }
  }
  const casesByDay = outlook && flooding ? splitByDay(poissonModel, flooding.cityExpected, outlook.days.map((day) => ({ total: day.millimeters, max2h: day.max2h }))) : [];
  const levelByDay = new Map([
    ...(riverForecast?.history.map((reading) => [reading.date.slice(0, 10), reading.meters] as const) ?? []),
    ...(riverForecast?.trend?.projection.map((point) => [point.date, point.meters] as const) ?? []),
  ]);
  const byDay: DailyForecast[] = (outlook?.days ?? []).map((day, index) => ({
    date: day.date,
    rainMm: day.millimeters,
    probability: day.probability,
    expectedFloods: casesByDay[index] ?? null,
    probabilityAtLeastOne: null,
    riverMeters: levelByDay.get(day.date) ?? null,
  }));

  return {
    byDay,
    flooding,
    rain: outlook ? buildRain(outlook) : null,
    river: riverForecast,
    failures,
    fetches: { ina: river?.fetchedAt, openMeteo: outlook?.fetchedAt, glofas: discharge?.fetchedAt },
    validity: {
      modelsComputedAt: models.computedAt,
      civilDefenseUntil: poissonModel.training[poissonModel.training.length - 1]?.month ?? "",
      historicalRainUntil: extremeModel.period.until,
      lastRiverReading: river?.station.date ?? null,
    },
    generatedAt: new Date().toISOString(),
  };
}
