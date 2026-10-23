import models from "../../../../public/data/models.json";
import { DataStatus } from "@/components/DataStatus";
import { Workspace } from "@/components/shell/Workspace";
import { DailyOutlook } from "@/components/DailyOutlook";
import { Docs, DocsSection } from "@/components/Docs";
import { FloodingOutlook } from "@/components/FloodingOutlook";
import { ForecastMap } from "@/components/ForecastMap";
import { ModelNotes } from "@/components/ModelNotes";
import { Provenance } from "@/components/Provenance";
import { RainOutlook } from "@/components/RainOutlook";
import { RiverProjection } from "@/components/RiverProjection";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { SourceDown } from "@/components/SourceDown";
import { TrainingTable } from "@/components/TrainingTable";
import { WeatherBadge } from "@/components/WeatherBadge";
import type { PoissonModel } from "@/lib/forecast/poisson";
import { loadStatus } from "@/lib/status";
import { loadPredictions } from "@/lib/predictions";
import { argentinaTime } from "@/lib/time";

export const dynamic = "force-dynamic";

const CM_PER_M = 100;
const WEAK_FIT_R2 = 0.5;
const DEFAULT_WINDOW_DAYS = 7;

function daysUntil(value: number | null | undefined): string {
  return value === null || value === undefined ? "sin cruce futuro calculable" : value > 7 ? `fuera de 7 días (hipótesis: ${value} d)` : `en ${value} días`;
}

export default async function ForecastPage() {
  const statusPromise = loadStatus();
  const [status, predictions] = await Promise.all([statusPromise, loadPredictions(statusPromise)]);
  const { flooding, rain, river, failures, fetches, validity, byDay } = predictions;
  const failureOf = (source: string) => failures.find((failure) => failure.source === source);
  const training = (models.flooding as PoissonModel).training;
  const windowDays = flooding?.windowDays ?? DEFAULT_WINDOW_DAYS;
  const isWeakCurve = river?.curve ? river.curve.r2 < WEAK_FIT_R2 : false;
  const riverAtEnd = river?.trend?.projection.at(-1)?.meters ?? null;
  const peakDay = rain?.maxDay ?? null;

  const figures: HeroFigure[] = [
    { label: "Anegamientos esperados", value: flooding?.cityExpected ?? null, decimals: flooding && flooding.cityExpected < 10 ? 1 : 0, detail: `en ${windowDays} días · escenario exploratorio`, tone: flooding && flooding.cityExpected >= 10 ? "watch" : "neutral" },
    { label: "Lluvia de la semana", value: flooding?.rain.total ?? null, decimals: 1, unit: "mm", detail: peakDay ? `el día más lluvioso: ${peakDay.date.slice(8, 10)}/${peakDay.date.slice(5, 7)} con ${peakDay.millimeters.toFixed(0)} mm` : "pronóstico no disponible" },
    { label: `Río en ${windowDays} días`, value: riverAtEnd, decimals: 2, unit: "m", detail: "si sigue el ritmo actual · no es pronóstico oficial" },
    { label: "Período de retorno", value: rain?.returnPeriodYears ?? null, decimals: 1, unit: "años", detail: "del día más lluvioso previsto" },
  ];

  return (
    <Workspace
    canvas={<ForecastMap districts={flooding?.byDistrict ?? []} windowDays={windowDays} corner={<WeatherBadge weather={status.weather} />} />}
    lowerCanvas={
      byDay.length ? (
        <>
          <h2 className="meta">Día por día · próximos {windowDays} días</h2>
          <div className="mt-4">
            <DailyOutlook days={byDay} alert={river?.alert ?? null} />
          </div>
        </>
      ) : undefined
    }
    rail={
      <div className="flex flex-col">
        <SectionHero pattern="forecast" meta={`Próximos ${windowDays} días${failures.length ? " · evaluación parcial" : ""}`} title="La semana que viene" figures={figures}>
          Lluvia prevista, tendencias del Paraná y escenarios de anegamiento para consultar los próximos siete días.
        </SectionHero>

        <DataStatus status={status} />

        <section className="hairline px-5 py-6 sm:px-5">
          <h2 className="meta">Escenario de anegamientos</h2>
          <div className="mt-4">{flooding ? <FloodingOutlook flooding={flooding} /> : <SourceDown failure={failureOf("models") ?? failureOf("openMeteo")} />}</div>
        </section>

        <section className="hairline px-5 py-6 sm:px-5">
          <h2 className="meta">La lluvia que viene</h2>
          <div className="mt-4">{rain ? <RainOutlook rain={rain} /> : <SourceDown failure={failureOf("openMeteo")!} />}</div>
        </section>

        <section className="hairline px-5 py-6 sm:px-5">
          <h2 className="meta">A dónde va el río</h2>
          <div className="mt-4">
            {river ? (
              <div className="flex flex-col gap-4">
                <RiverProjection river={river} />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule-soft pt-4 text-xs sm:grid-cols-3">
                  <div className="flex flex-col gap-0.5">
                    <dt className="meta">Ritmo actual</dt>
                    <dd className="readout text-ink">{river.trend ? `${(river.trend.metersPerDay * CM_PER_M).toFixed(1)} cm/día` : "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="meta">Alerta ({river.alert?.toFixed(2) ?? "—"} m)</dt>
                    <dd className="readout text-ink">{daysUntil(river.trend?.daysUntil.alert)}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="meta">Evacuación ({river.evacuation?.toFixed(2) ?? "—"} m)</dt>
                    <dd className="readout text-ink">{daysUntil(river.trend?.daysUntil.evacuation)}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="meta">En {windowDays} días, siguiendo el ritmo</dt>
                    <dd className="readout text-ink">{river.trend ? `${river.trend.projection[river.trend.projection.length - 1].meters.toFixed(2)} m` : "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="meta">En {windowDays} días, según el caudal</dt>
                    <dd className="readout text-ink">{river.curve?.projection.length ? `${river.curve.projection[river.curve.projection.length - 1].meters.toFixed(2)} m` : "—"}</dd>
                    {isWeakCurve ? <dd className="meta text-watch">estimación poco confiable</dd> : null}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="meta">Caudal hoy</dt>
                    <dd className="readout text-ink">{river.discharge?.current ? `${Math.round(river.discharge.current)} m³/s` : "—"}</dd>
                  </div>
                </dl>
                {!river.discharge ? <SourceDown failure={failureOf("glofas")!} /> : null}
              </div>
            ) : (
              <SourceDown failure={failureOf("ina")!} />
            )}
          </div>
        </section>

        <Docs title="Fuentes, metodología y fecha de los datos">
          <DocsSection title="Cómo se calculan las tres estimaciones">
            <ModelNotes predictions={predictions} />
          </DocsSection>
          <DocsSection title="Hasta cuándo llega cada dato">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Pronóstico y caudal</dt>
                <dd className="text-ink">datos de la consulta actual</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Última lectura del río</dt>
                <dd className="readout text-ink">{validity.lastRiverReading ? `${validity.lastRiverReading.slice(0, 10)} · diaria` : "—"}</dd>
                {river ? <dd className="meta">serie desde {river.seriesFrom.slice(0, 10)}</dd> : null}
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Registro de Defensa Civil incorporado hasta</dt>
                <dd className="readout text-ink">{validity.civilDefenseUntil}</dd>
                <dd className="meta">último mes del registro disponible</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Lluvia histórica hasta</dt>
                <dd className="readout text-ink">{validity.historicalRainUntil}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Modelos ajustados</dt>
                <dd className="readout text-ink">{validity.modelsComputedAt.slice(0, 10)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="meta">Esta vista</dt>
                <dd className="readout text-ink">{argentinaTime(predictions.generatedAt)}</dd>
              </div>
            </dl>
          </DocsSection>
          <DocsSection title="Cómo le fue al modelo en el pasado, mes por mes">
            <TrainingTable training={training} />
          </DocsSection>
          <DocsSection title="Fuentes y última consulta">
            <Provenance
              stamps={[
                { id: "ina", fetchedAt: fetches.ina, failure: failureOf("ina") },
                { id: "openMeteo", fetchedAt: fetches.openMeteo, failure: failureOf("openMeteo") },
                { id: "glofas", fetchedAt: fetches.glofas, failure: failureOf("glofas") },
              ]}
            />
            <a href="/api/predictions" className="readout inline-block text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
              GET /api/predictions · todo en JSON
            </a>
          </DocsSection>
        </Docs>

      </div>
    }
    />
  );
}
