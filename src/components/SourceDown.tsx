import type { SourceFailure } from "@/lib/status";
import { argentinaTime } from "@/lib/time";

export function SourceDown({ failure }: { failure?: SourceFailure }) {
  return <div className="border-l-2 border-watch pl-3 text-xs leading-relaxed text-ink-soft">
    <p className="text-watch">Este bloque no tiene datos utilizables{failure ? ` · consulta ${argentinaTime(failure.at)}` : ""}.</p>
    <p className="mt-1">Puede faltar información o cobertura para el período solicitado. Actualizar la vista vuelve a consultar.</p>
    {failure ? <details className="mt-2"><summary className="cursor-pointer">Detalle de la fuente</summary><p className="mt-1">{failure.message}</p></details> : null}
  </div>;
}
