import { distanceMeters } from "@/lib/places";
export const REPORT_TYPES = {
  street: { label: "Calle anegada", color: "#5f9bb8" },
  home: { label: "Agua en viviendas", color: "#dc5449" },
  drain: { label: "Desagüe tapado", color: "#d2a13a" },
  closure: { label: "Calle cortada", color: "#db7c45" },
} as const;

export type ReportType = keyof typeof REPORT_TYPES;

export interface Report {
  id: string;
  lat: number;
  lon: number;
  type: ReportType;
  description: string;
  createdAt: string;
  confirmations: number;
}

export const REPORT_TTL_HOURS = 24;
export const DESCRIPTION_MAX_CHARS = 140;

export interface NearbyReport {
  report: Report;
  meters: number;
}

export function reportsNear(reports: readonly Report[], point: { lat: number; lon: number }, radiusMeters: number): NearbyReport[] {
  return reports
    .map((report) => ({ report, meters: distanceMeters(point, report) }))
    .filter((entry) => entry.meters <= radiusMeters)
    .sort((a, b) => a.meters - b.meters);
}
