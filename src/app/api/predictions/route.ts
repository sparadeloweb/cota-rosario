import { loadPredictions } from "@/lib/predictions";
import { DEMO_SCOPE } from "@/lib/demo";

export const dynamic = "force-dynamic";
export async function GET() {
  const predictions = await loadPredictions();
  const noData = !predictions.flooding && !predictions.rain && !predictions.river;
  return Response.json({ ...predictions, incomplete: predictions.failures.length > 0, scope: DEMO_SCOPE }, { status: noData ? 503 : 200, headers: { "cache-control": "no-store" } });
}
