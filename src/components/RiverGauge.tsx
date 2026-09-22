import type { RiverSnapshot } from "@/lib/river";

const SCALE_HEADROOM = 1.15;
const MIN_SCALE_METERS = 6;

interface Marca {
  etiqueta: string;
  valor: number;
  color: string;
}

interface RiverGaugeProps {
  rio: RiverSnapshot;
}

export function RiverGauge({ rio }: RiverGaugeProps) {
  const { estacion, margenHastaAlerta } = rio;
  const techo = Math.max(MIN_SCALE_METERS, (estacion.evacuacion ?? estacion.alerta ?? MIN_SCALE_METERS) * SCALE_HEADROOM);
  const porcentaje = (valor: number) => `${Math.min(100, Math.max(0, (valor / techo) * 100))}%`;

  const marcas: Marca[] = [
    { etiqueta: "Aguas bajas", valor: estacion.aguasBajas ?? 0, color: "var(--water-deep)" },
    { etiqueta: "Alerta", valor: estacion.alerta ?? 0, color: "var(--alerta)" },
    { etiqueta: "Evacuación", valor: estacion.evacuacion ?? 0, color: "var(--critico)" },
  ].filter((marca) => marca.valor > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="readout text-5xl font-medium text-ink">{estacion.metros.toFixed(2)}</span>
        <span className="text-lg text-ink-soft">m</span>
        <span className="meta ml-auto">{estacion.tendencia}</span>
      </div>

      <div className="relative h-40 overflow-hidden rounded-lg border border-rule bg-panel-soft">
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-water-deep/80 to-water/35"
          style={{ height: porcentaje(estacion.metros) }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 border-t border-water"
          style={{ bottom: porcentaje(estacion.metros) }}
          aria-hidden="true"
        />
        {marcas.map((marca) => (
          <div
            key={marca.etiqueta}
            className="absolute inset-x-0 border-t border-dashed"
            style={{ bottom: porcentaje(marca.valor), borderColor: marca.color }}
            aria-hidden="true"
          />
        ))}
        <span className="readout absolute left-2 top-2 text-[10px] text-ink-faint">{techo.toFixed(1)} m</span>
        <span className="readout absolute bottom-1.5 left-2 text-[10px] text-ink-faint">0 m</span>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {marcas.map((marca) => (
          <li key={marca.etiqueta} className="flex items-center gap-2 text-xs">
            <span className="h-0 w-3 border-t border-dashed" style={{ borderColor: marca.color }} aria-hidden="true" />
            <span className="text-ink-soft">{marca.etiqueta}</span>
            <span className="readout text-ink">{marca.valor.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule-soft pt-4 text-xs sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="meta">Margen a alerta</dt>
          <dd className="readout text-ink">{margenHastaAlerta === null ? "—" : `${margenHastaAlerta.toFixed(2)} m`}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="meta">Estado INA</dt>
          <dd className="text-ink">{estacion.estado || "sin declarar"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="meta">Medición</dt>
          <dd className="readout text-ink">{estacion.fecha.slice(0, 16).replace("T", " ")} UTC</dd>
        </div>
      </dl>
    </div>
  );
}
