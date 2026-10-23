import type { Metadata } from "next";
import { Docs, DocsSection } from "@/components/Docs";
import { UpstreamStrip } from "@/components/kpis/UpstreamStrip";
import { KpiGrid } from "@/components/kpis/KpiGrid";
import { Sparkline } from "@/components/kpis/Sparkline";
import { CaudalBlock, PanelHeader, PanelPage, PanelSection } from "@/components/panel/PanelBlocks";
import { tilesRio } from "@/components/panel/tiles";
import { Provenance } from "@/components/Provenance";
import { RiverGauge } from "@/components/RiverGauge";
import { PanelShell } from "@/components/shell/PanelShell";
import { SourceDown } from "@/components/SourceDown";
import { StationTable } from "@/components/StationTable";
import { loadPanel } from "@/lib/panelData";
import { PARANA_GLOFAS_CELL } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Río · Operaciones · Cota" };

export default async function RioPage() {
  const { estado, kpis, fallaDe } = await loadPanel();
  const { riesgo, rio, caudal } = estado;

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <PanelPage>
        <PanelHeader meta="Paraná · INA y GloFAS" titulo="Río">
          Altura en Rosario contra los umbrales del INA, la cadena aguas arriba, el caudal estimado y la red hidrométrica completa.
        </PanelHeader>

        <div className="grid lg:grid-cols-2">
          <PanelSection titulo="Estación Rosario">{rio ? <RiverGauge rio={rio} /> : <SourceDown falla={fallaDe("ina")} />}</PanelSection>
          <PanelSection titulo="Caudal del Paraná" className="lg:border-l lg:border-rule-soft">
            <CaudalBlock caudal={caudal} falla={fallaDe("glofas")} />
          </PanelSection>
        </div>

        {kpis.rio ? (
          <PanelSection titulo="Indicadores del río">
            <KpiGrid tiles={tilesRio(kpis)}>
              <div className="flex flex-col gap-1">
                <Sparkline valores={kpis.rio.sparkline.map((lectura) => lectura.metros)} />
                <span className="meta">altura del río, últimos 60 días</span>
              </div>
            </KpiGrid>
          </PanelSection>
        ) : null}

        {kpis.aguasArriba.length ? (
          <PanelSection titulo="Cadena del Paraná" nota="Lecturas recientes y margen en metros respecto al umbral de cada estación. Una subida aguas arriba no determina por sí sola qué pasará en Rosario.">
            <UpstreamStrip estaciones={kpis.aguasArriba} />
          </PanelSection>
        ) : null}

        <PanelSection titulo="Red hidrométrica del INA">{rio ? <StationTable estaciones={rio.red} /> : <SourceDown falla={fallaDe("ina")} />}</PanelSection>

        <Docs>
          <DocsSection titulo="El caudal">
            <p className="text-xs leading-relaxed text-ink-soft">
              Es una estimación de GloFAS (Copernicus) para la celda del canal del Paraná frente a Rosario ({PARANA_GLOFAS_CELL.lat}, {PARANA_GLOFAS_CELL.lon}), expresada en metros cúbicos por segundo. No es una medición.
            </p>
          </DocsSection>
          <DocsSection titulo="Fuentes y última consulta">
            <Provenance
              sellos={[
                { id: "ina", consultadoEn: rio?.consultadoEn, falla: fallaDe("ina") },
                { id: "glofas", consultadoEn: caudal?.consultadoEn, falla: fallaDe("glofas") },
              ]}
            />
          </DocsSection>
        </Docs>
      </PanelPage>
    </PanelShell>
  );
}
