import type { Metadata } from "next";
import { Docs, DocsSection } from "@/components/Docs";
import { KpiGrid } from "@/components/kpis/KpiGrid";
import { RainBalanceBars } from "@/components/kpis/RainBalanceBars";
import { PanelHeader, PanelPage, PanelSection } from "@/components/panel/PanelBlocks";
import { tilesLluvia } from "@/components/panel/tiles";
import { Provenance } from "@/components/Provenance";
import { RainOutlook } from "@/components/RainOutlook";
import { RainStrip } from "@/components/RainStrip";
import { PanelShell } from "@/components/shell/PanelShell";
import { SourceDown } from "@/components/SourceDown";
import { loadPanel } from "@/lib/panelData";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lluvia · Operaciones · Cota" };

export default async function LluviaPage() {
  const { estado, kpis, predicciones, fallaDe } = await loadPanel();
  const { riesgo, lluvia } = estado;

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <PanelPage>
        <PanelHeader meta="Open-Meteo · modelo, no pluviómetro" titulo="Lluvia">
          Lo que cayó, lo que se espera en las próximas horas y en la semana, y cómo viene el mes contra su referencia histórica.
        </PanelHeader>

        {kpis.lluvia ? (
          <PanelSection titulo="Indicadores de lluvia">
            <KpiGrid tiles={tilesLluvia(kpis)} />
          </PanelSection>
        ) : null}

        <div className="grid lg:grid-cols-2">
          <PanelSection titulo="Próximas horas">{lluvia ? <RainStrip lluvia={lluvia} /> : <SourceDown falla={fallaDe("openMeteo")} />}</PanelSection>
          <PanelSection titulo="Lluvia caída y prevista" className="lg:border-l lg:border-rule-soft">
            {kpis.lluvia ? (
              <>
                <RainBalanceBars balance={kpis.lluvia.balance} />
                <p className="meta mt-3">lleno: caída · tenue: prevista · seis días alrededor de hoy</p>
              </>
            ) : (
              <SourceDown falla={fallaDe("openMeteo")} />
            )}
          </PanelSection>
        </div>

        <PanelSection titulo="Próximos 7 días">{predicciones.lluvia ? <RainOutlook lluvia={predicciones.lluvia} /> : <SourceDown falla={fallaDe("openMeteo")} />}</PanelSection>

        <Docs>
          <DocsSection titulo="De dónde sale la lluvia">
            <p className="text-xs leading-relaxed text-ink-soft">
              Pronóstico y horas pasadas del modelo de Open-Meteo para Rosario; el mes en curso, del archivo de Open-Meteo con su fecha de cobertura. No son lecturas de un pluviómetro de la ciudad.
            </p>
            <Provenance sellos={[{ id: "openMeteo", consultadoEn: lluvia?.consultadoEn, falla: fallaDe("openMeteo") }]} />
          </DocsSection>
        </Docs>
      </PanelPage>
    </PanelShell>
  );
}
