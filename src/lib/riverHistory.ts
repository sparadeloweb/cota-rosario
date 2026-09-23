import snapshot from "../../public/data/rio-historia.json";
import { fetchRiver, type RiverReading } from "@/lib/river";

const LONG_HISTORY_DAYS = 210;
const STALE_AFTER_DAYS = 3;
const MILLIS_PER_DAY = 86_400_000;

export interface RiverHistory {
  serie: RiverReading[];
  desde: string;
  hasta: string;
  origen: "instantanea" | "renovada";
  instantaneaCalculada: string;
}

interface LongHistoryCache {
  serie: RiverReading[];
  origen: RiverHistory["origen"];
  refreshing: boolean;
}

const cache: LongHistoryCache = { serie: snapshot.serie as RiverReading[], origen: "instantanea", refreshing: false };

function dayKey(fecha: string): string {
  return fecha.slice(0, 10);
}

function mergeSeries(base: RiverReading[], recent: RiverReading[]): RiverReading[] {
  const byDay = new Map(base.map((reading) => [dayKey(reading.fecha), reading]));
  for (const reading of recent) {
    byDay.set(dayKey(reading.fecha), reading);
  }
  return [...byDay.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function daysBetween(earlier: string, later: string): number {
  return (new Date(later).getTime() - new Date(earlier).getTime()) / MILLIS_PER_DAY;
}

function refreshLongHistoryInBackground(): void {
  if (cache.refreshing) {
    return;
  }
  cache.refreshing = true;
  fetchRiver(LONG_HISTORY_DAYS)
    .then((snapshotVivo) => {
      cache.serie = mergeSeries(cache.serie, snapshotVivo.serie);
      cache.origen = "renovada";
    })
    .catch((error: unknown) => {
      console.warn("No se pudo renovar la serie larga del INA:", error instanceof Error ? error.message : error);
    })
    .finally(() => {
      cache.refreshing = false;
    });
}

export function mergeRiverHistory(recent: RiverReading[]): RiverHistory {
  const serie = mergeSeries(cache.serie, recent);
  const ultimoLargo = cache.serie[cache.serie.length - 1]?.fecha;
  const ultimoReciente = recent[recent.length - 1]?.fecha;
  if (ultimoLargo && ultimoReciente && daysBetween(ultimoLargo, ultimoReciente) > STALE_AFTER_DAYS) {
    refreshLongHistoryInBackground();
  }
  return {
    serie,
    desde: serie[0]?.fecha ?? "",
    hasta: serie[serie.length - 1]?.fecha ?? "",
    origen: cache.origen,
    instantaneaCalculada: snapshot.calculado,
  };
}
