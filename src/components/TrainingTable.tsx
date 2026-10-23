import type { PoissonModel } from "@/lib/forecast/poisson";

const CASES_TOLERANCE = 15;
const RELATIVE_TOLERANCE = 0.35;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

interface TrainingTableProps {
  training: PoissonModel["training"];
}

function label(month: string): string {
  const [year, number] = month.split("-");
  return `${MONTHS[Number(number) - 1]} ${year.slice(2)}`;
}

export function TrainingTable({ training }: TrainingTableProps) {
  const max = Math.max(...training.map((row) => Math.max(row.cases, row.predicted)), 1);
  const hits = training.filter((row) => Math.abs(row.cases - row.predicted) <= Math.max(CASES_TOLERANCE, row.cases * RELATIVE_TOLERANCE)).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-ink-soft">
        Ajuste sobre los {training.length} meses usados para entrenar: intervenciones registradas y resultado del modelo con la lluvia de ese mes.
        En {hits} meses la diferencia queda dentro de un margen gráfico ilustrativo de 15 casos o 35 %. Esta comparación dentro de la muestra no mide precisión futura.
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.6875rem] text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-1 w-4 rounded-full bg-ink-faint" aria-hidden="true" />
          atendidos por Defensa Civil
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-4 rounded-full bg-alert/70" aria-hidden="true" />
          lo que habría dicho el modelo
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-3 xl:grid-cols-2">
        {training.map((row) => (
          <li key={row.month} className="flex flex-col gap-1 text-xs">
            <div className="flex items-baseline justify-between gap-3">
              <span className="readout whitespace-nowrap text-ink-soft">{label(row.month)}</span>
              <span className="readout text-ink">
                {row.cases} atendidos <span className="text-ink-faint">· modelo {row.predicted.toFixed(0)}</span>
              </span>
            </div>
            <span className="relative h-1 overflow-hidden rounded-full bg-rule-soft">
              <span className="absolute inset-y-0 left-0 rounded-full bg-ink-faint" style={{ width: `${(row.cases / max) * 100}%` }} />
              <span className="absolute inset-y-0 left-0 rounded-full bg-alert/70" style={{ width: `${(row.predicted / max) * 100}%` }} />
            </span>
            <span className="text-[0.6875rem] text-ink-faint">
              llovió {row.total.toFixed(0)} mm en el mes, con un pico de {row.max2h.toFixed(0)} mm en 2 h
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
