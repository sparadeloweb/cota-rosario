import { loadStatus } from "@/lib/status";
import { loadKpis } from "@/lib/kpis";
import { loadPredictions } from "@/lib/predictions";
import { buildSituationReport, buildRecommendations } from "@/lib/recommendations";
import { DEMO_SCOPE } from "@/lib/demo";

export const dynamic = "force-dynamic";
export async function GET() {
  const statusPromise = loadStatus();
  const [status, kpis, predictions] = await Promise.all([statusPromise, loadKpis(statusPromise), loadPredictions(statusPromise)]);
  const inputs = { status, kpis, predictions };
  return Response.json({ recommendations: buildRecommendations(inputs), situationReport: buildSituationReport(inputs), generatedAt: new Date().toISOString(), incomplete: status.risk.incomplete || kpis.failures.length > 0 || predictions.failures.length > 0, scope: DEMO_SCOPE }, { status: status.risk.noData ? 503 : 200, headers: { "cache-control": "no-store" } });
}
