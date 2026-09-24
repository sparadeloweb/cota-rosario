import { AppShell } from "@/components/AppShell";
import { Docs, DocsSection } from "@/components/Docs";
import { FloodMap } from "@/components/FloodMap";
import { Provenance } from "@/components/Provenance";
import { RiverGauge } from "@/components/RiverGauge";
import { SimulationProvider } from "@/components/SimulationContext";
import { Simulator } from "@/components/Simulator";
import { SourceDown } from "@/components/SourceDown";
import { StationTable } from "@/components/StationTable";
import { WeatherBadge } from "@/components/WeatherBadge";
import { loadEstado } from "@/lib/estado";
import { PARANA_GLOFAS_CELL, ROSARIO } from "@/lib/sources";

export const revalidate = 300;

const CAUDAL_DECIMALS = 0;

export default async function OperacionesPage() {
  const { riesgo, rio, lluvia, caudal, clima, fallas } = await loadEstado();
  const fallaDe = (fuente: string) => fallas.find((falla) => falla.fuente === fuente);
  const caudalMaximo = caudal ? Math.max(...caudal.dias.map((dia) => dia.caudal), 1) : 1;

  return (
    <SimulationProvider>
      <AppShell
        activo="/operaciones"
        nivel={riesgo.nivel}
        actualizadoEn={new Date().toISOString()}
        lienzo={<FloodMap zonas={riesgo.zonas} reportes esquina={<WeatherBadge clima={clima} />} />}
        lienzoInferior={
          <>
            <h2 className="meta">Red hidrométrica del INA</h2>
            <div className="mt-4">{rio ? <StationTable estaciones={rio.red} /> : <SourceDown falla={fallaDe("ina")!} />}</div>
          </>
        }
        rail={
          <div className="flex flex-col">
            <section className="px-5 py-6 sm:px-6">
              <p className="meta">Mesa de situación{riesgo.incompleto ? " · evaluación parcial" : ""}</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Operaciones</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Las mismas fuentes que ve el vecino, sin redondear: la red completa del INA, el caudal del Paraná y un simulador para ensayar
                escenarios sobre el mapa.
              </p>
            </section>

            <section className="hairline px-5 py-6 sm:px-6">
              <h2 className="meta">Simulador de escenarios</h2>
              <div className="mt-4">
                {rio ? (
                  <Simulator
                    metrosActuales={rio.estacion.metros}
                    alerta={rio.estacion.alerta ?? 0}
                    evacuacion={rio.estacion.evacuacion ?? 0}
                    picoActualMm={lluvia?.picoVentana?.milimetros ?? 0}
                  />
                ) : (
                  <p className="text-xs leading-relaxed text-ink-soft">El simulador parte de la lectura real del INA; sin ella no hay punto de partida.</p>
                )}
              </div>
            </section>

            <section className="hairline px-5 py-6 sm:px-6">
              <h2 className="meta">Estación Rosario</h2>
              <div className="mt-4">{rio ? <RiverGauge rio={rio} /> : <SourceDown falla={fallaDe("ina")!} />}</div>
            </section>

            <section className="hairline px-5 py-6 sm:px-6">
              <h2 className="meta">Caudal del Paraná</h2>
              {caudal ? (
                <>
                  <div className="mt-4 flex items-baseline gap-2.5">
                    <span className="readout text-3xl font-medium text-ink">
                      {caudal.actual === null ? "—" : caudal.actual.toFixed(CAUDAL_DECIMALS)}
                    </span>
                    <span className="text-sm text-ink-soft">m³/s</span>
                    <span className="meta ml-auto">próximos 7 días</span>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2">
                    {caudal.dias.map((dia) => (
                      <li key={dia.fecha} className="flex items-center gap-3 text-xs">
                        <span className="readout w-20 shrink-0 text-ink-faint">{dia.fecha.slice(5)}</span>
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-rule-soft">
                          <span className="block h-full rounded-full bg-ink-faint" style={{ width: `${(dia.caudal / caudalMaximo) * 100}%` }} />
                        </span>
                        <span className="readout w-16 shrink-0 text-right text-ink">{dia.caudal.toFixed(CAUDAL_DECIMALS)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="mt-4">
                  <SourceDown falla={fallaDe("glofas")!} />
                </div>
              )}
            </section>

            <Docs>
              <DocsSection titulo="El simulador">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Usa exactamente el mismo modelo que la vista pública: mover los controles pinta el mapa con el escenario, no altera ningún dato real ni
                  queda guardado. Sirve para ensayar el umbral con el que se quiere disparar un aviso antes de que la situación ocurra.
                </p>
              </DocsSection>
              <DocsSection titulo="El caudal">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Es el caudal modelado por GloFAS (Copernicus), no una medición. En las coordenadas del centro de Rosario ({ROSARIO.lat}, {ROSARIO.lon})
                  GloFAS devuelve 0,03 m³/s porque cae en una celda sin cauce; este panel consulta la celda del canal ({PARANA_GLOFAS_CELL.lat},{" "}
                  {PARANA_GLOFAS_CELL.lon}).
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
    </SimulationProvider>
  );
}
