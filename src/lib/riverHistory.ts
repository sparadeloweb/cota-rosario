import snapshot from "../../public/data/river-history.json";
import { fetchRiver, type RiverReading } from "@/lib/river";

const LONG_HISTORY_DAYS = 210;
const STALE_AFTER_DAYS = 3;
const MILLIS_PER_DAY = 86_400_000;

export interface RiverHistory {
  series: RiverReading[];
  from: string;
  until: string;
  origin: "instantanea" | "renovada";
  computedSnapshot: string;
}

interface LongHistoryCache {
  series: RiverReading[];
  origin: RiverHistory["origin"];
  refreshing: boolean;
  attemptedAt: number;
}

const cache: LongHistoryCache = { series: snapshot.series as RiverReading[], origin: "instantanea", refreshing: false, attemptedAt: 0 };

function dayKey(date: string): string {
  return date.slice(0, 10);
}

function mergeSeries(base: RiverReading[], recent: RiverReading[]): RiverReading[] {
  const byDay = new Map(base.map((reading) => [dayKey(reading.date), reading]));
  for (const reading of recent) {
    byDay.set(dayKey(reading.date), reading);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function daysBetween(earlier: string, later: string): number {
  return (new Date(later).getTime() - new Date(earlier).getTime()) / MILLIS_PER_DAY;
}

function refreshLongHistoryInBackground(): void {
  if (cache.refreshing || Date.now() - cache.attemptedAt < 5 * 60_000) {
    return;
  }
  cache.refreshing = true;
  cache.attemptedAt = Date.now();
  fetchRiver(LONG_HISTORY_DAYS)
    .then((liveSnapshot) => {
      cache.series = mergeSeries(cache.series, liveSnapshot.series);
      cache.origin = "renovada";
    })
    .catch((error: unknown) => {
      console.warn("Could not refresh the long INA series:", error instanceof Error ? error.message : error);
    })
    .finally(() => {
      cache.refreshing = false;
    });
}

export function mergeRiverHistory(recent: RiverReading[]): RiverHistory {
  const merged = mergeSeries(cache.series, recent);
  const latest = merged.at(-1)?.date;
  const series = latest ? merged.filter((reading) => daysBetween(reading.date, latest) <= LONG_HISTORY_DAYS) : [];
  const lastLong = cache.series[cache.series.length - 1]?.date;
  const lastRecent = recent[recent.length - 1]?.date;
  if (lastLong && lastRecent && daysBetween(lastLong, lastRecent) > STALE_AFTER_DAYS) {
    refreshLongHistoryInBackground();
  }
  return {
    series,
    from: series[0]?.date ?? "",
    until: series[series.length - 1]?.date ?? "",
    origin: cache.origin,
    computedSnapshot: snapshot.computedAt,
  };
}
