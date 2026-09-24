import { createReport, listReports, ReportError, REPORT_TTL_HOURS, type NewReportInput } from "@/lib/reports";

export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function errorResponse(error: unknown): Response {
  if (error instanceof ReportError) {
    return Response.json({ ok: false, error: error.message }, { status: error.status });
  }
  console.error("Error en /api/reportes:", error);
  return Response.json({ ok: false, error: "No se pudo procesar el reporte." }, { status: 500 });
}

export async function GET() {
  try {
    const reportes = await listReports();
    return Response.json({ ok: true, ventanaHoras: REPORT_TTL_HOURS, reportes }, { headers: { "cache-control": "no-store" } });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as NewReportInput | null;
    if (!body || typeof body !== "object") {
      return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
    }
    const reporte = await createReport(body, clientIp(request));
    return Response.json({ ok: true, reporte }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
