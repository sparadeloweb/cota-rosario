import { loadKpis } from "@/lib/kpis";

export const dynamic = "force-dynamic";

const STATUS_PARTIAL = 206;

export async function GET() {
  const kpis = await loadKpis();
  return Response.json(kpis, { status: kpis.fallas.length > 0 ? STATUS_PARTIAL : 200, headers: { "cache-control": "public, max-age=300" } });
}
