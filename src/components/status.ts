import type { RiskLevel } from "@/lib/risk";

export const RISK_FILL: Record<RiskLevel, string> = {
  normal: "#46a06b",
  atencion: "#cf9a2f",
  alerta: "#d4713a",
  critico: "#d4483f",
};

export const RISK_TEXT: Record<RiskLevel, string> = {
  normal: "text-normal",
  atencion: "text-atencion",
  alerta: "text-alerta",
  critico: "text-critico",
};

export const RISK_BORDER: Record<RiskLevel, string> = {
  normal: "border-normal",
  atencion: "border-atencion",
  alerta: "border-alerta",
  critico: "border-critico",
};
