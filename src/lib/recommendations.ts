import type { Status } from "@/lib/status";
import type { Kpis } from "@/lib/kpis";
import type { Predictions } from "@/lib/predictions";
import { REPORT_TYPES } from "@/lib/reportTypes";
import { RAIN_THRESHOLDS, riskLabel } from "@/lib/risk";
import { argentinaTime } from "@/lib/time";

export type Priority = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  priority: Priority;
  title: string;
  action: string;
  why: string;
}

export interface SituationReport {
  text: string;
  generatedAt: string;
}

interface Inputs {
  status: Status;
  kpis: Kpis;
  predictions: Predictions;
}

const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];
const MARGIN_ALERT_M = 0.5;
const DAYS_TO_ALERT_SOON = 7;
const RISING_CM_PER_DAY = 2;
const UPSTREAM_MARGIN_WARN_M = 0.5;
const UPSTREAM_STATIONS_FOR_WAVE = 2;
const FORECAST_RAIN_48H_MM = 30;
const RETURN_PERIOD_RARE_YEARS = 5;
const MONTH_SATURATION_RATIO = 1.5;
const EXPECTED_CASES_WEEK = 10;
const EXPECTED_CASES_DISTRICT = 3;
const RECENT_REPORTS_ALERT = 3;
const PERCENT = 100;

function title(text: string): string {
  return text.charAt(0) + text.slice(1).toLowerCase();
}

function formatDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function riverRules({ status, kpis }: Inputs): Recommendation[] {
  const river = kpis.river;
  const station = status.river?.station;
  if (!river || !station) {
    return [];
  }
  const out: Recommendation[] = [];
  const riverLevel = status.risk.factors.find((factor) => factor.id === "river")?.level;
  if (riverLevel === "critical" || riverLevel === "alert") {
    out.push({
      id: "rio-umbral",
      priority: "high",
      title: riverLevel === "critical" ? "El río superó el nivel de evacuación" : "El río superó el nivel de alerta",
      action: "Contrastar la lectura con el boletín oficial y consultar el protocolo del organismo responsable.",
      why: `Altura ${river.current.toFixed(2)} m contra alerta ${station.alert?.toFixed(2) ?? "—"} m y evacuación ${station.evacuation?.toFixed(2) ?? "—"} m del INA.`,
    });
  } else if (river.alertMarginM !== null && (river.alertMarginM <= MARGIN_ALERT_M || (river.daysToAlert !== null && river.daysToAlert <= DAYS_TO_ALERT_SOON))) {
    out.push({
      id: "rio-margen",
      priority: "high",
      title: "Revisar el margen al umbral ribereño",
      action: "Revisar el listado de familias en zonas bajas de la costa e islas, verificar bombas y lanchas, y acordar con Prefectura el criterio de aviso.",
      why: `Margen a alerta de ${river.alertMarginM.toFixed(2)} m con un ritmo de ${river.rateCmPerDay ?? 0} cm/día${river.daysToAlert !== null ? `: la alerta llegaría en ${river.daysToAlert} días si sigue igual` : ""}.`,
    });
  }

  const inWave = kpis.upstream.filter(
    (station) => station.isUpstream && station.alertMarginM !== null && station.alertMarginM <= UPSTREAM_MARGIN_WARN_M && station.trend.toLowerCase() === "crece",
  );
  if (inWave.length >= UPSTREAM_STATIONS_FOR_WAVE || (inWave.length > 0 && river.rateCmPerDay !== null && river.rateCmPerDay >= RISING_CM_PER_DAY)) {
    out.push({
      id: "rio-onda",
      priority: "medium",
      title: "Revisar las subidas observadas aguas arriba",
      action: "Comparar estas lecturas con la altura diaria de Rosario y los boletines del INA antes de sacar conclusiones.",
      why: `${inWave.map((station) => `${station.name} a ${station.alertMarginM} m de su alerta y creciendo`).join(", ")}. Estas señales no permiten fijar llegada ni magnitud de una onda en Rosario.`,
    });
  } else if (river.rateCmPerDay !== null && river.rateCmPerDay >= RISING_CM_PER_DAY) {
    out.push({
      id: "rio-tendencia",
      priority: "low",
      title: "El ajuste de los últimos 14 días muestra una subida",
      action: "Mantener el seguimiento diario y comparar mañana contra la proyección de Predicciones.",
      why: `Ritmo de ${river.rateCmPerDay} cm/día en los últimos 14 días; ${river.change7dCm !== null ? `${river.change7dCm > 0 ? "+" : ""}${river.change7dCm} cm en 7 días` : "sin variación semanal disponible"}.`,
    });
  }
  return out;
}

function rainRules({ status, kpis, predictions }: Inputs): Recommendation[] {
  const out: Recommendation[] = [];
  const peak = status.rain?.peakWindow;
  const balance = kpis.rain?.balance;
  const rain = predictions.rain;
  const topDistrict = predictions.flooding?.byDistrict[0];
  if (peak && peak.millimeters >= RAIN_THRESHOLDS.watch) {
    const strong = peak.millimeters >= RAIN_THRESHOLDS.alert;
    out.push({
      id: "lluvia-pico",
      priority: strong ? "high" : "medium",
      title: strong ? "Pico de lluvia sobre el umbral orientativo" : "Lluvia concentrada en las próximas 48 h",
      action: `Revisar el pronóstico y planificar una inspección de drenaje para el ${formatDay(peak.from.slice(0, 10))}${topDistrict ? `, empezando por ${title(topDistrict.district)}` : ""}. Definir los puntos de inspección con registros locales.`,
      why: `Pico pronosticado de ${peak.millimeters} mm en 2 h a partir de las ${peak.from.slice(11, 16)} del ${formatDay(peak.from.slice(0, 10))}; el umbral de ${strong ? "alerta" : "atención"} es ${strong ? RAIN_THRESHOLDS.alert : RAIN_THRESHOLDS.watch} mm.`,
    });
  } else if (balance && balance.expected48h >= FORECAST_RAIN_48H_MM) {
    out.push({
      id: "lluvia-acumulada",
      priority: "medium",
      title: "Semana lluviosa por delante",
      action: "Programar limpieza de desagües en los sectores con más historial y revisar que las bombas del Ludueña estén operativas.",
      why: `${balance.expected48h} mm previstos en 48 h, repartidos sin un pico fuerte (probabilidad máxima ${balance.maxProbability24h === null ? "sin dato" : `${balance.maxProbability24h} %`}).`,
    });
  }
  if (rain && rain.maxDay.millimeters > 0 && rain.returnPeriodYears >= RETURN_PERIOD_RARE_YEARS) {
    out.push({
      id: "lluvia-rara",
      priority: "high",
      title: "Se pronostica una lluvia poco frecuente",
      action: `Contrastar el escenario del ${formatDay(rain.maxDay.date)} con pronósticos oficiales y criterio local antes de planificar acciones.`,
      why: `${rain.maxDay.millimeters} mm en un día es una lluvia que, como máximo del año, tiene un período de retorno de ${rain.returnPeriodYears} años en el ajuste histórico, sujeto a sus limitaciones.`,
    });
  }
  const month = kpis.rain?.month;
  const normal = kpis.rain?.monthNormalMm;
  if (month && normal && month.accumulatedMm >= normal * MONTH_SATURATION_RATIO) {
    out.push({
      id: "lluvia-saturacion",
      priority: "low",
      title: "El acumulado mensual supera la referencia histórica",
      action: "Complementar el acumulado de lluvia con registros locales de humedad del suelo.",
      why: `Van ${month.accumulatedMm.toFixed(0)} mm en el mes, el ${Math.round((month.accumulatedMm / normal) * PERCENT)} % de un mes normal (${normal} mm).`,
    });
  }
  return out;
}

function floodingRules({ predictions }: Inputs): Recommendation[] {
  const flooding = predictions.flooding;
  if (!flooding) {
    return [];
  }
  const top = flooding.byDistrict[0];
  if (flooding.cityExpected >= EXPECTED_CASES_WEEK || (top && top.expected >= EXPECTED_CASES_DISTRICT)) {
    return [
      {
        id: "anegamientos-guardias",
        priority: "low",
        title: "Revisar el escenario de anegamientos",
        action: "Contrastar el resultado con registros recientes y criterio local antes de usarlo para planificar recursos.",
        why: `La proyección orientativa del modelo mensual muestra ${flooding.cityExpected.toFixed(1)} casos en ${flooding.windowDays} días${top ? `, ${top.expected.toFixed(1)} en ${title(top.district)}` : ""}, distribuidos según la participación histórica de cada distrito.`,
      },
    ];
  }
  return [];
}

function reportRules({ kpis }: Inputs): Recommendation[] {
  const reports = kpis.reports;
  if (!reports) return [];
  const out: Recommendation[] = [];
  const homes = reports.byType.find((type) => type.type === "home")?.count ?? 0;
  const closures = reports.byType.find((type) => type.type === "closure")?.count ?? 0;
  const topDistrict = reports.byDistrict[0];
  if (homes > 0) {
    out.push({
      id: "reportes-viviendas",
      priority: "high",
      title: "Vecinos reportan agua dentro de viviendas",
      action: `Verificar el aporte antes de evaluar una respuesta${topDistrict ? ` en ${title(topDistrict.district)}` : ""} con el equipo responsable.`,
      why: `${homes} reporte${homes === 1 ? "" : "s"} de "${REPORT_TYPES.home.label}" en las últimas 24 h. Son reportes sin verificar: son una señal, no un dato oficial.`,
    });
  }
  if (reports.last6h >= RECENT_REPORTS_ALERT) {
    out.push({
      id: "reportes-recientes",
      priority: "high",
      title: "Están entrando reportes de agua ahora",
      action: "Verificar en terreno y, si se confirma, publicar el estado de las calles afectadas en los canales oficiales.",
      why: `${reports.last6h} reportes en las últimas 6 h${topDistrict ? `, la mayoría en ${title(topDistrict.district)}` : ""}, con ${reports.confirmations} confirmaciones de otros vecinos.`,
    });
  }
  if (closures > 0) {
    out.push({
      id: "reportes-cortes",
      priority: "medium",
      title: "Calles reportadas como cortadas",
      action: "Verificar la ubicación y el estado del corte antes de proponer desvíos o compartir información.",
      why: `${closures} reporte${closures === 1 ? "" : "s"} de "${REPORT_TYPES.closure.label}" en las últimas 24 h.`,
    });
  }
  return out;
}

function sourceRules({ status, kpis }: Inputs): Recommendation[] {
  const failures = [...status.failures, ...kpis.failures.filter((failure) => !status.failures.some((other) => other.source === failure.source))];
  const ina = failures.find((failure) => failure.source === "ina");
  if (!ina) {
    return [];
  }
  return [
    {
      id: "fuente-ina",
      priority: "low",
      title: "La consulta del INA no está disponible",
      action: "Confirmar la altura del río por Prefectura o por la escala de la Bolsa de Comercio hasta que el servicio vuelva; actualizar la vista vuelve a consultar las fuentes.",
      why: `Sin respuesta desde las ${argentinaTime(ina.at)}. La evaluación queda incompleta; los insumos disponibles no prueban ausencia de riesgo.`,
    },
  ];
}

function calmRule(inputs: Inputs, existing: Recommendation[]): Recommendation[] {
  if (inputs.status.risk.incomplete || !inputs.kpis.rain || !inputs.kpis.river) return [];
  if (existing.some((recommendation) => recommendation.priority !== "low")) {
    return [];
  }
  const balance = inputs.kpis.rain?.balance;
  const margin = inputs.kpis.river?.alertMarginM;
  return [
    {
      id: "calma-preventivo",
      priority: "low",
      title: "Sin umbrales elevados en los insumos disponibles",
      action: "Aprovechar para limpiar sumideros en Centro (el distrito que concentra los anegamientos), probar las bombas del Ludueña y actualizar el padrón de vecinos ribereños.",
      why: `${balance ? `${balance.expected48h} mm previstos en 48 h` : "Balance no disponible"}${margin !== null && margin !== undefined ? ` y ${margin.toFixed(2)} m de margen hasta la alerta del río` : ""}.`,
    },
  ];
}

export function buildRecommendations(inputs: Inputs): Recommendation[] {
  const base = [...riverRules(inputs), ...rainRules(inputs), ...floodingRules(inputs), ...reportRules(inputs), ...sourceRules(inputs)];
  return [...base, ...calmRule(inputs, base)].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
}

export function buildSituationReport({ status, kpis, predictions }: Inputs): SituationReport {
  const river = kpis.river;
  const station = status.river?.station;
  const balance = kpis.rain?.balance;
  const flooding = predictions.flooding;
  const reports = kpis.reports;
  const inWave = kpis.upstream.filter((station) => station.isUpstream && station.trend.toLowerCase() === "crece").length;
  const phrases: string[] = [];
  phrases.push(`Cota · resumen de la consulta ${status.risk.assessedAt.slice(0, 10)} a las ${argentinaTime(status.risk.assessedAt)}. Señal del panel: ${riskLabel(status.risk.level).toLowerCase()}${status.risk.incomplete ? "; evaluación parcial" : ""}. Las estimaciones son orientativas y se complementan con las condiciones locales y las comunicaciones oficiales.`);
  if (river && station) {
    phrases.push(
      `El Paraná mide ${river.current.toFixed(2)} m en la escala de Rosario (${river.change24hCm !== null ? `${river.change24hCm > 0 ? "+" : ""}${river.change24hCm} cm en 24 h` : "sin variación diaria"}), a ${river.alertMarginM?.toFixed(2) ?? "—"} m del nivel de alerta del INA${river.rateCmPerDay !== null && river.rateCmPerDay > 0 && river.daysToAlert !== null ? `; al ritmo actual de ${river.rateCmPerDay} cm/día la alcanzaría en ${river.daysToAlert} días${river.daysToAlert > 7 ? ", fuera de la ventana semanal" : ""}` : ""}. Aguas arriba, ${inWave} de ${kpis.upstream.filter((entry) => entry.isUpstream).length} estaciones están en crecida.`,
    );
  }
  if (balance) {
    const peak = status.rain?.peakWindow;
    phrases.push(`El modelo meteorológico estima ${balance.fallen24h.toFixed(1)} mm pasados en las últimas 24 h y se prevén ${balance.expected48h.toFixed(1)} mm para las próximas 48 h${peak && peak.millimeters > 0 ? `, con un pico de ${peak.millimeters} mm en 2 h` : ""}.`);
  }
  if (flooding) {
    const top = flooding.byDistrict[0];
    phrases.push(`El escenario orientativo del modelo mensual muestra ${flooding.cityExpected.toFixed(1)} casos para ${flooding.windowDays} días${top ? `, con mayor participación histórica en ${title(top.district)}` : ""}.`);
  }
  phrases.push(!reports ? "No se pudieron consultar los reportes de vecinos." : reports.active === 0 ? "No hay aportes registrados en las últimas 24 h; esto no descarta agua en la zona." : `Hay ${reports.active} aporte${reports.active === 1 ? " vecinal" : "s vecinales"} sin verificar en las últimas 24 h, ${reports.last6h} en las últimas 6 h.`);
  const falls = [...new Set([...status.failures, ...kpis.failures].map((failure) => failure.source))];
  if (falls.length) {
    phrases.push(`Fuentes sin responder: ${falls.join(", ")}.`);
  }
  return { text: phrases.join(" "), generatedAt: new Date().toISOString() };
}

export function priorityColor(priority: Priority): string {
  return priority === "high" ? "var(--critical)" : priority === "medium" ? "var(--watch)" : "var(--ink-faint)";
}
