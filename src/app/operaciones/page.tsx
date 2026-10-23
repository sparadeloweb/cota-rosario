import { DataStatus } from "@/components/DataStatus";
import { Docs, DocsSection } from "@/components/Docs";
import { FloodMap } from "@/components/FloodMap";
import { KpiGrid } from "@/components/kpis/KpiGrid";
import { Sparkline } from "@/components/kpis/Sparkline";
import { PanelHeader, PanelSection } from "@/components/panel/PanelBlocks";
import { tilesLluvia, tilesRedYReportes, tilesRio } from "@/components/panel/tiles";
import { Provenance } from "@/components/Provenance";
import { Recomendaciones } from "@/components/Recomendaciones";
import { PanelShell } from "@/components/shell/PanelShell";
import { Workspace } from "@/components/shell/Workspace";
import { WeatherBadge, WeatherLine } from "@/components/WeatherBadge";
import { loadPanel } from "@/lib/panelData";

export const dynamic = "force-dynamic";

export default async function ResumenPage() {
  const { estado, kpis, recomendaciones, parte, fallaDe } = await loadPanel();
  const { riesgo, rio, lluvia, caudal, clima } = estado;

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <Workspace
        lienzo={<FloodMap zonas={riesgo.zonas} reportes esquina={<WeatherBadge clima={clima} />} />}
        rail={
          <div className="flex flex-col">
            <WeatherLine clima={clima} />
            <PanelHeader meta={`Seguimiento hídrico${riesgo.incompleto ? " · evaluación parcial" : ""}`} titulo="Resumen">
              Qué conviene revisar ahora, el parte para compartir y los indicadores del río, la lluvia, la red del INA y los reportes de vecinos.
            </PanelHeader>

            <DataStatus estado={estado} />

            <PanelSection titulo="Sugerencias para revisar" nota="Basadas en los indicadores y reportes disponibles. Cada una muestra el dato que la motiva.">
              <Recomendaciones recomendaciones={recomendaciones} parte={parte} />
            </PanelSection>

            <PanelSection titulo="Indicadores">
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
