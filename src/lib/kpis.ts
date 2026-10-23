import distritosGeo from "../../public/data/districts.json";
import models from "../../public/data/models.json";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { SourceFailure, SourceId } from "@/lib/status";
import { loadStatus, type Status } from "@/lib/status";
import { trendProjection } from "@/lib/forecast/river";
import { featureAt } from "@/lib/lookup";
import { fetchMonthToDateRain, fetchRainBalance, type MonthRain, type RainBalance } from "@/lib/rain";
import { listReports } from "@/lib/reports";
import { REPORT_TYPES, type Report, type ReportType } from "@/lib/reportTypes";
import { hasUsableThresholds } from "@/lib/risk";
import { type RiverReading, type RiverSnapshot, type RiverStation } from "@/lib/river";
import { mergeRiverHistory } from "@/lib/riverHistory";

const UPSTREAM_CHAIN = ["Corrientes", "Goya", "La Paz", "Santa Fe", "Paraná", "Diamante", "San Lorenzo (San Martín)", "Rosario", "Villa Constitución", "San Nicolás"];
const MILLIS_PER_DAY = 86_400_000;
const SPARKLINE_DAYS = 60;
const TREND_WINDOW_DAYS = 14;
const HORIZON_DAYS = 7;
const RECENT_REPORT_HOURS = 6;
const PERCENT = 100;
const CM_PER_M = 100;

export interface RiverKpis {
  current: number;
  date: string;
  change24hCm: number | null;
  change7dCm: number | null;
  alertMarginM: number | null;
  daysToAlert: number | null;
  rateCmPerDay: number | null;
  percentile210: number;
  max210: RiverReading;
  min210: RiverReading;
  sparkline: RiverReading[];
}

export interface UpstreamStation {
  name: string;
  river: string;
  meters: number;
  alert: number | null;
  evacuation: number | null;
  trend: string;
  alertMarginM: number | null;
  date: string;
  isRosario: boolean;
  isUpstream: boolean;
}

export interface NetworkKpis {
  total: number;
  withThreshold: number;
  overAlert: number;
  overEvacuation: number;
  rising: number;
  inAlert: RiverStation[];
}

export interface RainKpis {
  balance: RainBalance;
  month: MonthRain | null;
  monthNormalMm: number | null;
}

export interface ReportKpis {
  active: number;
  last6h: number;
  confirmations: number;
  byType: { type: ReportType; label: string; color: string; count: number }[];
  byDistrict: { district: string; count: number }[];
}

export interface Kpis {
  river: RiverKpis | null;
  upstream: UpstreamStation[];
  network: NetworkKpis | null;
  rain: RainKpis | null;
  reports: ReportKpis | null;
  failures: SourceFailure[];
  generatedAt: string;
}

type Districts = FeatureCollection<Polygon | MultiPolygon, Record<string, string>>;

const districts = distritosGeo as Districts;

function failure(source: SourceId, reason: unknown): SourceFailure {
  return { source, message: reason instanceof Error ? reason.message : String(reason), at: new Date().toISOString() };
}

function readingDaysBefore(series: RiverReading[], last: RiverReading, days: number): RiverReading | undefined {
  const target = new Date(last.date).getTime() - days * MILLIS_PER_DAY;
  return series
    .filter((reading) => new Date(reading.date).getTime() <= target)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function deltaCm(last: RiverReading, previous: RiverReading | undefined): number | null {
  return previous ? Math.round((last.meters - previous.meters) * CM_PER_M) : null;
}

function buildRiver(river: RiverSnapshot): RiverKpis | null {
  const history = mergeRiverHistory(river.series).series;
  const last = history[history.length - 1];
  if (!last) {
    return null;
  }
  const sorted = [...history].sort((a, b) => a.meters - b.meters);
  const below = sorted.filter((reading) => reading.meters < last.meters).length;
  const trend = trendProjection(history, TREND_WINDOW_DAYS, HORIZON_DAYS, { alert: river.station.alert });
  return {
    current: last.meters,
    date: last.date,
    change24hCm: deltaCm(last, readingDaysBefore(history, last, 1)),
    change7dCm: deltaCm(last, readingDaysBefore(history, last, 7)),
    alertMarginM: river.station.alert === null ? null : Number((river.station.alert - last.meters).toFixed(2)),
    daysToAlert: trend?.daysUntil.alert ?? null,
    rateCmPerDay: trend ? Number((trend.metersPerDay * CM_PER_M).toFixed(1)) : null,
    percentile210: Math.round((below / history.length) * PERCENT),
    max210: sorted[sorted.length - 1],
    min210: sorted[0],
    sparkline: history.filter((reading) => Date.now() - new Date(reading.date).getTime() <= SPARKLINE_DAYS * MILLIS_PER_DAY),
  };
}

function fresh(date: string): boolean {
  const age = Date.now() - Date.parse(date);
  return Number.isFinite(age) && age >= -900_000 && age <= 48 * 3_600_000;
}

function buildUpstream(network: RiverStation[]): UpstreamStation[] {
  return UPSTREAM_CHAIN.flatMap((name) => {
    const station = network.find((entry) => entry.name === name && fresh(entry.date));
    if (!station) {
      return [];
    }
    const usable = hasUsableThresholds(station);
    return [
      {
        name: station.name,
        river: station.river,
        meters: station.meters,
        alert: usable ? station.alert : null,
        evacuation: usable ? station.evacuation : null,
        trend: station.trend,
        alertMarginM: usable && station.alert ? Number((station.alert - station.meters).toFixed(2)) : null,
        date: station.date,
        isRosario: station.name === "Rosario",
        isUpstream: UPSTREAM_CHAIN.indexOf(name) < UPSTREAM_CHAIN.indexOf("Rosario"),
      },
    ];
  });
}

function buildNetwork(network: RiverStation[]): NetworkKpis {
  const withThreshold = network.filter((station) => fresh(station.date) && hasUsableThresholds(station));
  const inAlert = withThreshold.filter((station) => station.alert !== null && station.meters >= station.alert);
  return {
    total: network.length,
    withThreshold: withThreshold.length,
    overAlert: inAlert.length,
    overEvacuation: withThreshold.filter((station) => station.evacuation !== null && station.evacuation > 0 && station.meters >= station.evacuation).length,
    rising: withThreshold.filter((station) => station.trend.toLowerCase() === "crece").length,
    inAlert: inAlert.sort((a, b) => (a.alert! - a.meters) - (b.alert! - b.meters)),
  };
}

function buildReports(reports: Report[]): ReportKpis {
  const cutoff = Date.now() - RECENT_REPORT_HOURS * 3_600_000;
  const countByDistrict = reports.reduce<Record<string, number>>((acc, report) => {
    const district = featureAt(districts, report.lat, report.lon)?.properties.district ?? "fuera de la ciudad";
    return { ...acc, [district]: (acc[district] ?? 0) + 1 };
  }, {});
  return {
    active: reports.length,
    last6h: reports.filter((report) => new Date(report.createdAt).getTime() >= cutoff).length,
    confirmations: reports.reduce((total, report) => total + report.confirmations, 0),
    byType: (Object.keys(REPORT_TYPES) as ReportType[]).map((type) => ({
      type,
      label: REPORT_TYPES[type].label,
      color: REPORT_TYPES[type].color,
      count: reports.filter((report) => report.type === type).length,
    })),
    byDistrict: Object.entries(countByDistrict)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function monthNormal(month: string): number | null {
  const number = Number(month.slice(5, 7));
  return models.extremeRain.monthlyClimatology.find((entry) => entry.month === number)?.meanMm ?? null;
}

export async function loadKpis(input?: Status | Promise<Status>): Promise<Kpis> {
  const [status, [balanceResult, monthResult, reportsResult]] = await Promise.all([input ?? loadStatus(), Promise.allSettled([fetchRainBalance(), fetchMonthToDateRain(), listReports()])]);
  const failures: SourceFailure[] = [...status.failures];
  if (balanceResult.status === "rejected") {
    failures.push(failure("openMeteo", balanceResult.reason));
  }
  if (monthResult.status === "rejected") failures.push(failure("openMeteo", monthResult.reason));
  if (reportsResult.status === "rejected") failures.push(failure("reports", reportsResult.reason));
  const river = status.river;
  const balance = balanceResult.status === "fulfilled" ? balanceResult.value : null;
  const month = monthResult.status === "fulfilled" ? monthResult.value : null;
  const reports = reportsResult.status === "fulfilled" ? reportsResult.value : null;

  return {
    river: river ? buildRiver(river) : null,
    upstream: river ? buildUpstream(river.network) : [],
    network: river ? buildNetwork(river.network) : null,
    rain: balance ? { balance, month, monthNormalMm: monthNormal(month?.month ?? balance.localNow) } : null,
    reports: reports ? buildReports(reports) : null,
    failures,
    generatedAt: new Date().toISOString(),
  };
}
