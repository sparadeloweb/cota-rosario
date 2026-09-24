import { loadEstado } from "@/lib/estado";
import { loadKpis } from "@/lib/kpis";
import { loadPredicciones } from "@/lib/predicciones";
import { buildParte, buildRecomendaciones } from "@/lib/recomendaciones";

export const dynamic = "force-dynamic";

export async function GET() {
  const [estado, kpis, predicciones] = await Promise.all([loadEstado(), loadKpis(), loadPredicciones()]);
  const insumos = { estado, kpis, predicciones };
  return Response.json(
    { recomendaciones: buildRecomendaciones(insumos), parte: buildParte(insumos), generadoEn: new Date().toISOString() },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
