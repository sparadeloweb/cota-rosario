import { Motion } from "@/components/motion/Motion";
import type { RainHour, RainOutlookDay, MonthRain } from "@/lib/rain";
import { argentinaTime } from "@/lib/time";

const HOURS_SHOWN = 48;
const LABEL_EVERY_HOURS = 6;
const PERCENT = 100;
const MIN_SCALE_MM = 2;
const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

interface HourlyRainProps {
  hours: RainHour[];
  peak?: { millimeters: number; from: string; until: string } | null;
}

export function HourlyRain({ hours, peak }: HourlyRainProps) {
  const visible = hours.slice(0, HOURS_SHOWN);
  if (!visible.length) {
    return <p className="text-xs text-ink-soft">El pronóstico horario no trae horas para mostrar.</p>;
  }
  const max = Math.max(MIN_SCALE_MM, ...visible.map((hour) => hour.millimeters));
  const isInPeak = (iso: string) => (peak ? iso >= peak.from && iso < peak.until : false);
  const total = visible.reduce((sum, hour) => sum + hour.millimeters, 0);

  return (
    <Motion>
      <div className="flex items-baseline justify-between gap-3">
        <p className="readout text-sm text-ink">
          <span className="text-2xl font-medium">{total.toFixed(1)}</span> mm en {visible.length} h
        </p>
        {peak ? (
          <p className="readout text-xs text-watch">
            pico {peak.millimeters.toFixed(1)} mm / 2 h · {argentinaTime(peak.from)}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex h-40 items-end gap-px">
        {visible.map((hour) => {
          const probability = hour.probability ?? 0;
          return (
            <div key={hour.hour} className="relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${argentinaTime(hour.hour)} · ${hour.millimeters.toFixed(1)} mm · probabilidad ${hour.probability ?? "sin dato"}${hour.probability === null ? "" : " %"}`}>
              {isInPeak(hour.hour) ? <span className="absolute inset-x-0 bottom-0 top-0 bg-watch/10" aria-hidden="true" /> : null}
              <span className="absolute inset-x-0 bottom-0 rounded-t-[1px] bg-water/15" style={{ height: `${probability}%` }} aria-hidden="true" data-grow-y />
              <span className="relative rounded-t-[1px] bg-water" style={{ height: `${(hour.millimeters / max) * PERCENT}%`, minHeight: hour.millimeters > 0 ? 2 : 0 }} data-grow-y />
            </div>
          );
        })}
      </div>
      <div className="readout mt-1.5 flex text-[10px] text-ink-faint">
        {visible.map((hour, i) => (
          <span key={hour.hour} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
            {i % LABEL_EVERY_HOURS === 0 ? argentinaTime(hour.hour) : ""}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-water" aria-hidden="true" />milímetros por hora</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-water/15" aria-hidden="true" />probabilidad (alto = 100 %)</span>
        {peak ? <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-watch/25" aria-hidden="true" />ventana del pico</span> : null}
      </div>
    </Motion>
  );
}

function weekday(date: string): string {
  return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
}

export function WeekRain({ days }: { days: RainOutlookDay[] }) {
  const max = Math.max(MIN_SCALE_MM, ...days.map((day) => day.millimeters));
  return (
    <Motion>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {days.map((day, i) => (
          <li key={day.date} className={`flex flex-col items-center gap-2 rounded-lg border px-1 py-3 ${i === 0 ? "border-ink-faint bg-panel-soft" : "border-rule-soft"}`} data-reveal>
            <span className={`meta text-[10px] ${i === 0 ? "text-ink" : ""}`}>{i === 0 ? "hoy" : weekday(day.date)}</span>
            <span className="relative flex h-20 w-3 items-end overflow-hidden rounded-full bg-rule-soft">
              <span className="w-full rounded-full bg-water" style={{ height: `${(day.millimeters / max) * PERCENT}%` }} data-grow-y />
            </span>
            <span className="readout text-sm text-ink">{day.millimeters.toFixed(day.millimeters < 10 ? 1 : 0)}</span>
            <span className="readout text-[10px] text-ink-faint">{day.probability === null ? "—" : `${day.probability} %`}</span>
          </li>
        ))}
      </ol>
      <p className="meta mt-3">milímetros por día · probabilidad máxima del día</p>
    </Motion>
  );
}

export function MonthProgress({ month, normalMm }: { month: MonthRain; normalMm: number }) {
  const [year, monthNumber] = month.month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const currentDay = month.until ? Number(month.until.slice(8, 10)) : month.daysWithData;
  const proRata = (normalMm * currentDay) / daysInMonth;
  const ceiling = Math.max(month.accumulatedMm, normalMm) * 1.08;
  const position = (mm: number) => `${Math.min(PERCENT, (mm / ceiling) * PERCENT)}%`;
  const ratio = Math.round((month.accumulatedMm / normalMm) * PERCENT);

  return (
    <Motion>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="readout text-ink">
          <span className="text-3xl font-medium" data-count={month.accumulatedMm} data-decimals={0}>
            {month.accumulatedMm.toFixed(0)}
          </span>{" "}
          <span className="text-sm text-ink-soft">mm acumulados</span>
        </p>
        <p className="text-sm text-ink-soft">
          <span className="readout text-ink">{ratio} %</span> de la referencia del mes
        </p>
      </div>
      <div className="relative mt-5 h-4 rounded-full bg-rule-soft">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-water-deep to-water" style={{ width: position(month.accumulatedMm) }} data-grow-x />
        <div className="absolute -inset-y-2 w-px bg-ink" style={{ left: position(normalMm) }} aria-hidden="true" />
        <div className="absolute -inset-y-1 w-px border-l border-dashed border-ink-faint" style={{ left: position(proRata) }} aria-hidden="true" />
      </div>
      <div className="relative mt-2 h-10 text-[10px]">
        <span className="readout absolute -translate-x-full whitespace-nowrap pr-1 text-ink" style={{ left: position(normalMm) }}>
          referencia del mes {normalMm.toFixed(0)} mm
        </span>
        <span className="readout absolute top-5 -translate-x-1/2 whitespace-nowrap text-ink-faint" style={{ left: position(proRata) }}>
          a esta altura · {proRata.toFixed(0)} mm
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        Datos hasta {month.until ?? "—"}{month.complete ? "" : " · cobertura parcial"}. La marca punteada reparte la referencia en partes iguales por día: es una guía, no un valor histórico.
      </p>
    </Motion>
  );
}
