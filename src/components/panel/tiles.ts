import type { KpiTile } from "@/components/kpis/KpiGrid";
import type { Kpis } from "@/lib/kpis";

const PERCENT = 100;

function signo(valor: number | null, unidad: string): string {
  if (valor === null) {
    return "—";
  }
  return `${valor > 0 ? "+" : ""}${valor} ${unidad}`;
}

export function tilesRio(kpis: Kpis): KpiTile[] {
  const { rio } = kpis;
  if (!rio) {
    return [];
  }
  const margen = rio.margenAlertaM;
  return [
    { etiqueta: "Río ahora", valor: rio.actual.toFixed(2), unidad: "m", detalle: `${signo(rio.variacion24hCm, "cm")} en 24 h · ${signo(rio.variacion7dCm, "cm")} en 7 días` },
    {
      etiqueta: "Margen a alerta",
      valor: margen === null ? "—" : margen.toFixed(2),
      unidad: "m",
      detalle: rio.diasHastaAlerta === null ? (rio.ritmoCmDia === null ? "sin tendencia" : `${rio.ritmoCmDia} cm/día · no la alcanza a este ritmo`) : `${rio.ritmoCmDia} cm/día · extrapolación a ${rio.diasHastaAlerta} días${rio.diasHastaAlerta > 7 ? " · fuera de la ventana semanal" : ""}`,
      tono: margen !== null && margen <= 0.5 ? "atencion" : "neutro",
    },
    { etiqueta: "Frente a los últimos 210 días", valor: `p${rio.percentil210}`, detalle: `mín ${rio.minimo210.metros.toFixed(2)} · máx ${rio.maximo210.metros.toFixed(2)} m` },
  ];
}

export function tilesLluvia(kpis: Kpis): KpiTile[] {
  const { lluvia } = kpis;
  if (!lluvia) {
    return [];
  }
  const { balance, mes, mesNormalMm } = lluvia;
  const porcentajeMes = mes && mesNormalMm ? Math.round((mes.acumuladoMm / mesNormalMm) * PERCENT) : null;
  return [
    { etiqueta: "Lluvia caída", valor: balance.caido24h.toFixed(0), unidad: "mm / 24 h", detalle: `${balance.caido72h.toFixed(0)} mm en 72 h` },
    { etiqueta: "Lluvia prevista", valor: balance.prevista48h.toFixed(0), unidad: "mm / 48 h", detalle: `${balance.prevista24h.toFixed(0)} mm en 24 h · prob. máx ${balance.probabilidadMax24h === null ? "sin dato" : `${balance.probabilidadMax24h} %`}`, tono: balance.prevista48h >= 30 ? "atencion" : "neutro" },
    {
      etiqueta: "Mes en curso",
      valor: mes ? mes.acumuladoMm.toFixed(0) : "—",
      unidad: "mm",
      detalle: porcentajeMes === null ? "sin climatología" : `${porcentajeMes} % de la referencia mensual (${mesNormalMm} mm) · datos hasta ${mes?.hasta ?? "—"}${mes?.completo ? "" : " · cobertura parcial"}`,
    },
  ];
}

export function tilesRedYReportes(kpis: Kpis): KpiTile[] {
  const { red, reportes } = kpis;
  const tipoTop = [...(reportes?.porTipo ?? [])].sort((a, b) => b.cantidad - a.cantidad)[0];
  return [
    ...(red
      ? [
          { etiqueta: "Estaciones sobre alerta", valor: String(red.sobreAlerta), detalle: `${red.sobreEvacuacion} sobre evacuación · de ${red.conUmbral} con umbral`, tono: red.sobreAlerta > 0 ? ("alerta" as const) : ("neutro" as const) },
          { etiqueta: "Estaciones creciendo", valor: String(red.creciendo), detalle: `de ${red.conUmbral} con umbral válido` },
        ]
      : []),
    {
      etiqueta: "Reportes de vecinos",
      valor: reportes ? String(reportes.activos) : "—",
      detalle: !reportes ? "consulta no disponible" : reportes.activos === 0 ? "ninguno en 24 h" : `${reportes.ultimas6h} en las últimas 6 h · ${reportes.confirmaciones} confirmaciones${tipoTop && tipoTop.cantidad > 0 ? ` · ${tipoTop.etiqueta.toLowerCase()}` : ""}`,
      tono: (reportes?.ultimas6h ?? 0) > 0 ? ("atencion" as const) : ("neutro" as const),
    },
  ];
}
