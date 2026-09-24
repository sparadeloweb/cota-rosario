import type { Estado } from "@/lib/estado";
import type { Kpis } from "@/lib/kpis";
import type { Predicciones } from "@/lib/predicciones";
import { REPORT_TYPES } from "@/lib/reportTypes";
import { RAIN_THRESHOLDS } from "@/lib/risk";
import { horaArgentina } from "@/lib/time";

export type Prioridad = "alta" | "media" | "baja";

export interface Recomendacion {
  id: string;
  prioridad: Prioridad;
  titulo: string;
  accion: string;
  porQue: string;
}

export interface ParteDeSituacion {
  texto: string;
  generadoEn: string;
}

interface Insumos {
  estado: Estado;
  kpis: Kpis;
  predicciones: Predicciones;
}

const PRIORITY_ORDER: Prioridad[] = ["alta", "media", "baja"];
const MARGIN_ALERT_M = 0.5;
const DAYS_TO_ALERT_SOON = 7;
const RISING_CM_PER_DAY = 2;
const UPSTREAM_OCCUPANCY_WARN = 80;
const UPSTREAM_STATIONS_FOR_WAVE = 2;
const FORECAST_RAIN_48H_MM = 30;
const RETURN_PERIOD_RARE_YEARS = 5;
const MONTH_SATURATION_RATIO = 1.5;
const EXPECTED_CASES_WEEK = 10;
const EXPECTED_CASES_DISTRICT = 3;
const RECENT_REPORTS_ALERT = 3;
const PERCENT = 100;

function titulo(texto: string): string {
  return texto.charAt(0) + texto.slice(1).toLowerCase();
}

function fmtDia(fecha: string): string {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

function reglasRio({ estado, kpis }: Insumos): Recomendacion[] {
  const rio = kpis.rio;
  const estacion = estado.rio?.estacion;
  if (!rio || !estacion) {
    return [];
  }
  const out: Recomendacion[] = [];
  const nivelRio = estado.riesgo.factores.find((factor) => factor.clave === "rio")?.nivel;
  if (nivelRio === "critico" || nivelRio === "alerta") {
    out.push({
      id: "rio-umbral",
      prioridad: "alta",
      titulo: nivelRio === "critico" ? "El río superó el nivel de evacuación" : "El río superó el nivel de alerta",
      accion: "Activar el protocolo ribereño: aviso a barrios costeros e islas, corte preventivo de accesos bajos y asistencia a quienes viven sobre la barranca y en La Florida.",
      porQue: `Altura ${rio.actual.toFixed(2)} m contra alerta ${estacion.alerta?.toFixed(2) ?? "—"} m y evacuación ${estacion.evacuacion?.toFixed(2) ?? "—"} m del INA.`,
    });
  } else if (rio.margenAlertaM !== null && (rio.margenAlertaM <= MARGIN_ALERT_M || (rio.diasHastaAlerta !== null && rio.diasHastaAlerta <= DAYS_TO_ALERT_SOON))) {
    out.push({
      id: "rio-margen",
      prioridad: "alta",
      titulo: "Preparar el plan de evacuación ribereño",
      accion: "Revisar el listado de familias en zonas bajas de la costa e islas, verificar bombas y lanchas, y acordar con Prefectura el criterio de aviso.",
      porQue: `Margen a alerta de ${rio.margenAlertaM.toFixed(2)} m con un ritmo de ${rio.ritmoCmDia ?? 0} cm/día${rio.diasHastaAlerta !== null ? `: la alerta llegaría en ${rio.diasHastaAlerta} días si sigue igual` : ""}.`,
    });
  }

  const enOnda = kpis.aguasArriba.filter(
    (station) => !station.esRosario && (station.ocupacionAlerta ?? 0) >= UPSTREAM_OCCUPANCY_WARN && station.tendencia.toLowerCase() === "crece",
  );
  if (enOnda.length >= UPSTREAM_STATIONS_FOR_WAVE || (enOnda.length > 0 && rio.ritmoCmDia !== null && rio.ritmoCmDia >= RISING_CM_PER_DAY)) {
    out.push({
      id: "rio-onda",
      prioridad: "media",
      titulo: "Viene una onda de crecida por el Paraná",
      accion: "Seguir la altura diaria de Rosario y avisar a los clubes náuticos, guarderías y vecinos de las islas que el nivel va a seguir subiendo en los próximos días.",
      porQue: `${enOnda.map((station) => `${station.nombre} al ${station.ocupacionAlerta} % de su alerta y creciendo`).join(", ")}. Lo que sube aguas arriba llega a Rosario días después.`,
    });
  } else if (rio.ritmoCmDia !== null && rio.ritmoCmDia >= RISING_CM_PER_DAY) {
    out.push({
      id: "rio-tendencia",
      prioridad: "baja",
      titulo: "El río sube más rápido que lo habitual",
      accion: "Mantener el seguimiento diario y comparar mañana contra la proyección de Predicciones.",
      porQue: `Ritmo de ${rio.ritmoCmDia} cm/día en los últimos 14 días; ${rio.variacion7dCm !== null ? `${rio.variacion7dCm > 0 ? "+" : ""}${rio.variacion7dCm} cm en 7 días` : "sin variación semanal disponible"}.`,
    });
  }
  return out;
}

function reglasLluvia({ estado, kpis, predicciones }: Insumos): Recomendacion[] {
  const out: Recomendacion[] = [];
  const pico = estado.lluvia?.picoVentana;
  const balance = kpis.lluvia?.balance;
  const lluvia = predicciones.lluvia;
  const distritoTop = predicciones.anegamientos?.porDistrito[0];
  if (pico && pico.milimetros >= RAIN_THRESHOLDS.atencion) {
    const fuerte = pico.milimetros >= RAIN_THRESHOLDS.alerta;
    out.push({
      id: "lluvia-pico",
      prioridad: fuerte ? "alta" : "media",
      titulo: fuerte ? "Lluvia capaz de anegar por sí sola en las próximas 48 h" : "Lluvia concentrada en las próximas 48 h",
      accion: `Limpiar sumideros y bocas de tormenta antes del ${fmtDia(pico.desde.slice(0, 10))}${distritoTop ? `, empezando por ${titulo(distritoTop.distrito)}` : ""}, y preposicionar cuadrillas y bombas en los cruces del Ludueña y el Saladillo.`,
      porQue: `Pico pronosticado de ${pico.milimetros} mm en 2 h a partir de las ${pico.desde.slice(11, 16)} del ${fmtDia(pico.desde.slice(0, 10))}; el umbral de ${fuerte ? "alerta" : "atención"} es ${fuerte ? RAIN_THRESHOLDS.alerta : RAIN_THRESHOLDS.atencion} mm.`,
    });
  } else if (balance && balance.prevista48h >= FORECAST_RAIN_48H_MM) {
    out.push({
      id: "lluvia-acumulada",
      prioridad: "media",
      titulo: "Semana lluviosa por delante",
      accion: "Programar limpieza de desagües en los sectores con más historial y revisar que las bombas del Ludueña estén operativas.",
      porQue: `${balance.prevista48h} mm previstos en 48 h, repartidos sin un pico fuerte (probabilidad máxima ${balance.probabilidadMax24h} %).`,
    });
  }
  if (lluvia && lluvia.maximoDia.milimetros > 0 && lluvia.periodoRetornoAnios >= RETURN_PERIOD_RARE_YEARS) {
    out.push({
      id: "lluvia-rara",
      prioridad: "alta",
      titulo: "Se pronostica una lluvia poco frecuente",
      accion: `Emitir un aviso preventivo a la población para el ${fmtDia(lluvia.maximoDia.fecha)} y coordinar con Tránsito los cortes de las avenidas que cruzan los arroyos.`,
      porQue: `${lluvia.maximoDia.milimetros} mm en un día es una lluvia que, como máximo del año, aparece cada ${lluvia.periodoRetornoAnios} años en Rosario.`,
    });
  }
  const mes = kpis.lluvia?.mes;
  const normal = kpis.lluvia?.mesNormalMm;
  if (mes && normal && mes.acumuladoMm >= normal * MONTH_SATURATION_RATIO) {
    out.push({
      id: "lluvia-saturacion",
      prioridad: "baja",
      titulo: "El suelo viene saturado",
      accion: "Tratar los umbrales de lluvia como más bajos de lo habitual: con el suelo cargado, la misma tormenta anega antes.",
      porQue: `Van ${mes.acumuladoMm.toFixed(0)} mm en el mes, el ${Math.round((mes.acumuladoMm / normal) * PERCENT)} % de un mes normal (${normal} mm).`,
    });
  }
  return out;
}

function reglasAnegamientos({ predicciones }: Insumos): Recomendacion[] {
  const anegamientos = predicciones.anegamientos;
  if (!anegamientos) {
    return [];
  }
  const top = anegamientos.porDistrito[0];
  if (anegamientos.esperadosCiudad >= EXPECTED_CASES_WEEK || (top && top.esperados >= EXPECTED_CASES_DISTRICT)) {
    return [
      {
        id: "anegamientos-guardias",
        prioridad: "media",
        titulo: `Reforzar las guardias de Defensa Civil${top ? ` en ${titulo(top.distrito)}` : ""}`,
        accion: "Sumar una cuadrilla de turno y dejar preparados los equipos de bombeo portátil para la semana.",
        porQue: `El modelo espera ${anegamientos.esperadosCiudad.toFixed(1)} anegamientos en ${anegamientos.ventanaDias} días${top ? `, ${top.esperados.toFixed(1)} en ${titulo(top.distrito)} (${Math.round(top.probabilidadAlMenosUno * PERCENT)} % de al menos uno)` : ""}, con ${anegamientos.lluvia.total} mm pronosticados.`,
      },
    ];
  }
  return [];
}

function reglasReportes({ kpis }: Insumos): Recomendacion[] {
  const reportes = kpis.reportes;
  const out: Recomendacion[] = [];
  const viviendas = reportes.porTipo.find((tipo) => tipo.tipo === "vivienda")?.cantidad ?? 0;
  const cortes = reportes.porTipo.find((tipo) => tipo.tipo === "corte")?.cantidad ?? 0;
  const distritoTop = reportes.porDistrito[0];
  if (viviendas > 0) {
    out.push({
      id: "reportes-viviendas",
      prioridad: "alta",
      titulo: "Vecinos reportan agua dentro de viviendas",
      accion: `Enviar una cuadrilla a verificar en terreno${distritoTop ? ` en ${titulo(distritoTop.distrito)}` : ""} y evaluar asistencia con bombas y colchones.`,
      porQue: `${viviendas} reporte${viviendas === 1 ? "" : "s"} de "${REPORT_TYPES.vivienda.etiqueta}" en las últimas 24 h. Son reportes sin verificar: son una señal, no un dato oficial.`,
    });
  }
  if (reportes.ultimas6h >= RECENT_REPORTS_ALERT) {
    out.push({
      id: "reportes-recientes",
      prioridad: "alta",
      titulo: "Están entrando reportes de agua ahora",
      accion: "Verificar en terreno y, si se confirma, publicar el estado de las calles afectadas en los canales oficiales.",
      porQue: `${reportes.ultimas6h} reportes en las últimas 6 h${distritoTop ? `, la mayoría en ${titulo(distritoTop.distrito)}` : ""}, con ${reportes.confirmaciones} confirmaciones de otros vecinos.`,
    });
  }
  if (cortes > 0) {
    out.push({
      id: "reportes-cortes",
      prioridad: "media",
      titulo: "Calles reportadas como cortadas",
      accion: "Coordinar con Tránsito los desvíos y avisar a las líneas de colectivos que pasan por esas cuadras.",
      porQue: `${cortes} reporte${cortes === 1 ? "" : "s"} de "${REPORT_TYPES.corte.etiqueta}" en las últimas 24 h.`,
    });
  }
  return out;
}

function reglasFuentes({ estado, kpis }: Insumos): Recomendacion[] {
  const fallas = [...estado.fallas, ...kpis.fallas.filter((falla) => !estado.fallas.some((otra) => otra.fuente === falla.fuente))];
  const ina = fallas.find((falla) => falla.fuente === "ina");
  if (!ina) {
    return [];
  }
  return [
    {
      id: "fuente-ina",
      prioridad: "baja",
      titulo: "El INA no responde",
      accion: "Confirmar la altura del río por Prefectura o por la escala de la Bolsa de Comercio hasta que el servicio vuelva; este panel reintenta cada 5 minutos.",
      porQue: `Sin respuesta desde las ${horaArgentina(ina.en)}. El nivel general se calcula sólo con la lluvia mientras tanto.`,
    },
  ];
}

function reglaCalma(insumos: Insumos, existentes: Recomendacion[]): Recomendacion[] {
  if (existentes.some((recomendacion) => recomendacion.prioridad !== "baja")) {
    return [];
  }
  const balance = insumos.kpis.lluvia?.balance;
  const margen = insumos.kpis.rio?.margenAlertaM;
  return [
    {
      id: "calma-preventivo",
      prioridad: "baja",
      titulo: "Sin urgencias: ventana para trabajo preventivo",
      accion: "Aprovechar para limpiar sumideros en Centro (el distrito que concentra los anegamientos), probar las bombas del Ludueña y actualizar el padrón de vecinos ribereños.",
      porQue: `${balance ? `${balance.prevista48h} mm previstos en 48 h` : "Sin lluvia fuerte prevista"}${margen !== null && margen !== undefined ? ` y ${margen.toFixed(2)} m de margen hasta la alerta del río` : ""}.`,
    },
  ];
}

export function buildRecomendaciones(insumos: Insumos): Recomendacion[] {
  const base = [...reglasRio(insumos), ...reglasLluvia(insumos), ...reglasAnegamientos(insumos), ...reglasReportes(insumos), ...reglasFuentes(insumos)];
  return [...base, ...reglaCalma(insumos, base)].sort((a, b) => PRIORITY_ORDER.indexOf(a.prioridad) - PRIORITY_ORDER.indexOf(b.prioridad));
}

export function buildParte({ estado, kpis, predicciones }: Insumos): ParteDeSituacion {
  const rio = kpis.rio;
  const estacion = estado.rio?.estacion;
  const balance = kpis.lluvia?.balance;
  const anegamientos = predicciones.anegamientos;
  const reportes = kpis.reportes;
  const enOnda = kpis.aguasArriba.filter((station) => !station.esRosario && station.tendencia.toLowerCase() === "crece").length;
  const frases: string[] = [];
  frases.push(`Parte de situación hídrica de Rosario, ${horaArgentina(new Date().toISOString())}. Nivel general: ${estado.riesgo.nivel === "normal" ? "sin riesgo" : estado.riesgo.nivel}.`);
  if (rio && estacion) {
    frases.push(
      `El Paraná mide ${rio.actual.toFixed(2)} m en la escala de Rosario (${rio.variacion24hCm !== null ? `${rio.variacion24hCm > 0 ? "+" : ""}${rio.variacion24hCm} cm en 24 h` : "sin variación diaria"}), a ${rio.margenAlertaM?.toFixed(2) ?? "—"} m del nivel de alerta del INA${rio.ritmoCmDia !== null && rio.ritmoCmDia > 0 && rio.diasHastaAlerta !== null ? `; al ritmo actual de ${rio.ritmoCmDia} cm/día la alcanzaría en ${rio.diasHastaAlerta} días` : ""}. Aguas arriba, ${enOnda} de ${kpis.aguasArriba.length - 1} estaciones están en crecida.`,
    );
  }
  if (balance) {
    const pico = estado.lluvia?.picoVentana;
    frases.push(`Llovieron ${balance.caido24h.toFixed(0)} mm en las últimas 24 h y se prevén ${balance.prevista48h.toFixed(0)} mm para las próximas 48 h${pico && pico.milimetros > 0 ? `, con un pico de ${pico.milimetros} mm en 2 h` : ""}.`);
  }
  if (anegamientos) {
    const top = anegamientos.porDistrito[0];
    frases.push(`Para los próximos ${anegamientos.ventanaDias} días el modelo espera ${anegamientos.esperadosCiudad.toFixed(1)} anegamientos atendidos por Defensa Civil${top ? `, la mayoría en ${titulo(top.distrito)}` : ""}.`);
  }
  frases.push(reportes.activos === 0 ? "No hay reportes de vecinos en las últimas 24 h." : `Hay ${reportes.activos} reporte${reportes.activos === 1 ? "" : "s"} de vecinos en las últimas 24 h, ${reportes.ultimas6h} en las últimas 6 h.`);
  const caidas = [...new Set([...estado.fallas, ...kpis.fallas].map((falla) => falla.fuente))];
  if (caidas.length) {
    frases.push(`Fuentes sin responder: ${caidas.join(", ")}.`);
  }
  return { texto: frases.join(" "), generadoEn: new Date().toISOString() };
}

export function evidenciaDePrioridad(prioridad: Prioridad): string {
  return prioridad === "alta" ? "var(--critico)" : prioridad === "media" ? "var(--atencion)" : "var(--ink-faint)";
}
