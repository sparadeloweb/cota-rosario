import { dentroDeRosario } from "@/lib/places";
import { DESCRIPTION_MAX_CHARS, REPORT_TYPES, type ReportType } from "@/lib/reportTypes";

export const REPORT_STEPS = ["tipo", "lugar", "detalle", "revisar"] as const;
export type ReportStep = (typeof REPORT_STEPS)[number];

export interface ReportDraftFlow {
  tipo: ReportType | null;
  lat: number | null;
  lon: number | null;
  etiquetaLugar: string;
  descripcion: string;
}

export const EMPTY_DRAFT: ReportDraftFlow = { tipo: null, lat: null, lon: null, etiquetaLugar: "", descripcion: "" };

export function esTipo(valor: string): valor is ReportType {
  return Object.hasOwn(REPORT_TYPES, valor);
}

export function puedeAvanzar(paso: ReportStep, borrador: ReportDraftFlow): boolean {
  switch (paso) {
    case "tipo":
      return borrador.tipo !== null && esTipo(borrador.tipo);
    case "lugar":
      return borrador.lat !== null && borrador.lon !== null && dentroDeRosario(borrador.lat, borrador.lon);
    case "detalle":
      return borrador.descripcion.trim().length <= DESCRIPTION_MAX_CHARS;
    case "revisar":
      return REPORT_STEPS.slice(0, -1).every((anterior) => puedeAvanzar(anterior, borrador));
  }
}

export function siguientePaso(paso: ReportStep): ReportStep {
  const indice = REPORT_STEPS.indexOf(paso);
  return REPORT_STEPS[Math.min(indice + 1, REPORT_STEPS.length - 1)];
}

export function pasoAnterior(paso: ReportStep): ReportStep {
  const indice = REPORT_STEPS.indexOf(paso);
  return REPORT_STEPS[Math.max(indice - 1, 0)];
}

export function cuerpoDelEnvio(borrador: ReportDraftFlow): { lat: number; lon: number; tipo: ReportType; descripcion: string; web: "" } | null {
  if (!puedeAvanzar("revisar", borrador) || borrador.tipo === null || borrador.lat === null || borrador.lon === null) {
    return null;
  }
  return { lat: borrador.lat, lon: borrador.lon, tipo: borrador.tipo, descripcion: borrador.descripcion.trim(), web: "" };
}
