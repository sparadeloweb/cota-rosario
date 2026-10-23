import { loadKpis } from "@/lib/kpis";
import { DEMO_SCOPE } from "@/lib/demo";

export const dynamic = "force-dynamic";
export async function GET() {
  const kpis = await loadKpis();
  const noData = !kpis.river && !kpis.rain && !kpis.reports;
  return Response.json({ ...kpis, incomplete: kpis.failures.length > 0, scope: DEMO_SCOPE }, { status: noData ? 503 : 200, headers: { "cache-control": "no-store" } });
}
