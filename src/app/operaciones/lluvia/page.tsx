import type { Metadata } from "next";
import { Docs, DocsSection } from "@/components/Docs";
import { Columns } from "@/components/panel/charts";
import { PanelPage, PanelSection } from "@/components/panel/PanelBlocks";
import { HourlyRain, MonthProgress, WeekRain } from "@/components/panel/rain";
import { SectionHero, type HeroFigure } from "@/components/panel/SectionHero";
import { Provenance } from "@/components/Provenance";
import { PanelShell } from "@/components/shell/PanelShell";
import { SourceDown } from "@/components/SourceDown";
import { loadPanel } from "@/lib/panelData";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lluvia · Operaciones · Cota" };

const HEAVY_48H_MM = 30;
const PERCENT = 100;

function dayLabel(date: string, today: string): string {
  if (date === today) {
    return "hoy";
  }
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export default async function RainPage() {
  const { status, kpis, predictions, failureOf } = await loadPanel();
  const { risk, rain } = status;
  const balance = kpis.rain?.balance ?? null;
  const month = kpis.rain?.month ?? null;
  const normal = kpis.rain?.monthNormalMm ?? null;
  const today = balance?.localNow.slice(0, 10) ?? "";

  const figures: HeroFigure[] = balance
    ? [
        { label: "Caída 24 h", value: balance.fallen24h, decimals: 1, unit: "mm", detail: `${balance.fallen72h.toFixed(1)} mm en 72 h` },
        { label: "Prevista 48 h", value: balance.expected48h, decimals: 1, unit: "mm", tone: balance.expected48h >= HEAVY_48H_MM ? "watch" : "neutral", detail: `${balance.expected24h.toFixed(1)} mm en las próximas 24 h` },
        { label: "Probabilidad máx. 24 h", value: balance.maxProbability24h, unit: "%", detail: "la hora más probable" },
        { label: "Mes en curso", value: month && normal ? Math.round((month.accumulatedMm / normal) * PERCENT) : null, unit: "%", detail: month ? `${month.accumulatedMm.toFixed(0)} mm de ${normal?.toFixed(0) ?? "—"} de referencia` : "sin archivo del mes" },
      ]
    : [];

  return (
    <PanelShell level={risk.level} updatedAt={risk.assessedAt}>
      <PanelPage>
        <SectionHero pattern="rain" meta="Open-Meteo · modelo, no pluviómetro" title="Lluvia" figures={figures}>
          Lo que cayó, lo que viene hora por hora y en la semana, y cómo viene el mes contra su referencia histórica.
        </SectionHero>

        <PanelSection title="Próximas 48 horas" note="El pico de 2 horas es lo que más pesa para los anegamientos urbanos: una lluvia concentrada satura los desagües antes que una larga y suave.">
          {rain ? <HourlyRain hours={rain.hours} peak={rain.peakWindow} /> : <SourceDown failure={failureOf("openMeteo")} />}
        </PanelSection>

        <div className="grid lg:grid-cols-2">
          <PanelSection title="Caída y prevista · seis días alrededor de hoy">
            {balance ? (
              <Columns
                columns={balance.byDay.map((day) => ({ id: day.date, label: dayLabel(day.date, today), value: day.fallenMm, secondary: day.expectedMm, highlight: day.date === today }))}
                unit="mm"
                decimals={1}
                primaryLabel="caída (horas pasadas del modelo)"
                secondaryLabel="prevista"
              />
            ) : (
              <SourceDown failure={failureOf("openMeteo")} />
            )}
          </PanelSection>
          <PanelSection title="El mes contra su referencia" className="lg:border-l lg:border-rule-soft">
            {month && normal ? <MonthProgress month={month} normalMm={normal} /> : <SourceDown failure={failureOf("openMeteo")} />}
          </PanelSection>
        </div>

        <PanelSection title="La semana">{predictions.rain ? <WeekRain days={predictions.rain.days} /> : <SourceDown failure={failureOf("openMeteo")} />}</PanelSection>

        <Docs>
          <DocsSection title="De dónde sale la lluvia">
            <p className="text-xs leading-relaxed text-ink-soft">
              Pronóstico y horas pasadas del modelo de Open-Meteo para Rosario; el mes en curso, del archivo de Open-Meteo con su fecha de cobertura; la referencia mensual, de la climatología del mismo archivo. No son lecturas de un pluviómetro de la ciudad.
            </p>
            <Provenance stamps={[{ id: "openMeteo", fetchedAt: rain?.fetchedAt, failure: failureOf("openMeteo") }]} />
          </DocsSection>
        </Docs>
      </PanelPage>
    </PanelShell>
  );
}
