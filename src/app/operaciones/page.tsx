import { DataStatus } from "@/components/DataStatus";
import { Docs, DocsSection } from "@/components/Docs";
import { FloodMap } from "@/components/FloodMap";
import { KpiGrid } from "@/components/kpis/KpiGrid";
import { Sparkline } from "@/components/kpis/Sparkline";
import { Briefing, PulseCard, PulseGrid, PulseSpark } from "@/components/panel/briefing";
import { PanelSection } from "@/components/panel/PanelBlocks";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { tilesLluvia, tilesRedYReportes, tilesRio } from "@/components/panel/tiles";
import { Provenance } from "@/components/Provenance";
import { PanelShell } from "@/components/shell/PanelShell";
import { Workspace } from "@/components/shell/Workspace";
import { WeatherBadge, WeatherLine } from "@/components/WeatherBadge";
import { loadPanel } from "@/lib/panelData";
import { riskLabel } from "@/lib/risk";
import { tituloEstado } from "@/lib/vecinos";

export const dynamic = "force-dynamic";

const MARGIN_WARNING_M = 0.5;
const HEAVY_48H_MM = 30;

export default async function ResumenPage() {
  const { estado, kpis, predicciones, recomendaciones, parte, fallaDe } = await loadPanel();
  const { riesgo, rio, lluvia, caudal, clima } = estado;
  const margen = kpis.rio?.margenAlertaM ?? null;
  const balance = kpis.lluvia?.balance ?? null;
  const urgentes = recomendaciones.filter((item) => item.prioridad === "alta").length;
  const anegamientos = predicciones.anegamientos;

  const cifras: HeroFigure[] = [
    { etiqueta: "Río en Rosario", valor: kpis.rio?.actual ?? null, decimales: 2, unidad: "m", detalle: margen === null ? "sin umbral de alerta" : `${margen.toFixed(2)} m a la alerta` , tono: margen !== null && margen <= MARGIN_WARNING_M ? "atencion" : "neutro" },
    { etiqueta: "Lluvia 48 h", valor: balance?.prevista48h ?? null, decimales: 1, unidad: "mm", detalle: balance ? `${balance.caido24h.toFixed(1)} mm cayeron en 24 h` : "pronóstico no disponible", tono: balance && balance.prevista48h >= HEAVY_48H_MM ? "atencion" : "neutro" },
    { etiqueta: "Reportes 24 h", valor: kpis.reportes?.activos ?? null, detalle: kpis.reportes ? `${kpis.reportes.ultimas6h} en las últimas 6 h` : "consulta no disponible" },
    { etiqueta: "Para hacer ahora", valor: urgentes, detalle: recomendaciones.length === 1 ? "1 sugerencia en total" : `${recomendaciones.length} sugerencias en total`, tono: urgentes ? "critico" : "neutro" },
  ];

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <Workspace
        lienzo={<FloodMap zonas={riesgo.zonas} reportes esquina={<WeatherBadge clima={clima} />} />}
        rail={
          <div className="flex flex-col">
            <WeatherLine clima={clima} />
            <SectionHero patron="resumen" meta={`Seguimiento hídrico${riesgo.incompleto ? " · evaluación parcial" : ""}`} titulo="Resumen" nivel={riesgo.nivel} estado={riskLabel(riesgo.nivel)} cifras={cifras}>
              {tituloEstado(riesgo.nivel)}. Qué conviene revisar ahora, el parte para compartir y el pulso de cada sección.
            </SectionHero>

            <DataStatus estado={estado} />

            <PanelSection titulo="Sugerencias para revisar" nota="Basadas en los indicadores y reportes disponibles. Cada una muestra el dato que la motiva.">
              <Briefing recomendaciones={recomendaciones} parte={parte} />
            </PanelSection>

            <PanelSection titulo="Por sección">
              <PulseGrid>
                <PulseCard href="/operaciones/rio" titulo="Río" valor={kpis.rio ? kpis.rio.actual.toFixed(2) : "—"} unidad="m" detalle={kpis.rio?.variacion7dCm == null ? "sin variación semanal" : `${kpis.rio.variacion7dCm > 0 ? "+" : ""}${kpis.rio.variacion7dCm} cm en 7 días`} acento="var(--water)">
                  {kpis.rio ? <PulseSpark valores={kpis.rio.sparkline.map((lectura) => lectura.metros)} alerta={rio?.estacion.alerta} /> : null}
                </PulseCard>
                <PulseCard href="/operaciones/lluvia" titulo="Lluvia" valor={lluvia?.picoVentana ? lluvia.picoVentana.milimetros.toFixed(1) : "—"} unidad="mm / 2 h" detalle={lluvia?.picoVentana ? "pico de las próximas horas" : "sin pico calculable"} acento="var(--water)" />
                <PulseCard href="/operaciones/pronostico" titulo="Pronóstico" valor={anegamientos ? anegamientos.esperadosCiudad.toFixed(anegamientos.esperadosCiudad < 10 ? 1 : 0) : "—"} unidad="anegamientos" detalle={anegamientos ? `esperados en ${anegamientos.ventanaDias} días · exploratorio` : "modelo no disponible"} acento="var(--atencion)" />
                <PulseCard href="/operaciones/reportes" titulo="Reportes" valor={kpis.reportes ? String(kpis.reportes.activos) : "—"} unidad="activos" detalle={kpis.reportes?.porDistrito[0] ? `más en ${kpis.reportes.porDistrito[0].distrito.toLowerCase()}` : "ningún distrito con reportes"} acento="var(--critico)" />
              </PulseGrid>
            </PanelSection>

            <PanelSection titulo="Todos los indicadores">
              <div className="flex flex-col gap-5">
                <KpiGrid tiles={[...tilesRio(kpis), ...tilesLluvia(kpis), ...tilesRedYReportes(kpis)]}>
                  {kpis.rio ? (
                    <div className="flex flex-col gap-1">
                      <Sparkline valores={kpis.rio.sparkline.map((lectura) => lectura.metros)} />
                      <span className="meta">
                        altura del río, últimos 60 días · de {kpis.rio.minimo210.metros.toFixed(2)} a {kpis.rio.maximo210.metros.toFixed(2)} m en 210 días
                        {rio?.estacion.alerta ? ` · alerta ${rio.estacion.alerta.toFixed(2)} m` : ""}
                      </span>
                    </div>
                  ) : null}
                </KpiGrid>
              </div>
            </PanelSection>

            <Docs>
              <DocsSection titulo="Las recomendaciones">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Reglas fijas sobre los mismos datos del panel, ordenadas por urgencia (ahora / hoy / cuando se pueda). Río: umbrales del INA superados;
                  margen a alerta de 0,50 m o menos, o alerta a 7 días o menos al ritmo actual; dos o más estaciones aguas arriba a 0,50 m o menos de su alerta y
                  creciendo; ritmo de 2 cm/día o más. Lluvia: pico de 2 h sobre los umbrales de atención/alerta del panel; 30 mm o más en 48 h; un día con
                  período de retorno de 5 años o más; mes en curso al 150 % de lo normal. Anegamientos: 10 o más esperados en la semana, o 3 en un distrito.
                  Reportes: agua en viviendas, 3 o más en 6 horas, calles cortadas. Fuentes: INA sin responder. Si nada aplica, se sugiere trabajo preventivo.
                  El parte de situación se arma con las mismas cifras. Todo en JSON en <span className="readout">/api/recomendaciones</span>.
                </p>
              </DocsSection>
              <DocsSection titulo="Los indicadores">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Río: variaciones sobre la serie diaria del INA; el percentil compara la altura de hoy con los últimos 210 días; el ritmo es una recta de
                  mínimos cuadrados sobre 14 días. Lluvia caída: horas pasadas del modelo de Open-Meteo, no un pluviómetro de Rosario. Mes en curso:
                  archivo de Open-Meteo con fecha de cobertura contra la referencia histórica del mismo mes. Aguas arriba: margen = alerta − altura; se excluyen lecturas de más de 48 h.
                  Reportes: los cargados por vecinos en las últimas 24 h, ubicados por distrito. Todo en JSON en <span className="readout">/api/kpis</span>.
                </p>
              </DocsSection>
              <DocsSection titulo="Fuentes y última consulta">
                <Provenance
                  sellos={[
                    { id: "ina", consultadoEn: rio?.consultadoEn, falla: fallaDe("ina") },
                    { id: "openMeteo", consultadoEn: lluvia?.consultadoEn, falla: fallaDe("openMeteo") },
                    { id: "glofas", consultadoEn: caudal?.consultadoEn, falla: fallaDe("glofas") },
                  ]}
                />
                <a href="/api/estado" className="readout inline-block text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
                  GET /api/estado · el cruce completo en JSON
                </a>
              </DocsSection>
            </Docs>
          </div>
        }
      />
    </PanelShell>
  );
}
