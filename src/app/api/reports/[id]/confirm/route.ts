import { confirmReport, ReportError } from "@/lib/reports";
import { clientIp } from "@/lib/requestGuard";

export const dynamic = "force-dynamic";

const ID_PATTERN = /^[0-9a-f-]{36}$/;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ID_PATTERN.test(id)) {
    return Response.json({ ok: false, error: "Identificador inválido." }, { status: 400 });
  }
  const ip = clientIp(request.headers);
  try {
    const report = await confirmReport(id, ip);
    return Response.json({ ok: true, report });
  } catch (error: unknown) {
    if (error instanceof ReportError) {
      return Response.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("Failed to confirm report:", error);
    return Response.json({ ok: false, error: "No se pudo confirmar." }, { status: 500 });
  }
}
