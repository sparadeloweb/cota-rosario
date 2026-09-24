export const REPORT_TYPES = {
  calle: { etiqueta: "Calle anegada", color: "#5f9bb8" },
  vivienda: { etiqueta: "Agua en viviendas", color: "#dc5449" },
  desague: { etiqueta: "Desagüe tapado", color: "#d2a13a" },
  corte: { etiqueta: "Calle cortada", color: "#db7c45" },
} as const;

export type ReportType = keyof typeof REPORT_TYPES;

export interface Report {
  id: string;
  lat: number;
  lon: number;
  tipo: ReportType;
  descripcion: string;
  creadoEn: string;
  confirmaciones: number;
}

export const REPORT_TTL_HOURS = 24;
export const DESCRIPTION_MAX_CHARS = 140;
