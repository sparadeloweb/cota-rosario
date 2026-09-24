import { CopyButton } from "@/components/CopyButton";
import { evidenciaDePrioridad, type ParteDeSituacion, type Recomendacion } from "@/lib/recomendaciones";

const PRIORIDAD_LABEL: Record<Recomendacion["prioridad"], string> = { alta: "ahora", media: "hoy", baja: "cuando se pueda" };

interface RecomendacionesProps {
  recomendaciones: Recomendacion[];
  parte: ParteDeSituacion;
}

export function Recomendaciones({ recomendaciones, parte }: RecomendacionesProps) {
  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col gap-3">
        {recomendaciones.map((recomendacion, index) => (
          <li key={recomendacion.id} className="flex gap-3 rounded-lg border border-rule bg-panel/60 px-4 py-3.5">
            <span className="readout mt-0.5 w-5 shrink-0 text-xs text-ink-faint">{String(index + 1).padStart(2, "0")}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-sm font-medium text-ink">{recomendacion.titulo}</h3>
                <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <span className="size-1.5 rounded-full" style={{ background: evidenciaDePrioridad(recomendacion.prioridad) }} aria-hidden="true" />
                  {PRIORIDAD_LABEL[recomendacion.prioridad]}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{recomendacion.accion}</p>
              <p className="text-[11px] leading-relaxed text-ink-faint">Por qué: {recomendacion.porQue}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 rounded-lg border border-rule-soft px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="meta">Parte de situación para compartir</h3>
          <CopyButton texto={parte.texto} />
        </div>
        <p className="text-xs leading-relaxed text-ink-soft">{parte.texto}</p>
      </div>
    </div>
  );
}
