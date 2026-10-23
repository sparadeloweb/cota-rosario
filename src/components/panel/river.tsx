import { Motion } from "@/components/motion/Motion";
import type { UpstreamStation } from "@/lib/kpis";
import type { RiverStation } from "@/lib/river";
import { argentinaDateTime } from "@/lib/time";

const RULER_HEIGHT = 340;
const RULER_TOP_PAD = 14;
const RULER_BOTTOM_PAD = 10;
const TICK_STEP_M = 0.5;
const HEADROOM_M = 0.6;
const MARGIN_SCALE_M = 3;
const MARGIN_WARNING_M = 0.5;
const PERCENT = 100;

interface LevelRulerProps {
  station: RiverStation;
  range?: { min: number; max: number } | null;
}

export function LevelRuler({ station, range }: LevelRulerProps) {
  const threshold = Math.max(station.evacuation ?? 0, station.alert ?? 0);
  const ceiling = Math.ceil(Math.max(threshold, station.meters, range?.max ?? 0) + HEADROOM_M);
  const util = RULER_HEIGHT - RULER_TOP_PAD - RULER_BOTTOM_PAD;
  const y = (meters: number) => RULER_TOP_PAD + util - (Math.max(0, meters) / ceiling) * util;
  const ticks = Array.from({ length: Math.floor(ceiling / TICK_STEP_M) + 1 }, (_, i) => i * TICK_STEP_M);
  const lines = [
    { value: station.lowWater, label: "aguas bajas", color: "var(--water-deep)" },
    { value: station.alert, label: "alerta", color: "var(--alert)" },
    { value: station.evacuation, label: "evacuación", color: "var(--critical)" },
  ].filter((line): line is { value: number; label: string; color: string } => line.value !== null && line.value > 0);
  const surface = y(station.meters);

  return (
    <Motion>
      <svg viewBox={`0 0 260 ${RULER_HEIGHT}`} className="h-[340px] w-full max-w-[22rem]" role="img" aria-label={`Altura ${station.meters.toFixed(2)} metros en la escala de Rosario`}>
        <defs>
          <linearGradient id="cota-agua" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--water)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--water-deep)" stopOpacity="0.95" />
          </linearGradient>
          <pattern id="cota-olas" width="16" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 3c4 0 4-2 8-2s4 2 8 2" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="46" y={RULER_TOP_PAD} width="54" height={util} rx="10" fill="var(--panel-soft)" stroke="var(--rule)" />
        <g data-grow-y>
          <rect x="46" y={surface} width="54" height={RULER_TOP_PAD + util - surface} rx="10" fill="url(#cota-agua)" />
          <rect x="46" y={surface} width="54" height={RULER_TOP_PAD + util - surface} rx="10" fill="url(#cota-olas)" />
        </g>

        {ticks.map((value) => {
          const largest = Number.isInteger(value);
          return (
            <g key={value}>
              <line x1={largest ? 30 : 36} x2="44" y1={y(value)} y2={y(value)} stroke="var(--ink-faint)" strokeWidth={largest ? 1.2 : 0.8} />
              {largest ? (
                <text x="24" y={y(value) + 3.5} textAnchor="end" className="fill-ink-faint font-mono text-[10px]">
                  {value}
                </text>
              ) : null}
            </g>
          );
        })}

        {range ? (
          <g data-reveal>
            <line x1="112" x2="112" y1={y(range.max)} y2={y(range.min)} stroke="var(--ink-faint)" strokeWidth="1" />
            <line x1="108" x2="116" y1={y(range.max)} y2={y(range.max)} stroke="var(--ink-faint)" />
            <line x1="108" x2="116" y1={y(range.min)} y2={y(range.min)} stroke="var(--ink-faint)" />
          </g>
        ) : null}

        {lines.map((line) => (
          <g key={line.label} data-reveal>
            <line x1="40" x2="124" y1={y(line.value)} y2={y(line.value)} stroke={line.color} strokeWidth="1.4" strokeDasharray="4 3" />
            <text x="130" y={y(line.value) + 3.5} className="font-mono text-[10px]" fill={line.color}>
              {line.label} {line.value.toFixed(2)}
            </text>
          </g>
        ))}

        <g data-reveal>
          <path d={`M104 ${surface} l10 -6 v12 Z`} fill="var(--watch)" />
          <text x="130" y={surface - 4} className="fill-ink font-mono text-[15px] font-medium">
            {station.meters.toFixed(2)} m
          </text>
          <text x="130" y={surface + 11} className="fill-ink-soft font-mono text-[10px]">
            {station.trend || "sin tendencia"}
          </text>
        </g>
      </svg>
      <p className="meta mt-2">
        escala de Rosario · {argentinaDateTime(station.date)}
        {range ? ` · barra fina: rango de 210 días (${range.min.toFixed(2)}–${range.max.toFixed(2)} m)` : ""}
      </p>
    </Motion>
  );
}

function arrow(trend: string): string {
  const text = trend.toLowerCase();
  if (text.includes("crece") || text.includes("sube")) {
    return "↑";
  }
  if (text.includes("baja") || text.includes("desciende")) {
    return "↓";
  }
  return "→";
}

export function UpstreamChain({ stations }: { stations: UpstreamStation[] }) {
  return (
    <Motion>
      <ol className="relative flex flex-col">
        <span className="absolute bottom-4 left-[7px] top-4 w-px bg-gradient-to-b from-water/20 via-water/60 to-water/20" aria-hidden="true" />
        {stations.map((station) => {
          const margin = station.alertMarginM;
          const tone = margin === null ? "var(--ink-faint)" : margin <= 0 ? "var(--alert)" : margin <= MARGIN_WARNING_M ? "var(--watch)" : "var(--water)";
          const width = margin === null ? 0 : Math.min(PERCENT, (Math.max(0, margin) / MARGIN_SCALE_M) * PERCENT);
          return (
            <li key={station.name} className="relative grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5" data-reveal>
              <span className={`relative z-10 rounded-full border-2 border-ground ${station.isRosario ? "size-4 bg-ink" : "size-3.5"}`} style={station.isRosario ? undefined : { background: tone }} aria-hidden="true" />
              <div className="min-w-0">
                <p className={`truncate text-sm ${station.isRosario ? "font-medium text-ink" : "text-ink-soft"}`}>
                  {station.name}
                  {station.isRosario ? <span className="meta ml-2">acá</span> : null}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-rule-soft">
                    <span className="block h-full rounded-full" style={{ width: `${width}%`, background: tone }} data-grow-x />
                  </span>
                  <span className="readout shrink-0 text-[11px]" style={{ color: tone }}>
                    {margin === null ? "sin umbral" : margin <= 0 ? `${Math.abs(margin).toFixed(2)} m sobre alerta` : `${margin.toFixed(2)} m a alerta`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="readout text-sm text-ink">
                  {station.meters.toFixed(2)} <span className="text-ink-faint">{arrow(station.trend)}</span>
                </p>
                <p className="readout text-[10px] text-ink-faint">{argentinaDateTime(station.date)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="meta mt-3">de norte a sur · barra: margen a la alerta de cada estación, escala {MARGIN_SCALE_M} m</p>
    </Motion>
  );
}
