import type { UpstreamStation } from "@/lib/kpis";
import { argentinaDateTime } from "@/lib/time";

export function UpstreamStrip({ stations }: { stations: UpstreamStation[] }) {
  return <ol className="flex flex-col gap-3">{stations.map((station) => <li key={station.name} className="flex items-start justify-between gap-3 text-xs">
    <span className={station.isRosario ? "text-ink font-medium" : "text-ink-soft"}>{station.name}<span className="mt-1 block text-ink-faint">{argentinaDateTime(station.date)}</span></span>
    <span className="readout text-right text-ink">{station.meters.toFixed(2)} m · {station.trend || "sin tendencia"}<span className={`mt-1 block ${station.alertMarginM !== null && station.alertMarginM <= 0.5 ? "text-watch" : "text-ink-soft"}`}>{station.alertMarginM === null ? "Sin umbral válido" : `${station.alertMarginM.toFixed(2)} m de margen a alerta`}</span></span>
  </li>)}</ol>;
}
