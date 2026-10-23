import type { RiskLevel } from "@/lib/risk";
import { riskLabel } from "@/lib/risk";

export const CONSEJOS: Record<RiskLevel, string[]> = {
  normal: [
    "Los datos consultados no superan los umbrales orientativos. Revisá las condiciones de tu cuadra y las comunicaciones oficiales.",
    "Si vivís sobre zona marcada, revisá que la rejilla de tu frente no esté tapada.",
  ],
  atencion: [
    "Sacá el auto de la vereda si vivís sobre una zona marcada.",
    "Revisá que las rejillas y los desagües de tu frente estén despejados.",
    "Evitá programar viajes por las avenidas que cruzan el Ludueña o el Saladillo en las próximas horas.",
  ],
  alerta: [
    "No cruces calles anegadas ni en auto ni a pie: no se ve el cordón ni las bocas de tormenta abiertas.",
    "Levantá lo que tengas a nivel de piso en cocheras y patios.",
    "Si estás sobre zona marcada, tené documentación y medicación en algo impermeable.",
  ],
  critico: [
    "Seguí las indicaciones de Defensa Civil: 103.",
    "Cortá la luz del sector si el agua entra a la vivienda.",
    "No vuelvas a una zona anegada a buscar cosas hasta que baje.",
  ],
};

export const CONSEJOS_INCOMPLETO = [
  "La evaluación está incompleta: consultá las fuentes disponibles y las comunicaciones oficiales.",
  "Los aportes de vecinos son señales para verificar; su ausencia no descarta agua en la zona.",
];

export function tituloEstado(nivel: RiskLevel | null): string {
  if (nivel === null) {
    return "Faltan datos para una evaluación completa";
  }
  return nivel === "normal" ? "Sin señales elevadas en los datos consultados" : `Nivel ${riskLabel(nivel).toLowerCase()} en los datos consultados`;
}

export function consejosPara(riesgo: { nivel: RiskLevel | null; incompleto: boolean }): string[] {
  if (riesgo.nivel === null) {
    return [...CONSEJOS_INCOMPLETO];
  }
  return riesgo.incompleto ? [...CONSEJOS[riesgo.nivel], CONSEJOS_INCOMPLETO[0]] : [...CONSEJOS[riesgo.nivel]];
}
