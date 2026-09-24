import type { SourceFailure } from "@/lib/estado";
import { SOURCES } from "@/lib/sources";
import { horaArgentina } from "@/lib/time";

const ORGANISMO_CORTO: Record<string, string> = {
  ina: "al Instituto Nacional del Agua (altura del río)",
  openMeteo: "a Open-Meteo (pronóstico de lluvia)",
  glofas: "a GloFAS (caudal del Paraná)",
};

interface SourceDownProps {
  falla: SourceFailure;
}

export function SourceDown({ falla }: SourceDownProps) {
  const fuente = SOURCES[falla.fuente];
  return (
    <p className="border-l-2 border-alerta pl-3 text-xs leading-relaxed text-ink-soft" title={falla.mensaje}>
      <span className="text-alerta">No pudimos consultar {ORGANISMO_CORTO[falla.fuente] ?? fuente.organismo.split(" · ")[0]}</span> a las{" "}
      {horaArgentina(falla.en)}: su servidor devolvió un error. Volvemos a intentar cada 5 minutos; mientras tanto este bloque queda vacío antes que
      mostrar un dato viejo como si fuera de ahora.
    </p>
  );
}
