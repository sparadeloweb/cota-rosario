import type { SourceFailure } from "@/lib/estado";
import { SOURCES } from "@/lib/sources";
import { horaArgentina } from "@/lib/time";

interface SourceDownProps {
  falla: SourceFailure;
}

export function SourceDown({ falla }: SourceDownProps) {
  const fuente = SOURCES[falla.fuente];
  return (
    <p className="border-l-2 border-alerta pl-3 text-xs leading-relaxed text-ink-soft">
      <span className="text-alerta">{fuente.organismo.split(" · ")[0]} no respondió</span> a las {horaArgentina(falla.en)}. {falla.mensaje}. Este
      bloque se muestra vacío antes que con un dato inventado.
    </p>
  );
}
