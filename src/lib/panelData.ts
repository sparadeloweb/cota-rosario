import { loadEstado } from "@/lib/estado";
import { loadKpis } from "@/lib/kpis";
import { loadPredicciones } from "@/lib/predicciones";
import { buildParte, buildRecomendaciones } from "@/lib/recomendaciones";

export async function loadPanel() {
  const estadoPromise = loadEstado();
  const [estado, kpis, predicciones] = await Promise.all([estadoPromise, loadKpis(estadoPromise), loadPredicciones(estadoPromise)]);
  const fallaDe = (fuente: string) => estado.fallas.find((falla) => falla.fuente === fuente);
  return {
    estado,
    kpis,
    predicciones,
    recomendaciones: buildRecomendaciones({ estado, kpis, predicciones }),
    parte: buildParte({ estado, kpis, predicciones }),
    fallaDe,
  };
}

export type PanelData = Awaited<ReturnType<typeof loadPanel>>;
