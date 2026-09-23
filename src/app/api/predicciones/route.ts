import { loadPredicciones } from "@/lib/predicciones";

export const dynamic = "force-dynamic";

const STATUS_PARTIAL = 206;
const STATUS_UNAVAILABLE = 503;

export async function GET() {
  const predicciones = await loadPredicciones();
  const sinNada = predicciones.anegamientos === null && predicciones.lluvia === null && predicciones.rio === null;
  const status = sinNada ? STATUS_UNAVAILABLE : predicciones.fallas.length > 0 ? STATUS_PARTIAL : 200;
  return Response.json(predicciones, { status, headers: { "cache-control": "public, max-age=300" } });
}
