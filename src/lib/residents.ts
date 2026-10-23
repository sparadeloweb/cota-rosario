import type { RiskLevel } from "@/lib/risk";
import { riskLabel } from "@/lib/risk";

export const ADVICE: Record<RiskLevel, string[]> = {
  normal: [
    "Los datos consultados no superan los umbrales orientativos. Revisá las condiciones de tu cuadra y las comunicaciones oficiales.",
    "Si vivís sobre zona marcada, revisá que la rejilla de tu frente no esté tapada.",
  ],
  watch: [
    "Sacá el auto de la vereda si vivís sobre una zona marcada.",
    "Revisá que las rejillas y los desagües de tu frente estén despejados.",
    "Evitá programar viajes por las avenidas que cruzan el Ludueña o el Saladillo en las próximas horas.",
  ],
  alert: [
    "No cruces calles anegadas ni en auto ni a pie: no se ve el cordón ni las bocas de tormenta abiertas.",
    "Levantá lo que tengas a nivel de piso en cocheras y patios.",
    "Si estás sobre zona marcada, tené documentación y medicación en algo impermeable.",
  ],
  critical: [
    "Seguí las indicaciones de Defensa Civil: 103.",
    "Cortá la luz del sector si el agua entra a la vivienda.",
    "No vuelvas a una zona anegada a buscar cosas hasta que baje.",
  ],
};

export const ADVICE_INCOMPLETE = [
  "La evaluación está incompleta: consultá las fuentes disponibles y las comunicaciones oficiales.",
  "Los aportes de vecinos son señales para verificar; su ausencia no descarta agua en la zona.",
];

export function statusTitle(level: RiskLevel | null): string {
  if (level === null) {
    return "Faltan datos para una evaluación completa";
  }
  return level === "normal" ? "Sin señales elevadas en los datos consultados" : `Nivel ${riskLabel(level).toLowerCase()} en los datos consultados`;
}

export function tipsFor(risk: { level: RiskLevel | null; incomplete: boolean }): string[] {
  if (risk.level === null) {
    return [...ADVICE_INCOMPLETE];
  }
  return risk.incomplete ? [...ADVICE[risk.level], ADVICE_INCOMPLETE[0]] : [...ADVICE[risk.level]];
}
