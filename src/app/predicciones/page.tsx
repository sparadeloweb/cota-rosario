import modelos from "../../../public/data/modelos.json";
import { AppShell } from "@/components/AppShell";
import { FloodingOutlook } from "@/components/FloodingOutlook";
import { ForecastMap } from "@/components/ForecastMap";
import { ModelNotes } from "@/components/ModelNotes";
import { RainOutlook } from "@/components/RainOutlook";
import { RiverProjection } from "@/components/RiverProjection";
import { SourceDown } from "@/components/SourceDown";
import { TrainingTable } from "@/components/TrainingTable";
import type { PoissonModel } from "@/lib/forecast/poisson";
import { loadEstado } from "@/lib/estado";
import { loadPredicciones } from "@/lib/predicciones";

export const revalidate = 900;

const CM_PER_M = 100;

function diasHasta(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "no a este ritmo" : `${valor} días`;
}

export default async function PrediccionesPage() {
  const [predicciones, estado] = await Promise.all([loadPredicciones(), loadEstado()]);
  const { anegamientos, lluvia, rio, fallas } = predicciones;
  const fallaDe = (fuente: string) => fallas.find((falla) => falla.fuente === fuente);
  const entrenamiento = (modelos.anegamientos as PoissonModel).entrenamiento;

  return (
    <AppShell
      activo="/predicciones"
      nivel={estado.riesgo.nivel}
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

          <p className="hairline px-5 py-6 text-xs leading-relaxed text-ink-faint sm:px-6">
            Son modelos estadísticos de este panel, no pronósticos oficiales. Cada uno declara su ajuste y su error; ninguno reemplaza al INA ni a Defensa
            Civil (103).
          </p>
        </div>
      }
    />
  );
}
