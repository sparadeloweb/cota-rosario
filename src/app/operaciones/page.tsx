import { AppShell } from "@/components/AppShell";
import { FloodMap } from "@/components/FloodMap";
import { Provenance } from "@/components/Provenance";
import { RiverGauge } from "@/components/RiverGauge";
import { Simulator } from "@/components/Simulator";
import { SourceDown } from "@/components/SourceDown";
import { StationTable } from "@/components/StationTable";
import { loadEstado } from "@/lib/estado";
import { PARANA_GLOFAS_CELL, ROSARIO } from "@/lib/sources";

export const revalidate = 900;

const CAUDAL_DECIMALS = 0;

export default async function OperacionesPage() {
  const { riesgo, rio, lluvia, caudal, fallas } = await loadEstado();
  const fallaDe = (fuente: string) => fallas.find((falla) => falla.fuente === fuente);
  const caudalMaximo = caudal ? Math.max(...caudal.dias.map((dia) => dia.caudal), 1) : 1;

  return (
    <AppShell
      activo="/operaciones"
      nivel={riesgo.nivel}
      lienzo={
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <FloodMap zonas={riesgo.zonas} />
          </div>
          <div className="glass-rail max-h-[45%] shrink-0 overflow-y-auto border-t border-rule px-5 py-5 sm:px-6">
            <h2 className="meta">Red hidrométrica del INA</h2>
            <div className="mt-4">{rio ? <StationTable estaciones={rio.red} /> : <SourceDown falla={fallaDe("ina")!} />}</div>
          </div>
        </div>
      }
      rail={
        <div className="flex flex-col">
          <section className="px-5 py-6 sm:px-6">
            <p className="meta">Mesa de situación{riesgo.incompleto ? " · evaluación parcial" : ""}</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Operaciones</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Las mismas fuentes que ve el vecino, sin redondear: la red completa del INA, el caudal modelado del Paraná y un simulador para
              ensayar umbrales antes de que haga falta.
            </p>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Estación Rosario</h2>
            <div className="mt-4">{rio ? <RiverGauge rio={rio} /> : <SourceDown falla={fallaDe("ina")!} />}</div>
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
            <h2 className="meta">Caudal modelado del Paraná</h2>
            {caudal ? (
              <>
                <div className="mt-4 flex items-baseline gap-2.5">
                  <span className="readout text-3xl font-medium text-ink">
                    {caudal.actual === null ? "—" : caudal.actual.toFixed(CAUDAL_DECIMALS)}
                  </span>
                  <span className="text-sm text-ink-soft">m³/s</span>
                  <span className="meta ml-auto">GloFAS · 7 días</span>
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
            <p className="mt-4 border-l-2 border-atencion pl-3 text-xs leading-relaxed text-ink-soft">
              <span className="text-atencion">Celda corregida.</span> En las coordenadas del centro de Rosario ({ROSARIO.lat},{" "}
              {ROSARIO.lon}) GloFAS devuelve 0,03 m³/s: cae en una celda interior sin cauce. Este panel consulta la celda del canal (
              {PARANA_GLOFAS_CELL.lat}, {PARANA_GLOFAS_CELL.lon}).
            </p>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Fuentes y última consulta</h2>
            <div className="mt-4">
              <Provenance
                sellos={[
                  { id: "ina", consultadoEn: rio?.consultadoEn, falla: fallaDe("ina") },
                  { id: "openMeteo", consultadoEn: lluvia?.consultadoEn, falla: fallaDe("openMeteo") },
                  { id: "glofas", consultadoEn: caudal?.consultadoEn, falla: fallaDe("glofas") },
                ]}
              />
            </div>
            <a href="/api/estado" className="readout mt-4 inline-block text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
              GET /api/estado · el cruce completo en JSON
            </a>
          </section>
        </div>
      }
    />
  );
}
