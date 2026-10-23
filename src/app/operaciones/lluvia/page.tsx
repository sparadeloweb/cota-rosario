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

function etiquetaDia(fecha: string, hoy: string): string {
  if (fecha === hoy) {
    return "hoy";
  }
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

export default async function LluviaPage() {
  const { estado, kpis, predicciones, fallaDe } = await loadPanel();
  const { riesgo, lluvia } = estado;
  const balance = kpis.lluvia?.balance ?? null;
  const mes = kpis.lluvia?.mes ?? null;
  const normal = kpis.lluvia?.mesNormalMm ?? null;
  const hoy = balance?.ahoraLocal.slice(0, 10) ?? "";

  const cifras: HeroFigure[] = balance
    ? [
        { etiqueta: "Caída 24 h", valor: balance.caido24h, decimales: 1, unidad: "mm", detalle: `${balance.caido72h.toFixed(1)} mm en 72 h` },
        { etiqueta: "Prevista 48 h", valor: balance.prevista48h, decimales: 1, unidad: "mm", tono: balance.prevista48h >= HEAVY_48H_MM ? "atencion" : "neutro", detalle: `${balance.prevista24h.toFixed(1)} mm en las próximas 24 h` },
        { etiqueta: "Probabilidad máx. 24 h", valor: balance.probabilidadMax24h, unidad: "%", detalle: "la hora más probable" },
        { etiqueta: "Mes en curso", valor: mes && normal ? Math.round((mes.acumuladoMm / normal) * PERCENT) : null, unidad: "%", detalle: mes ? `${mes.acumuladoMm.toFixed(0)} mm de ${normal?.toFixed(0) ?? "—"} de referencia` : "sin archivo del mes" },
      ]
    : [];

  return (
    <PanelShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <PanelPage>
        <SectionHero patron="lluvia" meta="Open-Meteo · modelo, no pluviómetro" titulo="Lluvia" cifras={cifras}>
          Lo que cayó, lo que viene hora por hora y en la semana, y cómo viene el mes contra su referencia histórica.
        </SectionHero>

        <PanelSection titulo="Próximas 48 horas" nota="El pico de 2 horas es lo que más pesa para los anegamientos urbanos: una lluvia concentrada satura los desagües antes que una larga y suave.">
          {lluvia ? <HourlyRain horas={lluvia.horas} pico={lluvia.picoVentana} /> : <SourceDown falla={fallaDe("openMeteo")} />}
        </PanelSection>

        <div className="grid lg:grid-cols-2">
          <PanelSection titulo="Caída y prevista · seis días alrededor de hoy">
            {balance ? (
              <Columns
                columnas={balance.porDia.map((dia) => ({ clave: dia.fecha, etiqueta: etiquetaDia(dia.fecha, hoy), valor: dia.caidoMm, secundario: dia.previstoMm, resaltar: dia.fecha === hoy }))}
                unidad="mm"
                decimales={1}
                etiquetaPrimaria="caída (horas pasadas del modelo)"
                etiquetaSecundaria="prevista"
              />
            ) : (
              <SourceDown falla={fallaDe("openMeteo")} />
            )}
          </PanelSection>
          <PanelSection titulo="El mes contra su referencia" className="lg:border-l lg:border-rule-soft">
            {mes && normal ? <MonthProgress mes={mes} normalMm={normal} /> : <SourceDown falla={fallaDe("openMeteo")} />}
          </PanelSection>
        </div>

        <PanelSection titulo="La semana">{predicciones.lluvia ? <WeekRain dias={predicciones.lluvia.dias} /> : <SourceDown falla={fallaDe("openMeteo")} />}</PanelSection>

        <Docs>
          <DocsSection titulo="De dónde sale la lluvia">
            <p className="text-xs leading-relaxed text-ink-soft">
              Pronóstico y horas pasadas del modelo de Open-Meteo para Rosario; el mes en curso, del archivo de Open-Meteo con su fecha de cobertura; la referencia mensual, de la climatología del mismo archivo. No son lecturas de un pluviómetro de la ciudad.
            </p>
            <Provenance sellos={[{ id: "openMeteo", consultadoEn: lluvia?.consultadoEn, falla: fallaDe("openMeteo") }]} />
          </DocsSection>
        </Docs>
      </PanelPage>
    </PanelShell>
  );
}
