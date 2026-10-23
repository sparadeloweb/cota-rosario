import type { ReactNode } from "react";
import { Motion } from "@/components/motion/Motion";
import { riskColor } from "@/components/status";
import type { RiskLevel } from "@/lib/risk";

export type HeroPattern = "resumen" | "rio" | "lluvia" | "pronostico" | "reportes" | "simulador";
export type FigureTone = "neutro" | "atencion" | "alerta" | "critico";

export interface HeroFigure {
  etiqueta: string;
  valor: number | null;
  decimales?: number;
  unidad?: string;
  detalle?: string;
  tono?: FigureTone;
  prefijo?: string;
}

interface SectionHeroProps {
  patron: HeroPattern;
  meta: string;
  titulo: string;
  children?: ReactNode;
  cifras?: HeroFigure[];
  nivel?: RiskLevel | null;
  estado?: string;
}

const TONE_TEXT: Record<FigureTone, string> = {
  neutro: "text-ink",
  atencion: "text-atencion",
  alerta: "text-alerta",
  critico: "text-critico",
};

const WAVE_ROWS = 7;
const WAVE_GAP = 26;
const RAIN_STREAKS = 46;
const SCATTER_DOTS = 60;
const TIMELINE_TICKS = 28;

function pseudoAleatorio(semilla: number): number {
  const x = Math.sin(semilla * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Patron({ patron }: { patron: HeroPattern }) {
  const comun = "pointer-events-none absolute inset-0 h-full w-full";
  if (patron === "rio") {
    return (
      <svg className={`${comun} text-water opacity-[0.16]`} viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: WAVE_ROWS }, (_, fila) => {
          const y = 30 + fila * WAVE_GAP;
          return <path key={fila} d={`M0 ${y} C 100 ${y - 12}, 200 ${y + 12}, 300 ${y} S 500 ${y - 12}, 600 ${y} S 750 ${y + 10}, 800 ${y}`} fill="none" stroke="currentColor" strokeWidth={fila === 3 ? 1.4 : 0.8} />;
        })}
      </svg>
    );
  }
  if (patron === "lluvia") {
    return (
      <svg className={`${comun} text-water opacity-[0.18]`} viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: RAIN_STREAKS }, (_, i) => {
          const x = pseudoAleatorio(i + 1) * 820;
          const y = pseudoAleatorio(i + 101) * 200;
          const largo = 12 + pseudoAleatorio(i + 201) * 26;
          return <line key={i} x1={x} y1={y} x2={x - largo * 0.28} y2={y + largo} stroke="currentColor" strokeWidth="1" strokeLinecap="round" />;
        })}
      </svg>
    );
  }
  if (patron === "reportes") {
    return (
      <svg className={`${comun} opacity-[0.22]`} viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: SCATTER_DOTS }, (_, i) => (
          <circle key={i} cx={pseudoAleatorio(i + 7) * 800} cy={pseudoAleatorio(i + 307) * 220} r={1 + pseudoAleatorio(i + 607) * 2.2} fill={i % 9 === 0 ? "var(--critico)" : i % 5 === 0 ? "var(--atencion)" : "var(--water)"} />
        ))}
      </svg>
    );
  }
  if (patron === "simulador") {
    return <div className={`${comun} opacity-[0.35] [background-image:linear-gradient(var(--rule-soft)_1px,transparent_1px),linear-gradient(90deg,var(--rule-soft)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,transparent,black_35%,black)]`} aria-hidden="true" />;
  }
  if (patron === "pronostico") {
    return (
      <svg className={`${comun} text-ink-faint opacity-[0.25]`} viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="180" x2="800" y2="180" stroke="currentColor" strokeWidth="1" />
        {Array.from({ length: TIMELINE_TICKS }, (_, i) => (
          <line key={i} x1={i * 30 + 10} y1={i % 4 === 0 ? 160 : 172} x2={i * 30 + 10} y2="180" stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
    );
  }
  return <div className={`${comun} opacity-[0.4] [background-image:radial-gradient(var(--rule)_1px,transparent_1.2px)] [background-size:16px_16px] [mask-image:linear-gradient(90deg,transparent,black_45%,black)]`} aria-hidden="true" />;
}

export function SectionHero({ patron, meta, titulo, children, cifras = [], nivel, estado }: SectionHeroProps) {
  return (
    <Motion className="relative overflow-hidden border-b border-rule-soft">
      <Patron patron={patron} />
      <div className="relative px-5 pb-6 pt-7 sm:px-6">
        <p className="meta" data-reveal>
          {meta}
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-ink" data-reveal>
          {titulo}
          {estado ? (
            <span className="flex items-center gap-2 rounded-full border border-rule bg-ground/60 px-2.5 py-0.5 text-xs font-normal text-ink-soft">
              <span className="size-1.5 rounded-full" style={{ background: riskColor(nivel ?? null) }} aria-hidden="true" />
              {estado}
            </span>
          ) : null}
        </h1>
        {children ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft" data-reveal>
            {children}
          </p>
        ) : null}
        {cifras.length ? (
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {cifras.map((cifra) => (
              <div key={cifra.etiqueta} className="flex min-w-0 flex-col gap-1" data-reveal>
                <dt className="meta truncate">{cifra.etiqueta}</dt>
                <dd className="flex items-baseline gap-1.5">
                  {cifra.prefijo ? <span className={`readout text-2xl ${TONE_TEXT[cifra.tono ?? "neutro"]}`}>{cifra.prefijo}</span> : null}
                  {cifra.valor === null ? (
                    <span className="readout text-3xl text-ink-faint">—</span>
                  ) : (
                    <span className={`readout text-3xl font-medium tabular-nums sm:text-4xl ${TONE_TEXT[cifra.tono ?? "neutro"]}`} data-count={cifra.valor} data-decimals={cifra.decimales ?? 0}>
                      {cifra.valor.toFixed(cifra.decimales ?? 0)}
                    </span>
                  )}
                  {cifra.unidad ? <span className="text-sm text-ink-soft">{cifra.unidad}</span> : null}
                </dd>
                {cifra.detalle ? <p className="text-xs leading-snug text-ink-faint">{cifra.detalle}</p> : null}
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </Motion>
  );
}
