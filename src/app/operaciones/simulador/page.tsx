import type { Metadata } from "next";
import { Docs, DocsSection } from "@/components/Docs";
import { FloodMap } from "@/components/FloodMap";
import { PanelSection } from "@/components/panel/PanelBlocks";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { Workspace } from "@/components/shell/Workspace";
import { SimulationProvider } from "@/components/SimulationContext";
import { Simulator } from "@/components/Simulator";
import { loadStatus } from "@/lib/status";
import { hasUsableThresholds } from "@/lib/risk";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Simulador · Operaciones · Cota" };

export default async function SimulatorPage() {
  const { risk, river, rain } = await loadStatus();
  const figures: HeroFigure[] = [
    { label: "Punto de partida · río", value: river?.station.meters ?? null, decimals: 2, unit: "m", detail: river?.station.alert ? `alerta en ${river.station.alert.toFixed(2)} m` : "sin umbral de alerta" },
    { label: "Punto de partida · lluvia", value: rain?.peakWindow?.millimeters ?? null, decimals: 1, unit: "mm / 2 h", detail: "el pico de la consulta actual" },
  ];

  return (
    <SimulationProvider>
      <Workspace
        canvas={<FloodMap zones={risk.zones} />}
        rail={
          <div className="flex flex-col">
            <SectionHero pattern="simulator" meta="Escenarios · no altera datos reales" title="Simulador" figures={figures}>
              Mové la altura del río y la lluvia para ver cómo cambian el nivel y las zonas en el mapa. Restablecer vuelve a la consulta.
            </SectionHero>
            <PanelSection title="Escenario">
              {river && rain?.peakWindow && hasUsableThresholds(river.station) ? (
                <Simulator
                  currentMeters={river.station.meters}
                  alert={river.station.alert!}
                  evacuation={river.station.evacuation !== null && river.station.evacuation > 0 ? river.station.evacuation : null}
                  currentPeakMm={rain.peakWindow.millimeters}
                />
              ) : (
                <p className="text-xs leading-relaxed text-ink-soft">El simulador necesita altura, umbral de alerta y lluvia utilizables de las fuentes para iniciar el escenario.</p>
              )}
            </PanelSection>
            <Docs>
              <DocsSection title="El simulador">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Usa exactamente el mismo modelo que la vista pública: mover los controles pinta el mapa con el escenario, no altera ningún dato real ni queda guardado.
                </p>
              </DocsSection>
            </Docs>
          </div>
        }
      />
    </SimulationProvider>
  );
}
