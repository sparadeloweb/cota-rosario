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

export default async function RioPage() {
  const { estado, kpis, predicciones, fallaDe } = await loadPanel();
  const { riesgo, rio, caudal } = estado;
  const indicadores = kpis.rio;
  const historia = predicciones.rio?.historia ?? indicadores?.sparkline ?? [];
  const umbrales: ChartThreshold[] = rio
    ? [
        { valor: rio.estacion.alerta ?? 0, etiqueta: "alerta", color: "var(--alerta)" },
        { valor: rio.estacion.evacuacion ?? 0, etiqueta: "evacuación", color: "var(--critico)" },
      ]
    : [];
  const caudalSerie = caudal ? [...caudal.pasado, ...caudal.dias].map((dia) => ({ fecha: dia.fecha, valor: dia.caudal })) : [];
  const margen = indicadores?.margenAlertaM ?? null;

  const cifras: HeroFigure[] = indicadores
    ? [
        { etiqueta: "Altura ahora", valor: indicadores.actual, decimales: 2, unidad: "m", detalle: `escala de Rosario · ${rio?.estacion.tendencia ?? "sin tendencia"}` },
        { etiqueta: "Margen a alerta", valor: margen, decimales: 2, unidad: "m", tono: margen !== null && margen <= MARGIN_WARNING_M ? "atencion" : "neutro", detalle: indicadores.diasHastaAlerta === null ? "no la alcanza al ritmo actual" : `a ${indicadores.diasHastaAlerta} días si sigue el ritmo${indicadores.diasHastaAlerta > WEEK_DAYS ? " · fuera de la semana" : ""}` },
        { etiqueta: "Variación 7 días", valor: indicadores.variacion7dCm, prefijo: indicadores.variacion7dCm !== null && indicadores.variacion7dCm > 0 ? "+" : undefined, unidad: "cm", detalle: `${indicadores.variacion24hCm === null ? "—" : `${indicadores.variacion24hCm > 0 ? "+" : ""}${indicadores.variacion24hCm} cm`} en 24 h` },
        { etiqueta: "Frente a 210 días", valor: indicadores.percentil210, prefijo: "p", detalle: `entre ${indicadores.minimo210.metros.toFixed(2)} y ${indicadores.maximo210.metros.toFixed(2)} m` },
        { etiqueta: "Caudal GloFAS", valor: caudal?.actual ?? null, unidad: "m³/s", detalle: "modelo, no medición" },
      ]
    : [];

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <PanelPage>
        <SectionHero patron="rio" meta="Paraná · INA y GloFAS" titulo="Río" cifras={cifras}>
          La altura en Rosario contra los umbrales oficiales del INA, cómo viene el río en los últimos meses y qué pasa aguas arriba.
        </SectionHero>

        {rio ? (
          <div className="grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <PanelSection titulo="Estación Rosario">
              <LevelRuler estacion={rio.estacion} rango={indicadores ? { minimo: indicadores.minimo210.metros, maximo: indicadores.maximo210.metros } : null} />
            </PanelSection>
            <PanelSection titulo={`Altura diaria · últimos ${historia.length} días`} className="lg:border-l lg:border-rule-soft" nota="Una lectura diaria del INA. Las líneas punteadas son los umbrales oficiales de la estación.">
              <LineArea puntos={historia.map((lectura) => ({ fecha: lectura.fecha, valor: lectura.metros }))} umbrales={umbrales} unidad="m" alto={280} />
            </PanelSection>
          </div>
        ) : (
          <PanelSection titulo="Estación Rosario">
            <SourceDown falla={fallaDe("ina")} />
          </PanelSection>
        )}

        <div className="grid lg:grid-cols-2">
          <PanelSection titulo="Cadena del Paraná" nota="Una subida aguas arriba no determina por sí sola qué pasará en Rosario: usala para anticipar, no para predecir.">
            {kpis.aguasArriba.length ? <UpstreamChain estaciones={kpis.aguasArriba} /> : <SourceDown falla={fallaDe("ina")} />}
          </PanelSection>
          <PanelSection titulo="Caudal frente a Rosario" className="lg:border-l lg:border-rule-soft" nota={`Estimación de GloFAS (Copernicus) para la celda del canal (${PARANA_GLOFAS_CELL.lat}, ${PARANA_GLOFAS_CELL.lon}). La línea punteada es su pronóstico.`}>
            {caudal && caudalSerie.length > 1 ? <LineArea puntos={caudalSerie} unidad="m³/s" decimales={0} desdeFuturo={caudal.pasado.length} alto={220} /> : <SourceDown falla={fallaDe("glofas")} />}
          </PanelSection>
        </div>

        <PanelSection titulo="Red hidrométrica del INA">{rio ? <StationTable estaciones={rio.red} /> : <SourceDown falla={fallaDe("ina")} />}</PanelSection>

        <Docs>
          <DocsSection titulo="Cómo leer esta sección">
            <p className="text-xs leading-relaxed text-ink-soft">
              La regla usa la escala del hidrómetro de Rosario, no metros sobre el nivel del mar. Margen = alerta − altura. El ritmo es una recta de mínimos cuadrados sobre los últimos 14 días; extrapolarlo no es un pronóstico. El percentil compara la altura de hoy con los últimos 210 días. El caudal de GloFAS es un modelo: su relación con la altura de Rosario es débil.
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
