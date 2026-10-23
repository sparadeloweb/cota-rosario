import { isInsideRosario } from "@/lib/places";
import { DESCRIPTION_MAX_CHARS, REPORT_TYPES, type ReportType } from "@/lib/reportTypes";

export const REPORT_STEPS = ["type", "place", "detail"] as const;
export type ReportStep = (typeof REPORT_STEPS)[number];

export interface ReportDraftFlow {
  type: ReportType | null;
  lat: number | null;
  lon: number | null;
  placeLabel: string;
  description: string;
}

export const EMPTY_DRAFT: ReportDraftFlow = { type: null, lat: null, lon: null, placeLabel: "", description: "" };

export function isReportType(value: string): value is ReportType {
  return Object.hasOwn(REPORT_TYPES, value);
}

export function canAdvance(step: ReportStep, draft: ReportDraftFlow): boolean {
  switch (step) {
    case "type":
      return draft.type !== null && isReportType(draft.type);
    case "place":
      return draft.lat !== null && draft.lon !== null && isInsideRosario(draft.lat, draft.lon);
    case "detail":
      return draft.description.trim().length <= DESCRIPTION_MAX_CHARS;
  }
}

export function isComplete(draft: ReportDraftFlow): boolean {
  return REPORT_STEPS.every((step) => canAdvance(step, draft));
}

export function nextStep(step: ReportStep): ReportStep {
  const index = REPORT_STEPS.indexOf(step);
  return REPORT_STEPS[Math.min(index + 1, REPORT_STEPS.length - 1)];
}

export function previousStep(step: ReportStep): ReportStep {
  const index = REPORT_STEPS.indexOf(step);
  return REPORT_STEPS[Math.max(index - 1, 0)];
}

export function submissionBody(draft: ReportDraftFlow): { lat: number; lon: number; type: ReportType; description: string; web: "" } | null {
  if (!isComplete(draft) || draft.type === null || draft.lat === null || draft.lon === null) {
    return null;
  }
  return { lat: draft.lat, lon: draft.lon, type: draft.type, description: draft.description.trim(), web: "" };
}

export const QUICK_PHRASES = ["llega al cordón", "cubre la vereda", "no pasan autos", "entra a las casas", "sigue subiendo"] as const;

const PHRASE_SEPARATOR = ", ";

export function appendPhrase(description: string, phrase: string): string {
  const current = description.trim();
  if (current.toLowerCase().includes(phrase.toLowerCase())) {
    return description;
  }
  const next = current ? `${current}${PHRASE_SEPARATOR}${phrase}` : phrase;
  return next.length > DESCRIPTION_MAX_CHARS ? description : next;
}
