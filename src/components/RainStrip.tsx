import type { RainSnapshot } from "@/lib/rain";

const HOURS_SHOWN = 48;
const MIN_SCALE_MM = 4;
const TICK_EVERY = 6;

interface RainStripProps {
  rain: RainSnapshot;
}

export function RainStrip({ rain }: RainStripProps) {
  const hours = rain.hours.slice(0, HOURS_SHOWN);
  const max = Math.max(MIN_SCALE_MM, ...hours.map((hour) => hour.millimeters));
  const peak = rain.peakWindow;
  const dry = hours.every((hour) => hour.millimeters === 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="readout text-3xl font-medium text-ink">{rain.accumulated24h.toFixed(1)}</span>
        <span className="text-sm text-ink-soft">mm en 24 h</span>
        {peak ? (
          <span className="meta ml-auto">
            pico {peak.millimeters.toFixed(1)} mm/2 h
          </span>
        ) : null}
      </div>

      {dry ? (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-rule bg-panel-soft">
          <p className="text-sm text-ink-soft">Sin lluvia pronosticada en las próximas 48 horas</p>
        </div>
      ) : (
      <div className="flex h-24 items-end gap-px" role="img" aria-label={`Precipitación pronosticada, máximo ${max.toFixed(1)} milímetros por hora`}>
        {hours.map((hour) => {
          const height = Math.max(2, (hour.millimeters / max) * 100);
          const empty = hour.millimeters === 0;
          return (
            <div
              key={hour.hour}
              className={`flex-1 rounded-t-sm ${empty ? "bg-rule" : "bg-water-deep"}`}
              style={{ height: `${height}%`, opacity: empty ? 0.55 : hour.probability === null ? 0.7 : Math.max(0.5, hour.probability / 100) }}
              title={`${hour.hour.slice(5, 16).replace("T", " ")} · ${hour.millimeters.toFixed(1)} mm · ${hour.probability === null ? "probabilidad no disponible" : `${hour.probability}%`}`}
            />
          );
        })}
      </div>
      )}

      <div className="flex justify-between">
        {hours
          .filter((_, index) => index % TICK_EVERY === 0)
          .map((hour) => (
            <span key={hour.hour} className="readout text-[10px] text-ink-faint">
              {hour.hour.slice(11, 16)}
            </span>
          ))}
      </div>

      <p className="text-xs leading-relaxed text-ink-soft">
        Cada barra muestra la lluvia prevista por hora. Su opacidad indica la probabilidad cuando está disponible. El panel compara el pico de dos horas de las próximas 48 con umbrales orientativos.
      </p>
    </div>
  );
}
