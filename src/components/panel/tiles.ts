import type { KpiTile } from "@/components/kpis/KpiGrid";
import type { Kpis } from "@/lib/kpis";

const PERCENT = 100;

function sign(value: number | null, unit: string): string {
  if (value === null) {
    return "—";
  }
  return `${value > 0 ? "+" : ""}${value} ${unit}`;
}

export function riverTiles(kpis: Kpis): KpiTile[] {
  const { river } = kpis;
  if (!river) {
    return [];
  }
  const margin = river.alertMarginM;
  return [
    { label: "Río ahora", value: river.current.toFixed(2), unit: "m", detail: `${sign(river.change24hCm, "cm")} en 24 h · ${sign(river.change7dCm, "cm")} en 7 días` },
    {
      label: "Margen a alerta",
      value: margin === null ? "—" : margin.toFixed(2),
      unit: "m",
      detail: river.daysToAlert === null ? (river.rateCmPerDay === null ? "sin tendencia" : `${river.rateCmPerDay} cm/día · no la alcanza a este ritmo`) : `${river.rateCmPerDay} cm/día · extrapolación a ${river.daysToAlert} días${river.daysToAlert > 7 ? " · fuera de la ventana semanal" : ""}`,
      tone: margin !== null && margin <= 0.5 ? "watch" : "neutral",
    },
    { label: "Frente a los últimos 210 días", value: `p${river.percentile210}`, detail: `mín ${river.min210.meters.toFixed(2)} · máx ${river.max210.meters.toFixed(2)} m` },
  ];
}

export function rainTiles(kpis: Kpis): KpiTile[] {
  const { rain } = kpis;
  if (!rain) {
    return [];
  }
  const { balance, month, monthNormalMm } = rain;
  const monthPercent = month && monthNormalMm ? Math.round((month.accumulatedMm / monthNormalMm) * PERCENT) : null;
  return [
    { label: "Lluvia caída", value: balance.fallen24h.toFixed(0), unit: "mm / 24 h", detail: `${balance.fallen72h.toFixed(0)} mm en 72 h` },
    { label: "Lluvia prevista", value: balance.expected48h.toFixed(0), unit: "mm / 48 h", detail: `${balance.expected24h.toFixed(0)} mm en 24 h · prob. máx ${balance.maxProbability24h === null ? "sin dato" : `${balance.maxProbability24h} %`}`, tone: balance.expected48h >= 30 ? "watch" : "neutral" },
    {
      label: "Mes en curso",
      value: month ? month.accumulatedMm.toFixed(0) : "—",
      unit: "mm",
      detail: monthPercent === null ? "sin climatología" : `${monthPercent} % de la referencia mensual (${monthNormalMm} mm) · datos hasta ${month?.until ?? "—"}${month?.complete ? "" : " · cobertura parcial"}`,
    },
  ];
}

export function networkAndReportTiles(kpis: Kpis): KpiTile[] {
  const { network, reports } = kpis;
  const topType = [...(reports?.byType ?? [])].sort((a, b) => b.count - a.count)[0];
  return [
    ...(network
      ? [
          { label: "Estaciones sobre alerta", value: String(network.overAlert), detail: `${network.overEvacuation} sobre evacuación · de ${network.withThreshold} con umbral`, tone: network.overAlert > 0 ? ("alert" as const) : ("neutral" as const) },
          { label: "Estaciones creciendo", value: String(network.rising), detail: `de ${network.withThreshold} con umbral válido` },
        ]
      : []),
    {
      label: "Reportes de vecinos",
      value: reports ? String(reports.active) : "—",
      detail: !reports ? "consulta no disponible" : reports.active === 0 ? "ninguno en 24 h" : `${reports.last6h} en las últimas 6 h · ${reports.confirmations} confirmaciones${topType && topType.count > 0 ? ` · ${topType.label.toLowerCase()}` : ""}`,
      tone: (reports?.last6h ?? 0) > 0 ? ("watch" as const) : ("neutral" as const),
    },
  ];
}
