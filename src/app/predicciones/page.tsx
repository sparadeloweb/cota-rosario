import modelos from "../../../public/data/modelos.json";
import { AppShell } from "@/components/AppShell";
import { FloodingOutlook } from "@/components/FloodingOutlook";
import { ForecastMap } from "@/components/ForecastMap";
import { ModelNotes } from "@/components/ModelNotes";
import { Provenance } from "@/components/Provenance";
import { RainOutlook } from "@/components/RainOutlook";
import { RiverProjection } from "@/components/RiverProjection";
import { SourceDown } from "@/components/SourceDown";
import { TrainingTable } from "@/components/TrainingTable";
import type { PoissonModel } from "@/lib/forecast/poisson";
import { loadEstado } from "@/lib/estado";
import { loadPredicciones } from "@/lib/predicciones";

export const revalidate = 300;

const CM_PER_M = 100;
const WEAK_FIT_R2 = 0.5;

function diasHasta(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "no a este ritmo" : `${valor} días`;
}

export default async function PrediccionesPage() {
  const [predicciones, estado] = await Promise.all([loadPredicciones(), loadEstado()]);
  const { anegamientos, lluvia, rio, fallas, consultas, vigencia } = predicciones;
  const fallaDe = (fuente: string) => fallas.find((falla) => falla.fuente === fuente);
  const entrenamiento = (modelos.anegamientos as PoissonModel).entrenamiento;

  return (
    <AppShell
      activo="/predicciones"
      nivel={estado.riesgo.nivel}
      actualizadoEn={predicciones.generadoEn}
      lienzo={<ForecastMap distritos={anegamientos?.porDistrito ?? []} ventanaDias={anegamientos?.ventanaDias ?? 7} />}
      lienzoInferior={
        <>
          <h2 className="meta">Ajuste del modelo de anegamientos · observado / predicho por mes</h2>
          <div className="mt-4">
            <TrainingTable entrenamiento={entrenamiento} />
          </div>
        </>
      }
      rail={
        <div className="flex flex-col">
          <section className="px-5 py-6 sm:px-6">
            <p className="meta">Próximos 7 días{fallas.length ? " · evaluación parcial" : ""}</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Predicciones</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Tres modelos ajustados sobre datos públicos: cuántos anegamientos atenderá Defensa Civil según la lluvia pronosticada, qué tan rara es esa
              lluvia frente a 86 años de registro, y a dónde va el río según su tendencia y el caudal modelado.
            </p>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Anegamientos esperados</h2>
            <div className="mt-4">{anegamientos ? <FloodingOutlook anegamientos={anegamientos} /> : <SourceDown falla={fallaDe("openMeteo")!} />}</div>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Qué tan rara es la lluvia prevista</h2>
            <div className="mt-4">{lluvia ? <RainOutlook lluvia={lluvia} /> : <SourceDown falla={fallaDe("openMeteo")!} />}</div>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">A dónde va el río</h2>
            <div className="mt-4">
              {rio ? (
                <div className="flex flex-col gap-4">
                  <RiverProjection rio={rio} />
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule-soft pt-4 text-xs sm:grid-cols-3">
                    <div className="flex flex-col gap-0.5">
                      <dt className="meta">Tendencia</dt>
                      <dd className="readout text-ink">{rio.tendencia ? `${(rio.tendencia.metrosPorDia * CM_PER_M).toFixed(1)} cm/día` : "—"}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="meta">Alerta ({rio.alerta?.toFixed(2) ?? "—"} m)</dt>
                      <dd className="readout text-ink">{diasHasta(rio.tendencia?.diasHasta.alerta)}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="meta">Evacuación ({rio.evacuacion?.toFixed(2) ?? "—"} m)</dt>
                      <dd className="readout text-ink">{diasHasta(rio.tendencia?.diasHasta.evacuacion)}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="meta">En 7 días, por tendencia</dt>
                      <dd className="readout text-ink">{rio.tendencia ? `${rio.tendencia.proyeccion[rio.tendencia.proyeccion.length - 1].metros.toFixed(2)} m` : "—"}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="meta">En 7 días, por caudal</dt>
                      <dd className="readout text-ink">{rio.curva?.proyeccion.length ? `${rio.curva.proyeccion[rio.curva.proyeccion.length - 1].metros.toFixed(2)} m` : "—"}</dd>
                      {rio.curva ? (
                        <dd className={`meta ${rio.curva.r2 < WEAK_FIT_R2 ? "text-atencion" : ""}`}>
                          R² {rio.curva.r2.toFixed(2)}
                          {rio.curva.r2 < WEAK_FIT_R2 ? " · ajuste débil" : ""}
                        </dd>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="meta">Caudal GloFAS hoy</dt>
                      <dd className="readout text-ink">{rio.caudal?.actual ? `${Math.round(rio.caudal.actual)} m³/s` : "—"}</dd>
                    </div>
                  </dl>
                  {!rio.caudal ? <SourceDown falla={fallaDe("glofas")!} /> : null}
                </div>
              ) : (
                <SourceDown falla={fallaDe("ina")!} />
              )}
            </div>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Cómo se calcula</h2>
            <div className="mt-4">
              <ModelNotes predicciones={predicciones} />
            </div>
            <a href="/api/predicciones" className="readout mt-4 inline-block text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
              GET /api/predicciones · todo en JSON
            </a>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Vigencia de cada dato</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Pronóstico y caudal</dt>
                <dd className="text-ink">en vivo, caché de 5 min</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Última lectura del río</dt>
                <dd className="readout text-ink">{vigencia.ultimaMedicionRio ? `${vigencia.ultimaMedicionRio.slice(0, 10)} · diaria` : "—"}</dd>
                {rio ? <dd className="meta">serie desde {rio.serieDesde.slice(0, 10)}</dd> : null}
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Defensa Civil publicada hasta</dt>
                <dd className="readout text-ink">{vigencia.defensaCivilHasta}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Lluvia histórica hasta</dt>
                <dd className="readout text-ink">{vigencia.lluviaHistoricaHasta}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Modelos ajustados</dt>
                <dd className="readout text-ink">{vigencia.modelosCalculados.slice(0, 10)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Esta vista</dt>
                <dd className="readout text-ink">{predicciones.generadoEn.slice(11, 16)} UTC</dd>
              </div>
            </dl>
            <div className="mt-6">
              <Provenance
                sellos={[
                  { id: "ina", consultadoEn: consultas.ina, falla: fallaDe("ina") },
                  { id: "openMeteo", consultadoEn: consultas.openMeteo, falla: fallaDe("openMeteo") },
                  { id: "glofas", consultadoEn: consultas.glofas, falla: fallaDe("glofas") },
                ]}
              />
            </div>
          </section>

          <p className="hairline px-5 py-6 text-xs leading-relaxed text-ink-faint sm:px-6">
            Son modelos estadísticos de este panel, no pronósticos oficiales. Cada uno declara su ajuste y su error; ninguno reemplaza al INA ni a Defensa
            Civil (103).
          </p>
        </div>
      }
    />
  );
}
