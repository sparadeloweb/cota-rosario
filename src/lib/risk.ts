import type { RainSnapshot } from "@/lib/rain";
import type { RiverSnapshot, RiverStation } from "@/lib/river";

export type RiskLevel = "normal" | "atencion" | "alerta" | "critico";

export const RISK_ORDER: RiskLevel[] = ["normal", "atencion", "alerta", "critico"];

export const RISK_LABEL: Record<RiskLevel, string> = {
  normal: "Sin riesgo",
  atencion: "Atención",
  alerta: "Alerta",
  critico: "Crítico",
};

const ATENCION_MARGIN_METERS = 0.5;
const RAIN_ATENCION_MM = 15;
const RAIN_ALERTA_MM = 25;
const RAIN_CRITICO_MM = 30;
const ZONE_RAIN_SENSITIVITY: Record<string, number> = { A: 1, B: 1, C: 0.9, D: 0.9, "1": 0.8, "2": 0.8, "3": 0.8 };

export interface RiskFactor {
  clave: "rio" | "lluvia";
  nivel: RiskLevel;
  titulo: string;
  detalle: string;
  medida: string;
  umbral: string;
  oficial: boolean;
  disponible: boolean;
}

export interface RiskAssessment {
  nivel: RiskLevel;
  motivo: string;
  factores: RiskFactor[];
  zonas: { zona: string; nivel: RiskLevel }[];
  incompleto: boolean;
  sinDatos: boolean;
  evaluadoEn: string;
}

export function hasUsableThresholds(station: Pick<RiverStation, "alerta" | "evacuacion">): boolean {
  return station.alerta !== null && station.alerta > 0;
}

function worst(levels: RiskLevel[]): RiskLevel {
  return levels.reduce((accumulated, level) => (RISK_ORDER.indexOf(level) > RISK_ORDER.indexOf(accumulated) ? level : accumulated), "normal");
}

function rainLevel(mm: number): RiskLevel {
  return mm >= RAIN_CRITICO_MM ? "critico" : mm >= RAIN_ALERTA_MM ? "alerta" : mm >= RAIN_ATENCION_MM ? "atencion" : "normal";
}

function riverLevel(metros: number, alerta: number, evacuacion: number | null): RiskLevel {
  if (evacuacion !== null && evacuacion > 0 && metros >= evacuacion) {
    return "critico";
  }
  if (metros >= alerta) {
    return "alerta";
  }
  if (metros >= alerta - ATENCION_MARGIN_METERS) {
    return "atencion";
  }
  return "normal";
}

function riverFactor(river: RiverSnapshot | null): RiskFactor {
  if (!river) {
    return {
      clave: "rio",
      nivel: "normal",
      titulo: "Altura del Paraná",
      detalle: "El INA no respondió. La altura del río no entra en esta evaluación.",
      medida: "sin dato",
      umbral: "—",
      oficial: true,
      disponible: false,
    };
  }

  const { estacion, margenHastaAlerta } = river;
  const medida = `${estacion.metros.toFixed(2)} m · ${estacion.tendencia || "sin tendencia"}`;

  if (!hasUsableThresholds(estacion)) {
    return {
      clave: "rio",
      nivel: "normal",
      titulo: "Altura del Paraná",
      detalle: "El INA no publica niveles de alerta válidos para esta estación, así que la altura no suma al riesgo.",
      medida,
      umbral: "sin umbral publicado",
      oficial: true,
      disponible: true,
    };
  }

  const alerta = estacion.alerta as number;
  const nivel = riverLevel(estacion.metros, alerta, estacion.evacuacion);
  const detalle =
    nivel === "normal"
      ? `Faltan ${margenHastaAlerta?.toFixed(2)} m para el nivel de alerta del INA.`
      : nivel === "atencion"
        ? `Está a menos de ${ATENCION_MARGIN_METERS.toFixed(2)} m del nivel de alerta.`
        : nivel === "alerta"
          ? "Superó el nivel de alerta declarado por el INA."
          : "Superó el nivel de evacuación declarado por el INA.";

  return {
    clave: "rio",
    nivel,
    titulo: "Altura del Paraná",
    detalle,
    medida,
    umbral: `alerta ${alerta.toFixed(2)} m · evacuación ${estacion.evacuacion?.toFixed(2) ?? "—"} m`,
    oficial: true,
    disponible: true,
  };
}

function rainFactor(rain: RainSnapshot | null): RiskFactor {
  if (!rain) {
    return {
      clave: "lluvia",
      nivel: "normal",
      titulo: "Lluvia concentrada",
      detalle: "Open-Meteo no respondió. La lluvia no entra en esta evaluación.",
      medida: "sin dato",
      umbral: "—",
      oficial: false,
      disponible: false,
    };
  }

  const pico = rain.picoVentana?.milimetros ?? 0;
  const nivel = rainLevel(pico);
  const detalle =
    nivel === "normal"
      ? "No se pronostica una concentración de lluvia capaz de anegar por sí sola."
      : `Se pronostican ${pico.toFixed(1)} mm concentrados en dos horas, el rango en que el macrocentro empieza a anegarse.`;

  return {
    clave: "lluvia",
    nivel,
    titulo: "Lluvia concentrada",
    detalle,
    medida: `${pico.toFixed(1)} mm en 2 h · ${rain.acumulado24h.toFixed(1)} mm en 24 h`,
    umbral: `atención ${RAIN_ATENCION_MM} mm · alerta ${RAIN_ALERTA_MM} mm · crítico ${RAIN_CRITICO_MM} mm`,
    oficial: false,
    disponible: true,
  };
}

export function assessRisk(river: RiverSnapshot | null, rain: RainSnapshot | null): RiskAssessment {
  const factores = [riverFactor(river), rainFactor(rain)];
  const disponibles = factores.filter((factor) => factor.disponible);
  const sinDatos = disponibles.length === 0;
  const incompleto = disponibles.length < factores.length;
  const nivel = worst(disponibles.map((factor) => factor.nivel));
  const dominante = disponibles.find((factor) => factor.nivel === nivel);
  const caidas = factores.filter((factor) => !factor.disponible).map((factor) => factor.titulo.toLowerCase());

  const motivoBase =
    nivel === "normal"
      ? "Ni la altura del río ni la lluvia pronosticada alcanzan un umbral de riesgo."
      : `${dominante?.titulo}: ${dominante?.detalle}`;

  const motivo = sinDatos
    ? "Ninguna fuente respondió. No se puede evaluar el riesgo ahora mismo."
    : incompleto
      ? `Evaluación parcial, sin ${caidas.join(" ni ")}. ${motivoBase}`
      : motivoBase;

  const picoLluvia = rain?.picoVentana?.milimetros ?? 0;
  const zonas = Object.entries(ZONE_RAIN_SENSITIVITY).map(([zona, peso]) => ({
    zona,
    nivel: worst([rainLevel(picoLluvia * peso), factores[0].nivel]),
  }));

  return { nivel, motivo, factores, zonas, incompleto, sinDatos, evaluadoEn: new Date().toISOString() };
}

export interface SimulationInput {
  metros: number;
  alerta: number;
  evacuacion: number;
  picoLluviaMm: number;
}

export interface SimulationResult {
  nivel: RiskLevel;
  rio: RiskLevel;
  lluvia: RiskLevel;
  zonas: { zona: string; nivel: RiskLevel }[];
}

export function simulate({ metros, alerta, evacuacion, picoLluviaMm }: SimulationInput): SimulationResult {
  const rio = riverLevel(metros, alerta, evacuacion);
  const lluvia = rainLevel(picoLluviaMm);
  const zonas = Object.entries(ZONE_RAIN_SENSITIVITY).map(([zona, peso]) => ({
    zona,
    nivel: worst([rainLevel(picoLluviaMm * peso), rio]),
  }));
  return { nivel: worst([rio, lluvia]), rio, lluvia, zonas };
}

export const RAIN_THRESHOLDS = { atencion: RAIN_ATENCION_MM, alerta: RAIN_ALERTA_MM, critico: RAIN_CRITICO_MM };
