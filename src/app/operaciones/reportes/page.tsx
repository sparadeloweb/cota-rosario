import type { Metadata } from "next";
import { FloodMap } from "@/components/FloodMap";
import { KpiGrid } from "@/components/kpis/KpiGrid";
import { PanelHeader, PanelSection, ReportesResumen } from "@/components/panel/PanelBlocks";
import { tilesRedYReportes } from "@/components/panel/tiles";
import { PanelShell } from "@/components/shell/PanelShell";
import { Workspace } from "@/components/shell/Workspace";
import { loadPanel } from "@/lib/panelData";
import { REPORT_TTL_HOURS } from "@/lib/reportTypes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reportes · Operaciones · Cota" };

export default async function ReportesPage() {
  const { estado, kpis } = await loadPanel();
  const { riesgo } = estado;
  const reportes = tilesRedYReportes(kpis).filter((tile) => tile.etiqueta === "Reportes de vecinos");

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <Workspace
        lienzo={<FloodMap zonas={riesgo.zonas} reportes />}
        rail={
          <div className="flex flex-col">
            <PanelHeader meta={`Vecinos · últimas ${REPORT_TTL_HOURS} h`} titulo="Reportes">
              Lo que cargaron los vecinos, por tipo y por distrito. Son señales para verificar: su ausencia no descarta agua en una zona.
            </PanelHeader>
            <PanelSection titulo="En las últimas 24 h">
              <KpiGrid tiles={reportes} />
            </PanelSection>
            <PanelSection titulo="Por tipo y por distrito">
              <ReportesResumen reportes={kpis.reportes} />
            </PanelSection>
            <p className="hairline px-5 py-5 text-xs leading-relaxed text-ink-faint sm:px-6">Desde el panel los reportes son de sólo lectura. Los vecinos los cargan desde la pestaña Reportar o el mapa. Datos en <span className="readout">/api/reportes</span>.</p>
          </div>
        }
      />
    </PanelShell>
  );
}
