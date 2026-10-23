import type { RainForecast } from "@/lib/predictions";

const PERCENT = 100;
const DAYS_PER_MONTH = 30.4;
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

interface RainOutlookProps {
  rain: RainForecast;
}

function formatDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function returnPeriod(years: number): string {
  if (years < 1.05) {
    return "año";
  }
  return years < 10 ? `${years.toFixed(1)} años` : `${Math.round(years)} años`;
}

export function RainOutlook({ rain }: RainOutlookProps) {
  const max = Math.max(...rain.days.map((day) => day.millimeters), 1);
  const currentMonth = MONTHS[rain.climatology.month - 1] ?? "";
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex items-end gap-1.5" aria-label="Lluvia diaria pronosticada">
        {rain.days.map((day) => (
          <li key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="readout text-[0.625rem] text-ink-soft">{day.millimeters > 0 ? day.millimeters.toFixed(0) : ""}</span>
            <span className="flex h-16 w-full items-end overflow-hidden rounded-sm bg-rule-soft">
              <span className="block w-full rounded-sm bg-water/70" style={{ height: `${(day.millimeters / max) * PERCENT}%` }} />
            </span>
            <span className="readout text-[0.625rem] text-ink-faint">{formatDay(day.date)}</span>
            <span className="readout text-[0.625rem] text-ink-faint">{day.probability === null ? "—" : `${day.probability} %`}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-ink-soft">
        {rain.maxDay.millimeters > 0 ? (
          <>
            El día más cargado, {formatDay(rain.maxDay.date)} con <span className="readout text-ink">{rain.maxDay.millimeters} mm</span>: una
            lluvia así, como máximo del año, se da en promedio <span className="readout text-ink">cada {returnPeriod(rain.returnPeriodYears)}</span>;
            en {rain.historicalRank.larger} de los últimos {rain.historicalRank.total} años hubo un día igual o mayor.
          </>
        ) : (
          <>No se pronostica lluvia en la semana.</>
        )}
      </p>
      <dl className="grid grid-cols-3 gap-x-4 gap-y-3 border-t border-rule-soft pt-4 text-xs sm:grid-cols-6">
        {rain.quantiles.map((quantile) => (
          <div key={quantile.periodYears} className="flex flex-col gap-0.5">
            <dt className="meta">cada {quantile.periodYears} años</dt>
            <dd className="readout text-ink">{quantile.mm.toFixed(0)} mm</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-relaxed text-ink-soft">
        La referencia histórica de {currentMonth} en el archivo de Open-Meteo es de {rain.climatology.meanMm} mm; un día de más de {rain.climatology.thresholdMm} mm pasa{" "}
        {(rain.climatology.dayProbability * DAYS_PER_MONTH).toFixed(1)} veces por mes en promedio.
      </p>
    </div>
  );
}
