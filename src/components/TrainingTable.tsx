import type { PoissonModel } from "@/lib/forecast/poisson";

const TOLERANCIA_CASOS = 15;
const TOLERANCIA_RELATIVA = 0.35;
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
  const aciertos = entrenamiento.filter((fila) => Math.abs(fila.casos - fila.predicho) <= Math.max(TOLERANCIA_CASOS, fila.casos * TOLERANCIA_RELATIVA)).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-ink-soft">
        Cómo le fue al modelo mes por mes en el pasado: cuántos anegamientos atendió Defensa Civil de verdad y cuántos habría dicho el modelo con la
        lluvia de ese mes. Acertó dentro del margen en {aciertos} de {entrenamiento.length} meses; cuando falla, suele ser porque una tormenta corta cargó
        el mes o porque llovió mucho pero repartido.
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-1 w-4 rounded-full bg-ink-faint" aria-hidden="true" />
          atendidos por Defensa Civil
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-4 rounded-full bg-alerta/70" aria-hidden="true" />
          lo que habría dicho el modelo
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        {entrenamiento.map((fila) => (
          <li key={fila.mes} className="flex flex-col gap-1 text-xs">
            <div className="flex items-baseline justify-between gap-3">
              <span className="readout text-ink-soft">{etiqueta(fila.mes)}</span>
              <span className="readout text-ink">
                {fila.casos} atendidos <span className="text-ink-faint">· modelo {fila.predicho.toFixed(0)}</span>
              </span>
            </div>
            <span className="relative h-1 overflow-hidden rounded-full bg-rule-soft">
              <span className="absolute inset-y-0 left-0 rounded-full bg-ink-faint" style={{ width: `${(fila.casos / maximo) * 100}%` }} />
              <span className="absolute inset-y-0 left-0 rounded-full bg-alerta/70" style={{ width: `${(fila.predicho / maximo) * 100}%` }} />
            </span>
            <span className="text-[11px] text-ink-faint">
              llovió {fila.total.toFixed(0)} mm en el mes, con un pico de {fila.max2h.toFixed(0)} mm en 2 h
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
