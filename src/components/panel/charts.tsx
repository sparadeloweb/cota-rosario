import { Motion } from "@/components/motion/Motion";

export interface ChartPoint {
  date: string;
  value: number;
}

export interface ChartThreshold {
  value: number;
  label: string;
  color: string;
}

interface LineAreaProps {
  points: ChartPoint[];
  thresholds?: ChartThreshold[];
  unit: string;
  decimals?: number;
  futureFrom?: number;
  height?: number;
  futureLabel?: string;
  relativeMargin?: number;
}

const WIDTH = 600;
const HEIGHT = 200;
const DEFAULT_MARGIN = 0.12;
const PERCENT = 100;
const MID = 2;

function shortDate(date: string): string {
  const [, month, day] = date.slice(0, 10).split("-");
  return `${day}/${month}`;
}

function paths(xy: readonly (readonly [number, number])[]) {
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = xy.length ? `${line} L${xy[xy.length - 1][0].toFixed(1)} ${HEIGHT} L${xy[0][0].toFixed(1)} ${HEIGHT} Z` : "";
  return { line, area };
}

export function LineArea({ points, thresholds = [], unit, decimals = 2, futureFrom, height = 220, futureLabel = "pronóstico", relativeMargin = DEFAULT_MARGIN }: LineAreaProps) {
  if (points.length < 2) {
    return <p className="text-xs text-ink-soft">No hay suficientes lecturas para dibujar la serie.</p>;
  }
  const values = points.map((point) => point.value);
  const visibleThresholds = thresholds.filter((threshold) => threshold.value > 0);
  const min = Math.min(...values);
  const max = Math.max(...values, ...visibleThresholds.map((threshold) => threshold.value));
  const range = Math.max(max - min, Math.abs(max) * 0.05, 0.1);
  const floor = min - range * relativeMargin;
  const ceiling = max + range * relativeMargin;
  const yScaleFor = (value: number) => HEIGHT - ((value - floor) / (ceiling - floor)) * HEIGHT;
  const heightPercent = (value: number) => ((value - floor) / (ceiling - floor)) * PERCENT;
  const closure = futureFrom !== undefined && futureFrom > 0 && futureFrom < points.length ? futureFrom : null;
  const step = WIDTH / (points.length - 1);
  const xy = points.map((point, i) => [i * step, yScaleFor(point.value)] as const);
  const { line, area } = paths(closure === null ? xy : xy.slice(0, closure + 1));
  const futurePath = closure === null ? null : paths(xy.slice(closure));
  const last = points[closure ?? points.length - 1];
  const lastX = ((closure ?? points.length - 1) / (points.length - 1)) * PERCENT;
  const xLabels = [points[0], points[Math.floor(points.length / MID)], points[points.length - 1]];

  return (
    <Motion>
      <div className="relative" style={{ height: height }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="cota-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--water)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--water)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#cota-area)" data-reveal />
          <path d={line} fill="none" stroke="var(--water)" strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} data-draw />
          {futurePath ? (
            <g>
              <path d={futurePath.area} fill="url(#cota-area)" opacity="0.45" data-reveal />
              <path d={futurePath.line} fill="none" stroke="var(--water)" strokeWidth="1.6" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" opacity="0.8" data-reveal />
            </g>
          ) : null}
        </svg>

        {visibleThresholds.map((threshold) => (
          <div key={threshold.label} className="pointer-events-none absolute inset-x-0 border-t border-dashed" style={{ bottom: `${heightPercent(threshold.value)}%`, borderColor: threshold.color }} data-reveal>
            <span className="readout absolute -top-4 right-0 text-[0.625rem]" style={{ color: threshold.color }}>
              {threshold.label} {threshold.value.toFixed(decimals)}
            </span>
          </div>
        ))}

        {closure !== null ? (
          <div className="pointer-events-none absolute inset-y-0 border-l border-rule" style={{ left: `${lastX}%` }} data-reveal>
            <span className="meta absolute -top-1 left-2 whitespace-nowrap text-[0.625rem]">hoy · {futureLabel} →</span>
          </div>
        ) : null}

        <div className="pointer-events-none absolute" style={{ left: `${lastX}%`, bottom: `${heightPercent(last.value)}%` }} data-reveal>
          <span className="absolute -left-1.5 -bottom-1.5 size-3 rounded-full border-2 border-ground bg-water" />
          <span className="readout absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded bg-ground/85 px-1.5 py-0.5 text-xs text-ink">
            {last.value.toFixed(decimals)} {unit}
          </span>
        </div>
      </div>
      <div className="readout mt-2 flex justify-between text-[0.625rem] text-ink-faint">
        {xLabels.map((point, i) => (
          <span key={`${point.date}-${i}`}>{shortDate(point.date)}</span>
        ))}
      </div>
    </Motion>
  );
}

interface ColumnsProps {
  columns: { id: string; label: string; value: number; secondary?: number; highlight?: boolean; detail?: string }[];
  unit: string;
  decimals?: number;
  height?: number;
  secondaryLabel?: string;
  primaryLabel?: string;
}

export function Columns({ columns, unit, decimals = 0, height = 160, primaryLabel, secondaryLabel }: ColumnsProps) {
  const max = Math.max(...columns.flatMap((column) => [column.value, column.secondary ?? 0]), 1);
  return (
    <Motion>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: height }}>
        {columns.map((column) => (
          <div key={column.id} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
            <span className={`readout text-center text-[0.625rem] ${column.highlight ? "text-ink" : "text-ink-faint"}`} data-reveal>
              {column.value > 0 || (column.secondary ?? 0) > 0 ? Math.max(column.value, column.secondary ?? 0).toFixed(decimals) : ""}
            </span>
            <div className="relative flex flex-1 items-end justify-center gap-0.5">
              <div className={`w-full rounded-t-sm ${column.highlight ? "bg-water" : "bg-water/55"}`} style={{ height: `${(column.value / max) * PERCENT}%`, minHeight: column.value > 0 ? 2 : 0 }} title={`${column.label}: ${column.value.toFixed(decimals)} ${unit}`} data-grow-y />
              {column.secondary !== undefined ? (
                <div className="w-full rounded-t-sm border border-water/70 bg-water/10" style={{ height: `${(column.secondary / max) * PERCENT}%`, minHeight: column.secondary > 0 ? 2 : 0 }} title={`${column.label}: ${column.secondary.toFixed(decimals)} ${unit}`} data-grow-y />
              ) : null}
            </div>
            <span className={`readout truncate text-center text-[0.625rem] ${column.highlight ? "text-ink" : "text-ink-faint"}`}>{column.label}</span>
          </div>
        ))}
      </div>
      {primaryLabel || secondaryLabel ? (
        <div className="mt-3 flex flex-wrap gap-4 text-[0.6875rem] text-ink-soft">
          {primaryLabel ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-water" aria-hidden="true" />
              {primaryLabel}
            </span>
          ) : null}
          {secondaryLabel ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border border-water/70 bg-water/10" aria-hidden="true" />
              {secondaryLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </Motion>
  );
}

export function Meter({ value, reference, marks = [], unit, decimals = 0 }: { value: number; reference: number; marks?: { value: number; label: string }[]; unit: string; decimals?: number }) {
  const ceiling = Math.max(value, reference, ...marks.map((mark) => mark.value)) * 1.1 || 1;
  const position = (count: number) => `${Math.min(PERCENT, (count / ceiling) * PERCENT)}%`;
  return (
    <Motion>
      <div className="relative h-3 overflow-visible rounded-full bg-rule-soft">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-water-deep to-water" style={{ width: position(value) }} data-grow-x />
        <div className="absolute -inset-y-1.5 w-px bg-ink-soft" style={{ left: position(reference) }} aria-hidden="true" />
        {marks.map((mark) => (
          <div key={mark.label} className="absolute -inset-y-1 w-px border-l border-dashed border-watch" style={{ left: position(mark.value) }} aria-hidden="true" />
        ))}
      </div>
      <div className="relative mt-2 h-8 text-[0.625rem]">
        <span className="readout absolute -translate-x-1/2 text-ink-soft" style={{ left: position(reference) }}>
          referencia {reference.toFixed(decimals)} {unit}
        </span>
        {marks.map((mark) => (
          <span key={mark.label} className="readout absolute top-4 -translate-x-1/2 whitespace-nowrap text-watch" style={{ left: position(mark.value) }}>
            {mark.label}
          </span>
        ))}
      </div>
    </Motion>
  );
}
