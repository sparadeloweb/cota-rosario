import { formatoDistancia, type CategoriaClima, type Hallazgo, type TerrainMeta } from "@/lib/lookup";
import type { RiskLevel } from "@/lib/risk";

export type FactKey = "oficial" | "clima" | "relieve" | "historial";
export type FactTone = "neutro" | "atencion" | "alerta" | "critico";

export interface PlaceFact {
  clave: FactKey;
  titulo: string;
  veredicto: string;
  tono: FactTone;
  detalle: string;
}

const CLIMA_TONE: Record<CategoriaClima, FactTone> = { "muy bajo": "neutro", bajo: "neutro", medio: "atencion", alto: "alerta" };
const LEVEL_TONE: Record<RiskLevel, FactTone> = { normal: "atencion", atencion: "atencion", alerta: "alerta", critico: "critico" };
const TERRAIN_DECIMALS = 1;

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function hechoOficial(hallazgo: Hallazgo): PlaceFact {
  if (hallazgo.dentro) {
    return {
      clave: "oficial",
      titulo: "Mapa oficial",
      veredicto: `Zona ${hallazgo.zona ?? "—"}`,
      tono: hallazgo.nivel ? LEVEL_TONE[hallazgo.nivel] : "atencion",
      detalle: "Dentro del área inundable del Ludueña o el Saladillo.",
    };
  }
  return {
    clave: "oficial",
    titulo: "Mapa oficial",
    veredicto: "Fuera",
    tono: "neutro",
    detalle: hallazgo.cercano ? `Zona oficial más cercana: ${hallazgo.cercano.zona}, a ${formatoDistancia(hallazgo.cercano.metros)}.` : "Lejos de las áreas inundables oficiales.",
  };
}

function hechoRelieve(terreno: NonNullable<Hallazgo["terreno"]>, meta: TerrainMeta | null): PlaceFact {
  const ventana = meta ? ` en ${meta.ventanaMetros} m a la redonda` : "";
  if (terreno.estado === "bajo") {
    const metros = meta && terreno.metros >= meta.escalaMaximaMetros ? `más de ${meta.escalaMaximaMetros} m` : `${terreno.metros.toFixed(TERRAIN_DECIMALS)} m`;
    return { clave: "relieve", titulo: "Relieve", veredicto: `${metros} abajo`, tono: "atencion", detalle: `Más bajo que la mediana del entorno${ventana}: ahí el agua tiende a juntarse.` };
  }
  if (terreno.estado === "plano") {
    return { clave: "relieve", titulo: "Relieve", veredicto: "No es un bajo", tono: "neutro", detalle: `A la altura de su entorno${ventana}.` };
  }
  return { clave: "relieve", titulo: "Relieve", veredicto: "Sin lectura", tono: "neutro", detalle: "En manzanas densas el modelo de terreno no aporta una lectura." };
}

export function hechosDelLugar(hallazgo: Hallazgo, meta: TerrainMeta | null): PlaceFact[] {
  const hechos: (PlaceFact | null)[] = [
    hechoOficial(hallazgo),
    hallazgo.clima
      ? { clave: "clima", titulo: "Lluvias torrenciales", veredicto: capitalizar(hallazgo.clima), tono: CLIMA_TONE[hallazgo.clima], detalle: "Mapa municipal de riesgo climático 2024." }
      : null,
    hallazgo.terreno ? hechoRelieve(hallazgo.terreno, meta) : null,
    hallazgo.distrito
      ? {
          clave: "historial",
          titulo: "Historial del distrito",
          veredicto: `${hallazgo.distrito.participacion} %`,
          tono: "neutro",
          detalle: `de las intervenciones por anegamientos registradas 2021–2024${hallazgo.distrito.mesPico ? `; su peor mes tuvo ${hallazgo.distrito.mesPico.casos} casos` : ""}. No es el riesgo de esta dirección.`,
        }
      : null,
  ];
  return hechos.filter((hecho): hecho is PlaceFact => hecho !== null);
}
