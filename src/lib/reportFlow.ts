import { REPORT_HREF } from "@/lib/navigation";
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

const HANDOFF_DECIMALS = 5;
const HANDOFF_LABEL_MAX_CHARS = 120;
const HANDOFF_DEFAULT_LABEL = "Dirección consultada";

export type ReportQuery = Record<string, string | string[] | undefined>;

export function reportHrefFor(point: { lat: number; lon: number; label: string }): string {
  const params = new URLSearchParams({
    lat: point.lat.toFixed(HANDOFF_DECIMALS),
    lon: point.lon.toFixed(HANDOFF_DECIMALS),
    lugar: point.label.trim().slice(0, HANDOFF_LABEL_MAX_CHARS),
  });
  return `${REPORT_HREF}?${params}`;
}

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export function draftFromQuery(query: ReportQuery): ReportDraftFlow {
  const latText = single(query.lat);
  const lonText = single(query.lon);
  const lat = latText === null || latText.trim() === "" ? Number.NaN : Number(latText);
  const lon = lonText === null || lonText.trim() === "" ? Number.NaN : Number(lonText);
  if (!isInsideRosario(lat, lon)) {
    return EMPTY_DRAFT;
  }
  const label = (single(query.lugar) ?? "").trim().slice(0, HANDOFF_LABEL_MAX_CHARS);
  return { ...EMPTY_DRAFT, lat, lon, placeLabel: label || HANDOFF_DEFAULT_LABEL };
}
