import type { DailyForecast } from "@/lib/predictions";

const WEEKDAY_LABELS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const PERCENT = 100;

interface DailyOutlookProps {
  days: DailyForecast[];
  alert: number | null;
}

function dayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]} ${day}/${month}`;
}

export function DailyOutlook({ days, alert }: DailyOutlookProps) {
  const maxRain = Math.max(...days.map((day) => day.rainMm), 1);
  const maxCases = Math.max(...days.map((day) => day.expectedFloods ?? 0), 0.1);
  return (
    <div className="overflow-x-auto"><table className="w-full text-xs">
      <thead>
        <tr className="meta text-left">
          <th className="pb-2 font-normal">Día</th>
          <th className="pb-2 font-normal">Lluvia</th>
          <th className="pb-2 font-normal">Casos del escenario</th>
          <th className="pb-2 font-normal">Río estimado</th>
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day.date} className="border-t border-rule-soft">
            <td className="py-2 pr-3 text-ink">{dayLabel(day.date)}</td>
            <td className="py-2 pr-3">
              <div className="flex items-center gap-2">
                <span className="h-1 w-24 overflow-hidden rounded-full bg-rule-soft">
                  <span className="block h-full rounded-full bg-water/70" style={{ width: `${(day.rainMm / maxRain) * PERCENT}%` }} />
                </span>
                <span className="readout text-ink">{day.rainMm.toFixed(0)} mm</span>
                <span className="readout text-ink-faint">{day.probability === null ? "sin probabilidad" : `${day.probability} %`}</span>
              </div>
            </td>
            <td className="py-2 pr-3">
              <div className="flex items-center gap-2">
                <span className="h-1 w-24 overflow-hidden rounded-full bg-rule-soft">
                  <span className="block h-full rounded-full bg-alert/80" style={{ width: `${((day.expectedFloods ?? 0) / maxCases) * PERCENT}%` }} />
                </span>
                <span className="readout text-ink">{day.expectedFloods === null ? "—" : day.expectedFloods.toFixed(1)}</span>
              </div>
            </td>
            <td className="py-2">
              {day.riverMeters === null ? (
                <span className="text-ink-faint">—</span>
              ) : (
                <span className="readout text-ink">
                  {day.riverMeters.toFixed(2)} m
                  {alert !== null ? <span className="text-ink-faint"> · {(alert - day.riverMeters).toFixed(2)} a alerta</span> : null}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}
