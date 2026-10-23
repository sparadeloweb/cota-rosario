import type { FloodingForecast } from "@/lib/predictions";

const PERCENT = 100;

interface FloodingOutlookProps {
  flooding: FloodingForecast;
}

function title(text: string): string {
  return text.charAt(0) + text.slice(1).toLowerCase();
}

export function FloodingOutlook({ flooding }: FloodingOutlookProps) {
  const max = Math.max(...flooding.byDistrict.map((entry) => entry.expected), 0.1);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="readout text-5xl font-medium text-ink">{flooding.cityExpected.toFixed(1)}</span>
        <span className="text-sm leading-tight text-ink-soft">
          casos del escenario
          <br />
          a {flooding.windowDays} días
        </span>
      </div>
      <p className="text-xs leading-relaxed text-ink-soft">
        Con <span className="readout text-ink">{flooding.rain.total} mm</span> pronosticados y un pico de{" "}
        <span className="readout text-ink">{flooding.rain.max2h} mm</span> en 2 horas. Estimación propia a partir del historial de Defensa Civil y
        la lluvia de cada mes.
      </p>
      <ul className="flex flex-col gap-2">
        {flooding.byDistrict.map((entry) => (
          <li key={entry.district} className="flex items-center gap-3 text-xs">
            <span className="w-20 shrink-0 text-ink-soft">{title(entry.district)}</span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-rule-soft">
              <span className="block h-full rounded-full bg-alert/80" style={{ width: `${(entry.expected / max) * PERCENT}%` }} />
            </span>
            <span className="readout w-10 shrink-0 text-right text-ink">{entry.expected.toFixed(1)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-ink-soft">Proyección orientativa de un modelo mensual. La distribución por distrito sigue su participación histórica en los registros de Defensa Civil.</p>
    </div>
  );
}
