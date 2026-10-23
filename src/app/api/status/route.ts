import { loadStatus } from "@/lib/status";
import { DEMO_SCOPE } from "@/lib/demo";
import { activeSources } from "@/lib/sources";

export const dynamic = "force-dynamic";
export async function GET() {
  const status = await loadStatus();
  return Response.json({ ...status, scope: DEMO_SCOPE, sources: activeSources() }, { status: status.risk.noData ? 503 : 200, headers: { "cache-control": "no-store" } });
}
