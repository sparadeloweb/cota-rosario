import type { RiverSnapshot } from "@/lib/river";
import { argentinaDateTime } from "@/lib/time";

const SCALE_HEADROOM = 1.15;
const MIN_SCALE_METERS = 6;

interface Mark {
  label: string;
  value: number;
  color: string;
}

interface RiverGaugeProps {
  river: RiverSnapshot;
}

export function RiverGauge({ river }: RiverGaugeProps) {
  const { station, marginToAlert } = river;
  const ceiling = Math.max(MIN_SCALE_METERS, (station.evacuation ?? station.alert ?? MIN_SCALE_METERS) * SCALE_HEADROOM);
  const percent = (value: number) => `${Math.min(100, Math.max(0, (value / ceiling) * 100))}%`;

  const marks: Mark[] = [
    { label: "Aguas bajas", value: station.lowWater ?? 0, color: "var(--water-deep)" },
    { label: "Alerta", value: station.alert ?? 0, color: "var(--alert)" },
    { label: "Evacuación", value: station.evacuation ?? 0, color: "var(--critical)" },
  ].filter((mark) => mark.value > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="readout text-5xl font-medium text-ink">{station.meters.toFixed(2)}</span>
        <span className="text-lg text-ink-soft">m</span>
        <span className="meta ml-auto">{station.trend}</span>
      </div>

      <div className="relative h-40 overflow-hidden rounded-lg border border-rule bg-panel-soft">
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-water-deep/80 to-water/35"
          style={{ height: percent(station.meters) }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 border-t border-water"
          style={{ bottom: percent(station.meters) }}
          aria-hidden="true"
        />
        {marks.map((mark) => (
          <div
            key={mark.label}
            className="absolute inset-x-0 border-t border-dashed"
            style={{ bottom: percent(mark.value), borderColor: mark.color }}
            aria-hidden="true"
          />
        ))}
        <span className="readout absolute left-2 top-2 text-[0.625rem] text-ink-faint">{ceiling.toFixed(1)} m</span>
        <span className="readout absolute bottom-1.5 left-2 text-[0.625rem] text-ink-faint">0 m</span>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {marks.map((mark) => (
          <li key={mark.label} className="flex items-center gap-2 text-xs">
            <span className="h-0 w-3 border-t border-dashed" style={{ borderColor: mark.color }} aria-hidden="true" />
            <span className="text-ink-soft">{mark.label}</span>
            <span className="readout text-ink">{mark.value.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule-soft pt-4 text-xs sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="meta">Margen a alerta</dt>
          <dd className="readout text-ink">{marginToAlert === null ? "—" : `${marginToAlert.toFixed(2)} m`}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="meta">Estado INA</dt>
          <dd className="text-ink">{station.status || "sin declarar"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="meta">Medición</dt>
          <dd className="readout text-ink">{argentinaDateTime(station.date)}</dd>
        </div>
      </dl>
    </div>
  );
}
