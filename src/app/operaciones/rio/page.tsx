import type { Metadata } from "next";
import { Docs, DocsSection } from "@/components/Docs";
import { LineArea, type ChartThreshold } from "@/components/panel/charts";
import { PanelPage, PanelSection } from "@/components/panel/PanelBlocks";
import { LevelRuler, UpstreamChain } from "@/components/panel/river";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { Provenance } from "@/components/Provenance";
import { PanelShell } from "@/components/shell/PanelShell";
import { SourceDown } from "@/components/SourceDown";
import { StationTable } from "@/components/StationTable";
import { loadPanel } from "@/lib/panelData";
import { PARANA_GLOFAS_CELL } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Río · Operaciones · Cota" };

const MARGIN_WARNING_M = 0.5;
const WEEK_DAYS = 7;

export default async function RiverPage() {
  const { status, kpis, predictions, failureOf } = await loadPanel();
  const { risk, river, discharge } = status;
  const indicators = kpis.river;
  const history = predictions.river?.history ?? indicators?.sparkline ?? [];
  const thresholds: ChartThreshold[] = river
    ? [
        { value: river.station.alert ?? 0, label: "alerta", color: "var(--alert)" },
        { value: river.station.evacuation ?? 0, label: "evacuación", color: "var(--critical)" },
      ]
    : [];
  const dischargeSeries = discharge ? [...discharge.past, ...discharge.days].map((day) => ({ date: day.date, value: day.discharge })) : [];
  const margin = indicators?.alertMarginM ?? null;

  const figures: HeroFigure[] = indicators
    ? [
        { label: "Altura ahora", value: indicators.current, decimals: 2, unit: "m", detail: `escala de Rosario · ${river?.station.trend ?? "sin tendencia"}` },
        { label: "Margen a alerta", value: margin, decimals: 2, unit: "m", tone: margin !== null && margin <= MARGIN_WARNING_M ? "watch" : "neutral", detail: indicators.daysToAlert === null ? "no la alcanza al ritmo actual" : `a ${indicators.daysToAlert} días si sigue el ritmo${indicators.daysToAlert > WEEK_DAYS ? " · fuera de la semana" : ""}` },
        { label: "Variación 7 días", value: indicators.change7dCm, prefix: indicators.change7dCm !== null && indicators.change7dCm > 0 ? "+" : undefined, unit: "cm", detail: `${indicators.change24hCm === null ? "—" : `${indicators.change24hCm > 0 ? "+" : ""}${indicators.change24hCm} cm`} en 24 h` },
        { label: "Frente a 210 días", value: indicators.percentile210, prefix: "p", detail: `entre ${indicators.min210.meters.toFixed(2)} y ${indicators.max210.meters.toFixed(2)} m` },
        { label: "Caudal GloFAS", value: discharge?.current ?? null, unit: "m³/s", detail: "modelo, no medición" },
      ]
    : [];

  return (
    <PanelShell level={risk.level} updatedAt={risk.assessedAt}>
      <PanelPage>
        <SectionHero pattern="river" meta="Paraná · INA y GloFAS" title="Río" figures={figures}>
          La altura en Rosario contra los umbrales oficiales del INA, cómo viene el río en los últimos meses y qué pasa aguas arriba.
        </SectionHero>

        {river ? (
          <div className="grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <PanelSection title="Estación Rosario">
              <LevelRuler station={river.station} range={indicators ? { min: indicators.min210.meters, max: indicators.max210.meters } : null} />
            </PanelSection>
            <PanelSection title={`Altura diaria · últimos ${history.length} días`} className="lg:border-l lg:border-rule-soft" note="Una lectura diaria del INA. Las líneas punteadas son los umbrales oficiales de la estación.">
              <LineArea points={history.map((reading) => ({ date: reading.date, value: reading.meters }))} thresholds={thresholds} unit="m" height={280} />
            </PanelSection>
          </div>
        ) : (
          <PanelSection title="Estación Rosario">
            <SourceDown failure={failureOf("ina")} />
          </PanelSection>
        )}

        <div className="grid lg:grid-cols-2">
          <PanelSection title="Cadena del Paraná" note="Una subida aguas arriba no determina por sí sola qué pasará en Rosario: usala para anticipar, no para predecir.">
            {kpis.upstream.length ? <UpstreamChain stations={kpis.upstream} /> : <SourceDown failure={failureOf("ina")} />}
          </PanelSection>
          <PanelSection title="Caudal frente a Rosario" className="lg:border-l lg:border-rule-soft" note={`Estimación de GloFAS (Copernicus) para la celda del canal (${PARANA_GLOFAS_CELL.lat}, ${PARANA_GLOFAS_CELL.lon}). La línea punteada es su pronóstico.`}>
            {discharge && dischargeSeries.length > 1 ? <LineArea points={dischargeSeries} unit="m³/s" decimals={0} futureFrom={discharge.past.length} height={220} /> : <SourceDown failure={failureOf("glofas")} />}
          </PanelSection>
        </div>

        <PanelSection title="Red hidrométrica del INA">{river ? <StationTable stations={river.network} /> : <SourceDown failure={failureOf("ina")} />}</PanelSection>

        <Docs>
          <DocsSection title="Cómo leer esta sección">
            <p className="text-xs leading-relaxed text-ink-soft">
              La regla usa la escala del hidrómetro de Rosario, no metros sobre el nivel del mar. Margen = alerta − altura. El ritmo es una recta de mínimos cuadrados sobre los últimos 14 días; extrapolarlo no es un pronóstico. El percentil compara la altura de hoy con los últimos 210 días. El caudal de GloFAS es un modelo: su relación con la altura de Rosario es débil.
            </p>
          </DocsSection>
          <DocsSection title="Fuentes y última consulta">
            <Provenance
              stamps={[
                { id: "ina", fetchedAt: river?.fetchedAt, failure: failureOf("ina") },
                { id: "glofas", fetchedAt: discharge?.fetchedAt, failure: failureOf("glofas") },
              ]}
            />
          </DocsSection>
        </Docs>
      </PanelPage>
    </PanelShell>
  );
}
