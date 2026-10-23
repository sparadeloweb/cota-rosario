import { Motion } from "@/components/motion/Motion";
import type { UpstreamStation } from "@/lib/kpis";
import type { RiverStation } from "@/lib/river";
import { fechaHoraArgentina } from "@/lib/time";

const RULER_HEIGHT = 340;
const RULER_TOP_PAD = 14;
const RULER_BOTTOM_PAD = 10;
const TICK_STEP_M = 0.5;
const HEADROOM_M = 0.6;
const MARGIN_SCALE_M = 3;
const MARGIN_WARNING_M = 0.5;
const PERCENT = 100;

interface LevelRulerProps {
  estacion: RiverStation;
  rango?: { minimo: number; maximo: number } | null;
}

export function LevelRuler({ estacion, rango }: LevelRulerProps) {
  const umbral = Math.max(estacion.evacuacion ?? 0, estacion.alerta ?? 0);
  const techo = Math.ceil(Math.max(umbral, estacion.metros, rango?.maximo ?? 0) + HEADROOM_M);
  const util = RULER_HEIGHT - RULER_TOP_PAD - RULER_BOTTOM_PAD;
  const y = (metros: number) => RULER_TOP_PAD + util - (Math.max(0, metros) / techo) * util;
  const ticks = Array.from({ length: Math.floor(techo / TICK_STEP_M) + 1 }, (_, i) => i * TICK_STEP_M);
  const lineas = [
    { valor: estacion.aguasBajas, etiqueta: "aguas bajas", color: "var(--water-deep)" },
    { valor: estacion.alerta, etiqueta: "alerta", color: "var(--alerta)" },
    { valor: estacion.evacuacion, etiqueta: "evacuación", color: "var(--critico)" },
  ].filter((linea): linea is { valor: number; etiqueta: string; color: string } => linea.valor !== null && linea.valor > 0);
  const superficie = y(estacion.metros);

  return (
    <Motion>
      <svg viewBox={`0 0 260 ${RULER_HEIGHT}`} className="h-[340px] w-full max-w-[22rem]" role="img" aria-label={`Altura ${estacion.metros.toFixed(2)} metros en la escala de Rosario`}>
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
          <rect x="46" y={superficie} width="54" height={RULER_TOP_PAD + util - superficie} rx="10" fill="url(#cota-agua)" />
          <rect x="46" y={superficie} width="54" height={RULER_TOP_PAD + util - superficie} rx="10" fill="url(#cota-olas)" />
        </g>

        {ticks.map((valor) => {
          const mayor = Number.isInteger(valor);
          return (
            <g key={valor}>
              <line x1={mayor ? 30 : 36} x2="44" y1={y(valor)} y2={y(valor)} stroke="var(--ink-faint)" strokeWidth={mayor ? 1.2 : 0.8} />
              {mayor ? (
                <text x="24" y={y(valor) + 3.5} textAnchor="end" className="fill-ink-faint font-mono text-[10px]">
                  {valor}
                </text>
              ) : null}
            </g>
          );
        })}

        {rango ? (
          <g data-reveal>
            <line x1="112" x2="112" y1={y(rango.maximo)} y2={y(rango.minimo)} stroke="var(--ink-faint)" strokeWidth="1" />
            <line x1="108" x2="116" y1={y(rango.maximo)} y2={y(rango.maximo)} stroke="var(--ink-faint)" />
            <line x1="108" x2="116" y1={y(rango.minimo)} y2={y(rango.minimo)} stroke="var(--ink-faint)" />
          </g>
        ) : null}

        {lineas.map((linea) => (
          <g key={linea.etiqueta} data-reveal>
            <line x1="40" x2="124" y1={y(linea.valor)} y2={y(linea.valor)} stroke={linea.color} strokeWidth="1.4" strokeDasharray="4 3" />
            <text x="130" y={y(linea.valor) + 3.5} className="font-mono text-[10px]" fill={linea.color}>
              {linea.etiqueta} {linea.valor.toFixed(2)}
            </text>
          </g>
        ))}

        <g data-reveal>
          <path d={`M104 ${superficie} l10 -6 v12 Z`} fill="var(--atencion)" />
          <text x="130" y={superficie - 4} className="fill-ink font-mono text-[15px] font-medium">
            {estacion.metros.toFixed(2)} m
          </text>
          <text x="130" y={superficie + 11} className="fill-ink-soft font-mono text-[10px]">
            {estacion.tendencia || "sin tendencia"}
          </text>
        </g>
      </svg>
      <p className="meta mt-2">
        escala de Rosario · {fechaHoraArgentina(estacion.fecha)}
        {rango ? ` · barra fina: rango de 210 días (${rango.minimo.toFixed(2)}–${rango.maximo.toFixed(2)} m)` : ""}
      </p>
    </Motion>
  );
}

function flecha(tendencia: string): string {
  const texto = tendencia.toLowerCase();
  if (texto.includes("crece") || texto.includes("sube")) {
    return "↑";
  }
  if (texto.includes("baja") || texto.includes("desciende")) {
    return "↓";
  }
  return "→";
}

export function UpstreamChain({ estaciones }: { estaciones: UpstreamStation[] }) {
  return (
    <Motion>
      <ol className="relative flex flex-col">
        <span className="absolute bottom-4 left-[7px] top-4 w-px bg-gradient-to-b from-water/20 via-water/60 to-water/20" aria-hidden="true" />
        {estaciones.map((estacion) => {
          const margen = estacion.margenAlertaM;
          const tono = margen === null ? "var(--ink-faint)" : margen <= 0 ? "var(--alerta)" : margen <= MARGIN_WARNING_M ? "var(--atencion)" : "var(--water)";
          const ancho = margen === null ? 0 : Math.min(PERCENT, (Math.max(0, margen) / MARGIN_SCALE_M) * PERCENT);
          return (
            <li key={estacion.nombre} className="relative grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5" data-reveal>
              <span className={`relative z-10 rounded-full border-2 border-ground ${estacion.esRosario ? "size-4 bg-ink" : "size-3.5"}`} style={estacion.esRosario ? undefined : { background: tono }} aria-hidden="true" />
              <div className="min-w-0">
                <p className={`truncate text-sm ${estacion.esRosario ? "font-medium text-ink" : "text-ink-soft"}`}>
                  {estacion.nombre}
                  {estacion.esRosario ? <span className="meta ml-2">acá</span> : null}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-rule-soft">
                    <span className="block h-full rounded-full" style={{ width: `${ancho}%`, background: tono }} data-grow-x />
                  </span>
                  <span className="readout shrink-0 text-[11px]" style={{ color: tono }}>
                    {margen === null ? "sin umbral" : margen <= 0 ? `${Math.abs(margen).toFixed(2)} m sobre alerta` : `${margen.toFixed(2)} m a alerta`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="readout text-sm text-ink">
                  {estacion.metros.toFixed(2)} <span className="text-ink-faint">{flecha(estacion.tendencia)}</span>
                </p>
                <p className="readout text-[10px] text-ink-faint">{fechaHoraArgentina(estacion.fecha)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="meta mt-3">de norte a sur · barra: margen a la alerta de cada estación, escala {MARGIN_SCALE_M} m</p>
    </Motion>
  );
}
