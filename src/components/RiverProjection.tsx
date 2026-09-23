import type { RiverForecast } from "@/lib/predicciones";

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 22, left: 40 };
const Y_MARGIN_M = 0.3;
const MILLIS_PER_DAY = 86_400_000;

interface RiverProjectionProps {
  rio: RiverForecast;
}

function fmtDia(fecha: string): string {
  const [, mes, dia] = fecha.slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

export function RiverProjection({ rio }: RiverProjectionProps) {
  const puntos = rio.historia.map((reading) => ({ t: new Date(reading.fecha).getTime(), m: reading.metros }));
  const tendencia = rio.tendencia?.proyeccion.map((p) => ({ t: new Date(p.fecha).getTime(), ...p })) ?? [];
  const curva = rio.curva?.proyeccion.map((p) => ({ t: new Date(p.fecha).getTime(), ...p })) ?? [];
  const todos = [...puntos.map((p) => p.t), ...tendencia.map((p) => p.t), ...curva.map((p) => p.t)];
  if (todos.length < 2) {
    return <p className="text-xs text-ink-soft">No hay serie suficiente para proyectar.</p>;
  }
  const t0 = Math.min(...todos);
  const t1 = Math.max(...todos);
  const niveles = [...puntos.map((p) => p.m), ...tendencia.flatMap((p) => [p.inferior, p.superior]), ...curva.flatMap((p) => [p.inferior, p.superior])];
  const umbrales = [rio.alerta, rio.evacuacion].filter((v): v is number => v !== null);
  const yMin = Math.min(...niveles) - Y_MARGIN_M;
  const yMax = Math.max(...niveles, ...umbrales.filter((u) => u <= Math.max(...niveles) + 1.5)) + Y_MARGIN_M;
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * (WIDTH - PAD.left - PAD.right);
  const y = (m: number) => PAD.top + ((yMax - m) / (yMax - yMin)) * (HEIGHT - PAD.top - PAD.bottom);
  const line = (serie: { t: number; m: number }[]) => serie.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.m).toFixed(1)}`).join(" ");
  const band = (serie: { t: number; inferior: number; superior: number }[], start: { t: number; m: number }) =>
    [
      `M${x(start.t).toFixed(1)},${y(start.m).toFixed(1)}`,
      ...serie.map((p) => `L${x(p.t).toFixed(1)},${y(p.superior).toFixed(1)}`),
      ...serie
        .slice()
        .reverse()
        .map((p) => `L${x(p.t).toFixed(1)},${y(p.inferior).toFixed(1)}`),
      "Z",
    ].join(" ");
  const ultimo = puntos[puntos.length - 1];
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const dias = Math.round((t1 - t0) / MILLIS_PER_DAY);
  const fechas = [t0, t0 + (t1 - t0) / 2, t1];

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Altura del Paraná, últimos ${dias} días y proyección`} className="w-full">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--rule-soft)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        {[
          { valor: rio.alerta, color: "var(--alerta)" },
          { valor: rio.evacuacion, color: "var(--critico)" },
        ]
          .filter((u): u is { valor: number; color: string } => u.valor !== null && u.valor >= yMin && u.valor <= yMax)
          .map((u) => (
            <line key={u.color} x1={PAD.left} x2={WIDTH - PAD.right} y1={y(u.valor)} y2={y(u.valor)} stroke={u.color} strokeDasharray="4 4" strokeWidth="1" />
          ))}
        {ultimo && tendencia.length ? <path d={band(tendencia, ultimo)} fill="var(--ink-faint)" opacity="0.18" /> : null}
        {ultimo && curva.length ? <path d={band(curva, ultimo)} fill="var(--water)" opacity="0.18" /> : null}
        <path d={line(puntos)} fill="none" stroke="var(--water)" strokeWidth="1.5" />
        {ultimo && tendencia.length ? (
          <path d={line([ultimo, ...tendencia.map((p) => ({ t: p.t, m: p.metros }))])} fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeDasharray="5 4" />
        ) : null}
        {ultimo && curva.length ? <path d={line([ultimo, ...curva.map((p) => ({ t: p.t, m: p.metros }))])} fill="none" stroke="var(--water)" strokeWidth="1.5" /> : null}
        {ultimo ? <line x1={x(ultimo.t)} x2={x(ultimo.t)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--rule)" strokeWidth="1" /> : null}
        {fechas.map((t, i) => (
          <text key={t} x={x(t)} y={HEIGHT - 6} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
            {fmtDia(new Date(t).toISOString())}
          </text>
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-0 w-4 border-t" style={{ borderColor: "var(--water)" }} aria-hidden="true" />
          medido y proyección por caudal GloFAS
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0 w-4 border-t border-dashed" style={{ borderColor: "var(--ink-soft)" }} aria-hidden="true" />
          tendencia lineal {rio.tendencia?.ventanaDias ?? ""} días
        </span>
        <span>bandas: ±2σ del ajuste</span>
      </figcaption>
    </figure>
  );
}
