import type { RiverForecast } from "@/lib/predictions";

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 22, left: 40 };
const Y_MARGIN_M = 0.3;
const MILLIS_PER_DAY = 86_400_000;

interface RiverProjectionProps {
  river: RiverForecast;
}

function formatDay(date: string): string {
  const [, month, day] = date.slice(0, 10).split("-");
  return `${day}/${month}`;
}

export function RiverProjection({ river }: RiverProjectionProps) {
  const points = river.history.map((reading) => ({ t: new Date(reading.date).getTime(), m: reading.meters }));
  const trend = river.trend?.projection.map((p) => ({ t: new Date(p.date).getTime(), ...p })) ?? [];
  const curve = river.curve?.projection.map((p) => ({ t: new Date(p.date).getTime(), ...p })) ?? [];
  const all = [...points.map((p) => p.t), ...trend.map((p) => p.t), ...curve.map((p) => p.t)];
  if (all.length < 2) {
    return <p className="text-xs text-ink-soft">No hay serie suficiente para proyectar.</p>;
  }
  const t0 = Math.min(...all);
  const t1 = Math.max(...all);
  const levels = [...points.map((p) => p.m), ...trend.flatMap((p) => [p.lower, p.upper]), ...curve.flatMap((p) => [p.lower, p.upper])];
  const thresholds = [river.alert, river.evacuation].filter((v): v is number => v !== null);
  const yMin = Math.min(...levels) - Y_MARGIN_M;
  const yMax = Math.max(...levels, ...thresholds.filter((u) => u <= Math.max(...levels) + 1.5)) + Y_MARGIN_M;
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * (WIDTH - PAD.left - PAD.right);
  const y = (m: number) => PAD.top + ((yMax - m) / (yMax - yMin)) * (HEIGHT - PAD.top - PAD.bottom);
  const line = (series: { t: number; m: number }[]) => series.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.m).toFixed(1)}`).join(" ");
  const band = (series: { t: number; lower: number; upper: number }[], start: { t: number; m: number }) =>
    [
      `M${x(start.t).toFixed(1)},${y(start.m).toFixed(1)}`,
      ...series.map((p) => `L${x(p.t).toFixed(1)},${y(p.upper).toFixed(1)}`),
      ...series
        .slice()
        .reverse()
        .map((p) => `L${x(p.t).toFixed(1)},${y(p.lower).toFixed(1)}`),
      "Z",
    ].join(" ");
  const last = points[points.length - 1];
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const days = Math.round((t1 - t0) / MILLIS_PER_DAY);
  const dates = [t0, t0 + (t1 - t0) / 2, t1];

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Altura del Paraná, últimos ${days} días y proyección`} className="w-full">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--rule-soft)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        {[
          { value: river.alert, color: "var(--alert)" },
          { value: river.evacuation, color: "var(--critical)" },
        ]
          .filter((u): u is { value: number; color: string } => u.value !== null && u.value >= yMin && u.value <= yMax)
          .map((u) => (
            <line key={u.color} x1={PAD.left} x2={WIDTH - PAD.right} y1={y(u.value)} y2={y(u.value)} stroke={u.color} strokeDasharray="4 4" strokeWidth="1" />
          ))}
        {last && trend.length ? <path d={band(trend, last)} fill="var(--ink-faint)" opacity="0.18" /> : null}
        {last && curve.length ? <path d={band(curve, last)} fill="var(--water)" opacity="0.18" /> : null}
        <path d={line(points)} fill="none" stroke="var(--water)" strokeWidth="1.5" />
        {last && trend.length ? (
          <path d={line([last, ...trend.map((p) => ({ t: p.t, m: p.meters }))])} fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeDasharray="5 4" />
        ) : null}
        {last && curve.length ? <path d={line([last, ...curve.map((p) => ({ t: p.t, m: p.meters }))])} fill="none" stroke="var(--water)" strokeWidth="1.5" /> : null}
        {last ? <line x1={x(last.t)} x2={x(last.t)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--rule)" strokeWidth="1" /> : null}
        {dates.map((t, i) => (
          <text key={t} x={x(t)} y={HEIGHT - 6} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
            {formatDay(new Date(t).toISOString())}
          </text>
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-[0.6875rem] text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-0 w-4 border-t" style={{ borderColor: "var(--water)" }} aria-hidden="true" />
          medido y proyección por caudal GloFAS
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0 w-4 border-t border-dashed" style={{ borderColor: "var(--ink-soft)" }} aria-hidden="true" />
          tendencia lineal {river.trend?.windowDays ?? ""} días
        </span>
        <span>bandas: ±2σ del ajuste</span>
      </figcaption>
    </figure>
  );
}
