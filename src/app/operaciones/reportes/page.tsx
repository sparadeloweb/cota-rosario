import type { Metadata } from "next";
import { FloodMap } from "@/components/FloodMap";
import { PanelSection, ReportsSummary } from "@/components/panel/PanelBlocks";
import { LatestReports, ReportMix } from "@/components/panel/reports";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { Workspace } from "@/components/shell/Workspace";
import { SourceDown } from "@/components/SourceDown";
import { loadKpis } from "@/lib/kpis";
import { listReportsForRequest } from "@/lib/reports";
import { loadStatus } from "@/lib/status";
import { REPORT_TTL_HOURS, type Report } from "@/lib/reportTypes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reportes · Operaciones · Cota" };

async function recentReports(): Promise<Report[] | null> {
  try {
    return await listReportsForRequest();
  } catch (error: unknown) {
    console.warn("Latest reports unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

export default async function ReportsPage() {
  const [status, kpis, list] = await Promise.all([loadStatus(), loadKpis(), recentReports()]);
  const { risk } = status;
  const reports = kpis.reports;
  const homes = reports?.byType.find((type) => type.type === "home")?.count ?? null;

  const figures: HeroFigure[] = reports
    ? [
        { label: `Activos · ${REPORT_TTL_HOURS} h`, value: reports.active, detail: "cargados por vecinos" },
        { label: "Últimas 6 h", value: reports.last6h, detail: "lo más reciente" },
        { label: "Agua en viviendas", value: homes, tone: homes ? "critical" : "neutral", detail: "el tipo más grave" },
        { label: "Confirmaciones", value: reports.confirmations, detail: "otros vecinos que lo vieron" },
      ]
    : [];

  return (

      <Workspace
        canvas={<FloodMap zones={risk.zones} reports />}
        rail={
          <div className="flex flex-col">
            <SectionHero pattern="reports" meta={`Vecinos · últimas ${REPORT_TTL_HOURS} h`} title="Reportes" figures={figures}>
              Lo que cargaron los vecinos, por tipo y por distrito. Son señales para verificar: su ausencia no descarta agua en una zona.
            </SectionHero>
            <PanelSection title="Qué y dónde">
              {reports ? reports.active ? <ReportMix reports={reports} /> : <ReportsSummary reports={reports} /> : <SourceDown failure={kpis.failures.find((failure) => failure.source === "reports")} />}
            </PanelSection>
            {list?.length ? (
              <PanelSection title="Los últimos">
                <LatestReports reports={list} />
              </PanelSection>
            ) : null}
            <p className="hairline px-5 py-5 text-xs leading-relaxed text-ink-faint sm:px-6">Desde el panel los reportes son de sólo lectura. Los vecinos los cargan desde la pestaña Reportar o el mapa. Datos en <span className="readout">/api/reports</span>.</p>
          </div>
        }
      />
  );
}
