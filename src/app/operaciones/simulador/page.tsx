import type { Metadata } from "next";
import { Docs, DocsSection } from "@/components/Docs";
import { FloodMap } from "@/components/FloodMap";
import { PanelSection } from "@/components/panel/PanelBlocks";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { PanelShell } from "@/components/shell/PanelShell";
import { Workspace } from "@/components/shell/Workspace";
import { SimulationProvider } from "@/components/SimulationContext";
import { Simulator } from "@/components/Simulator";
import { loadEstado } from "@/lib/estado";
import { hasUsableThresholds } from "@/lib/risk";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Simulador · Operaciones · Cota" };

export default async function SimuladorPage() {
  const { riesgo, rio, lluvia } = await loadEstado();
  const cifras: HeroFigure[] = [
    { etiqueta: "Punto de partida · río", valor: rio?.estacion.metros ?? null, decimales: 2, unidad: "m", detalle: rio?.estacion.alerta ? `alerta en ${rio.estacion.alerta.toFixed(2)} m` : "sin umbral de alerta" },
    { etiqueta: "Punto de partida · lluvia", valor: lluvia?.picoVentana?.milimetros ?? null, decimales: 1, unidad: "mm / 2 h", detalle: "el pico de la consulta actual" },
  ];

  return (
    <SimulationProvider>
      <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
        <Workspace
          lienzo={<FloodMap zonas={riesgo.zonas} />}
          rail={
            <div className="flex flex-col">
              <SectionHero patron="simulador" meta="Escenarios · no altera datos reales" titulo="Simulador" cifras={cifras}>
                Mové la altura del río y la lluvia para ver cómo cambian el nivel y las zonas en el mapa. Restablecer vuelve a la consulta.
              </SectionHero>
              <PanelSection titulo="Escenario">
                {rio && lluvia?.picoVentana && hasUsableThresholds(rio.estacion) ? (
                  <Simulator
                    metrosActuales={rio.estacion.metros}
                    alerta={rio.estacion.alerta!}
                    evacuacion={rio.estacion.evacuacion !== null && rio.estacion.evacuacion > 0 ? rio.estacion.evacuacion : null}
                    picoActualMm={lluvia.picoVentana.milimetros}
                  />
                ) : (
                  <p className="text-xs leading-relaxed text-ink-soft">El simulador necesita altura, umbral de alerta y lluvia utilizables de las fuentes para iniciar el escenario.</p>
                )}
              </PanelSection>
              <Docs>
                <DocsSection titulo="El simulador">
                  <p className="text-xs leading-relaxed text-ink-soft">
                    Usa exactamente el mismo modelo que la vista pública: mover los controles pinta el mapa con el escenario, no altera ningún dato real ni queda guardado.
                  </p>
                </DocsSection>
              </Docs>
            </div>
          }
        />
      </PanelShell>
    </SimulationProvider>
  );
}
