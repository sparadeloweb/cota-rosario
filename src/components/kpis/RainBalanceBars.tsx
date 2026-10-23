import type { RainBalance } from "@/lib/rain";

const PERCENT = 100;

interface RainBalanceBarsProps {
  balance: RainBalance;
}

function formatDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function RainBalanceBars({ balance }: RainBalanceBarsProps) {
  const max = Math.max(...balance.byDay.map((day) => Math.max(day.fallenMm, day.expectedMm)), 1);
  return (
    <ul className="flex items-end gap-1.5" aria-label="Lluvia caída y prevista por día">
      {balance.byDay.map((day) => {
        const isToday = day.date === balance.localNow.slice(0, 10);
        const total = day.fallenMm + day.expectedMm;
        return (
          <li key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="readout text-[10px] text-ink-soft">{total > 0 ? total.toFixed(0) : ""}</span>
            <span className="flex h-14 w-full flex-col-reverse overflow-hidden rounded-sm bg-rule-soft">
              <span className="block w-full bg-water/80" style={{ height: `${(day.fallenMm / max) * PERCENT}%` }} />
              <span className="block w-full bg-water/30" style={{ height: `${(day.expectedMm / max) * PERCENT}%` }} />
            </span>
            <span className={`readout text-[10px] ${isToday ? "text-ink" : "text-ink-faint"}`}>{isToday ? "hoy" : formatDay(day.date)}</span>
          </li>
        );
      })}
    </ul>
  );
}
