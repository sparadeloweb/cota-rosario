import { confirmReport, ReportError } from "@/lib/reports";

export const dynamic = "force-dynamic";

const ID_PATTERN = /^[0-9a-f-]{36}$/;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ID_PATTERN.test(id)) {
    return Response.json({ ok: false, error: "Identificador inválido." }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  try {
    const reporte = await confirmReport(id, ip);
    return Response.json({ ok: true, reporte });
  } catch (error: unknown) {
    if (error instanceof ReportError) {
      return Response.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("Error al confirmar reporte:", error);
    return Response.json({ ok: false, error: "No se pudo confirmar." }, { status: 500 });
  }
}
