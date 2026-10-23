import type { RiskLevel } from "@/lib/risk";

export const RISK_FILL: Record<RiskLevel, string> = {
  normal: "#46a06b",
  watch: "#cf9a2f",
  alert: "#d4713a",
  critical: "#d4483f",
};

export function riskColor(level: RiskLevel | null | undefined): string {
  return level ? RISK_FILL[level] : "#98a2b3";
}

export const RISK_TEXT: Record<RiskLevel, string> = {
  normal: "text-normal",
  watch: "text-watch",
  alert: "text-alert",
  critical: "text-critical",
};

export const RISK_BORDER: Record<RiskLevel, string> = {
  normal: "border-normal",
  watch: "border-watch",
  alert: "border-alert",
  critical: "border-critical",
};
