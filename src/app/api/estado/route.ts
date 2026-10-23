import { loadEstado } from "@/lib/estado";
import { DEMO_SCOPE } from "@/lib/demo";
import { activeSources } from "@/lib/sources";

export const dynamic = "force-dynamic";
export async function GET() {
  const estado = await loadEstado();
  return Response.json({ ...estado, alcance: DEMO_SCOPE, fuentes: activeSources() }, { status: estado.riesgo.sinDatos ? 503 : 200, headers: { "cache-control": "no-store" } });
}
