import { Motion } from "@/components/motion/Motion";

export interface ChartPoint {
  fecha: string;
  valor: number;
}

export interface ChartThreshold {
  valor: number;
  etiqueta: string;
  color: string;
}

interface LineAreaProps {
  puntos: ChartPoint[];
  umbrales?: ChartThreshold[];
  unidad: string;
  decimales?: number;
  desdeFuturo?: number;
  alto?: number;
  etiquetaFuturo?: string;
  margenRelativo?: number;
}

const WIDTH = 600;
const HEIGHT = 200;
const DEFAULT_MARGIN = 0.12;
const PERCENT = 100;
const MID = 2;

function fechaCorta(fecha: string): string {
  const [, mes, dia] = fecha.slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

function caminos(xy: readonly (readonly [number, number])[]) {
  const linea = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = xy.length ? `${linea} L${xy[xy.length - 1][0].toFixed(1)} ${HEIGHT} L${xy[0][0].toFixed(1)} ${HEIGHT} Z` : "";
  return { linea, area };
}

export function LineArea({ puntos, umbrales = [], unidad, decimales = 2, desdeFuturo, alto = 220, etiquetaFuturo = "pronóstico", margenRelativo = DEFAULT_MARGIN }: LineAreaProps) {
  if (puntos.length < 2) {
    return <p className="text-xs text-ink-soft">No hay suficientes lecturas para dibujar la serie.</p>;
  }
  const valores = puntos.map((punto) => punto.valor);
  const umbralesVisibles = umbrales.filter((umbral) => umbral.valor > 0);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores, ...umbralesVisibles.map((umbral) => umbral.valor));
  const rango = Math.max(maximo - minimo, Math.abs(maximo) * 0.05, 0.1);
  const piso = minimo - rango * margenRelativo;
  const techo = maximo + rango * margenRelativo;
  const escalaY = (valor: number) => HEIGHT - ((valor - piso) / (techo - piso)) * HEIGHT;
  const altura = (valor: number) => ((valor - piso) / (techo - piso)) * PERCENT;
  const corte = desdeFuturo !== undefined && desdeFuturo > 0 && desdeFuturo < puntos.length ? desdeFuturo : null;
  const paso = WIDTH / (puntos.length - 1);
  const xy = puntos.map((punto, i) => [i * paso, escalaY(punto.valor)] as const);
  const { linea, area } = caminos(corte === null ? xy : xy.slice(0, corte + 1));
  const futuroCamino = corte === null ? null : caminos(xy.slice(corte));
  const ultimo = puntos[corte ?? puntos.length - 1];
  const ultimoX = ((corte ?? puntos.length - 1) / (puntos.length - 1)) * PERCENT;
  const etiquetasX = [puntos[0], puntos[Math.floor(puntos.length / MID)], puntos[puntos.length - 1]];

  return (
    <Motion>
      <div className="relative" style={{ height: alto }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="cota-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--water)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--water)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#cota-area)" data-reveal />
          <path d={linea} fill="none" stroke="var(--water)" strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} data-draw />
          {futuroCamino ? (
            <g>
              <path d={futuroCamino.area} fill="url(#cota-area)" opacity="0.45" data-reveal />
              <path d={futuroCamino.linea} fill="none" stroke="var(--water)" strokeWidth="1.6" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" opacity="0.8" data-reveal />
            </g>
          ) : null}
        </svg>

        {umbralesVisibles.map((umbral) => (
          <div key={umbral.etiqueta} className="pointer-events-none absolute inset-x-0 border-t border-dashed" style={{ bottom: `${altura(umbral.valor)}%`, borderColor: umbral.color }} data-reveal>
            <span className="readout absolute -top-4 right-0 text-[10px]" style={{ color: umbral.color }}>
              {umbral.etiqueta} {umbral.valor.toFixed(decimales)}
            </span>
          </div>
        ))}

        {corte !== null ? (
          <div className="pointer-events-none absolute inset-y-0 border-l border-rule" style={{ left: `${ultimoX}%` }} data-reveal>
            <span className="meta absolute -top-1 left-2 whitespace-nowrap text-[10px]">hoy · {etiquetaFuturo} →</span>
          </div>
        ) : null}

        <div className="pointer-events-none absolute" style={{ left: `${ultimoX}%`, bottom: `${altura(ultimo.valor)}%` }} data-reveal>
          <span className="absolute -left-1.5 -bottom-1.5 size-3 rounded-full border-2 border-ground bg-water" />
          <span className="readout absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded bg-ground/85 px-1.5 py-0.5 text-xs text-ink">
            {ultimo.valor.toFixed(decimales)} {unidad}
          </span>
        </div>
      </div>
      <div className="readout mt-2 flex justify-between text-[10px] text-ink-faint">
        {etiquetasX.map((punto, i) => (
          <span key={`${punto.fecha}-${i}`}>{fechaCorta(punto.fecha)}</span>
        ))}
      </div>
    </Motion>
  );
}

interface ColumnsProps {
  columnas: { clave: string; etiqueta: string; valor: number; secundario?: number; resaltar?: boolean; detalle?: string }[];
  unidad: string;
  decimales?: number;
  alto?: number;
  etiquetaSecundaria?: string;
  etiquetaPrimaria?: string;
}

export function Columns({ columnas, unidad, decimales = 0, alto = 160, etiquetaPrimaria, etiquetaSecundaria }: ColumnsProps) {
  const maximo = Math.max(...columnas.flatMap((columna) => [columna.valor, columna.secundario ?? 0]), 1);
  return (
    <Motion>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: alto }}>
        {columnas.map((columna) => (
          <div key={columna.clave} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
            <span className={`readout text-center text-[10px] ${columna.resaltar ? "text-ink" : "text-ink-faint"}`} data-reveal>
              {columna.valor > 0 || (columna.secundario ?? 0) > 0 ? Math.max(columna.valor, columna.secundario ?? 0).toFixed(decimales) : ""}
            </span>
            <div className="relative flex flex-1 items-end justify-center gap-0.5">
              <div className={`w-full rounded-t-sm ${columna.resaltar ? "bg-water" : "bg-water/55"}`} style={{ height: `${(columna.valor / maximo) * PERCENT}%`, minHeight: columna.valor > 0 ? 2 : 0 }} title={`${columna.etiqueta}: ${columna.valor.toFixed(decimales)} ${unidad}`} data-grow-y />
              {columna.secundario !== undefined ? (
                <div className="w-full rounded-t-sm border border-water/70 bg-water/10" style={{ height: `${(columna.secundario / maximo) * PERCENT}%`, minHeight: columna.secundario > 0 ? 2 : 0 }} title={`${columna.etiqueta}: ${columna.secundario.toFixed(decimales)} ${unidad}`} data-grow-y />
              ) : null}
            </div>
            <span className={`readout truncate text-center text-[10px] ${columna.resaltar ? "text-ink" : "text-ink-faint"}`}>{columna.etiqueta}</span>
          </div>
        ))}
      </div>
      {etiquetaPrimaria || etiquetaSecundaria ? (
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-ink-soft">
          {etiquetaPrimaria ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-water" aria-hidden="true" />
              {etiquetaPrimaria}
            </span>
          ) : null}
          {etiquetaSecundaria ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border border-water/70 bg-water/10" aria-hidden="true" />
              {etiquetaSecundaria}
            </span>
          ) : null}
        </div>
      ) : null}
    </Motion>
  );
}

export function Meter({ valor, referencia, marcas = [], unidad, decimales = 0 }: { valor: number; referencia: number; marcas?: { valor: number; etiqueta: string }[]; unidad: string; decimales?: number }) {
  const techo = Math.max(valor, referencia, ...marcas.map((marca) => marca.valor)) * 1.1 || 1;
  const pos = (cantidad: number) => `${Math.min(PERCENT, (cantidad / techo) * PERCENT)}%`;
  return (
    <Motion>
      <div className="relative h-3 overflow-visible rounded-full bg-rule-soft">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-water-deep to-water" style={{ width: pos(valor) }} data-grow-x />
        <div className="absolute -inset-y-1.5 w-px bg-ink-soft" style={{ left: pos(referencia) }} aria-hidden="true" />
        {marcas.map((marca) => (
          <div key={marca.etiqueta} className="absolute -inset-y-1 w-px border-l border-dashed border-atencion" style={{ left: pos(marca.valor) }} aria-hidden="true" />
        ))}
      </div>
      <div className="relative mt-2 h-8 text-[10px]">
        <span className="readout absolute -translate-x-1/2 text-ink-soft" style={{ left: pos(referencia) }}>
          referencia {referencia.toFixed(decimales)} {unidad}
        </span>
        {marcas.map((marca) => (
          <span key={marca.etiqueta} className="readout absolute top-4 -translate-x-1/2 whitespace-nowrap text-atencion" style={{ left: pos(marca.valor) }}>
            {marca.etiqueta}
          </span>
        ))}
      </div>
    </Motion>
  );
}
