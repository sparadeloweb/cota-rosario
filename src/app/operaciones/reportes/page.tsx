import type { Metadata } from "next";
import { FloodMap } from "@/components/FloodMap";
import { PanelSection, ReportesResumen } from "@/components/panel/PanelBlocks";
import { LatestReports, ReportMix } from "@/components/panel/reports";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { PanelShell } from "@/components/shell/PanelShell";
import { Workspace } from "@/components/shell/Workspace";
import { SourceDown } from "@/components/SourceDown";
import { loadPanel } from "@/lib/panelData";
import { listReports } from "@/lib/reports";
import { REPORT_TTL_HOURS, type Report } from "@/lib/reportTypes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reportes · Operaciones · Cota" };

async function reportesRecientes(): Promise<Report[] | null> {
  try {
    return await listReports();
  } catch {
    return null;
  }
}

export default async function ReportesPage() {
  const [{ estado, kpis }, lista] = await Promise.all([loadPanel(), reportesRecientes()]);
  const { riesgo } = estado;
  const reportes = kpis.reportes;
  const viviendas = reportes?.porTipo.find((tipo) => tipo.tipo === "vivienda")?.cantidad ?? null;

  const cifras: HeroFigure[] = reportes
    ? [
        { etiqueta: `Activos · ${REPORT_TTL_HOURS} h`, valor: reportes.activos, detalle: "cargados por vecinos" },
        { etiqueta: "Últimas 6 h", valor: reportes.ultimas6h, detalle: "lo más reciente" },
        { etiqueta: "Agua en viviendas", valor: viviendas, tono: viviendas ? "critico" : "neutro", detalle: "el tipo más grave" },
        { etiqueta: "Confirmaciones", valor: reportes.confirmaciones, detalle: "otros vecinos que lo vieron" },
      ]
    : [];

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <Workspace
        lienzo={<FloodMap zonas={riesgo.zonas} reportes />}
        rail={
          <div className="flex flex-col">
            <SectionHero patron="reportes" meta={`Vecinos · últimas ${REPORT_TTL_HOURS} h`} titulo="Reportes" cifras={cifras}>
              Lo que cargaron los vecinos, por tipo y por distrito. Son señales para verificar: su ausencia no descarta agua en una zona.
            </SectionHero>
            <PanelSection titulo="Qué y dónde">
              {reportes ? reportes.activos ? <ReportMix reportes={reportes} /> : <ReportesResumen reportes={reportes} /> : <SourceDown falla={kpis.fallas.find((falla) => falla.fuente === "reportes")} />}
            </PanelSection>
            {lista?.length ? (
              <PanelSection titulo="Los últimos">
                <LatestReports reportes={lista} />
              </PanelSection>
            ) : null}
            <p className="hairline px-5 py-5 text-xs leading-relaxed text-ink-faint sm:px-6">Desde el panel los reportes son de sólo lectura. Los vecinos los cargan desde la pestaña Reportar o el mapa. Datos en <span className="readout">/api/reportes</span>.</p>
          </div>
        }
      />
    </PanelShell>
  );
}
