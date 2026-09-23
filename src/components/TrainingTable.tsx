import type { PoissonModel } from "@/lib/forecast/poisson";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

interface TrainingTableProps {
  entrenamiento: PoissonModel["entrenamiento"];
}

function etiqueta(mes: string): string {
  const [anio, numero] = mes.split("-");
  return `${MESES[Number(numero) - 1]} ${anio.slice(2)}`;
}

export function TrainingTable({ entrenamiento }: TrainingTableProps) {
  const maximo = Math.max(...entrenamiento.map((fila) => Math.max(fila.casos, fila.predicho)), 1);
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 xl:grid-cols-4">
      {entrenamiento.map((fila) => (
        <li key={fila.mes} className="flex flex-col gap-1 text-xs">
          <div className="flex items-baseline justify-between">
            <span className="readout text-ink-soft">{etiqueta(fila.mes)}</span>
            <span className="readout text-ink">
              {fila.casos} <span className="text-ink-faint">/ {fila.predicho.toFixed(0)}</span>
            </span>
          </div>
          <span className="relative h-1 overflow-hidden rounded-full bg-rule-soft">
            <span className="absolute inset-y-0 left-0 rounded-full bg-ink-faint" style={{ width: `${(fila.casos / maximo) * 100}%` }} />
            <span className="absolute inset-y-0 left-0 rounded-full bg-alerta/70" style={{ width: `${(fila.predicho / maximo) * 100}%` }} />
          </span>
          <span className="meta">{fila.max2h} mm/2 h · {fila.total} mm</span>
        </li>
      ))}
    </ul>
  );
}
