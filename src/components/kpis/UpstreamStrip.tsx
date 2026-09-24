import type { UpstreamStation } from "@/lib/kpis";

const PERCENT = 100;
const WARN_OCCUPANCY = 80;

interface UpstreamStripProps {
  estaciones: UpstreamStation[];
}

function tonoOcupacion(ocupacion: number | null): string {
  if (ocupacion === null) {
    return "bg-ink-faint";
  }
  if (ocupacion >= PERCENT) {
    return "bg-critico";
  }
  return ocupacion >= WARN_OCCUPANCY ? "bg-atencion" : "bg-water/80";
}

function flecha(tendencia: string): string {
  const valor = tendencia.toLowerCase();
  return valor === "crece" ? "↑" : valor === "baja" ? "↓" : "→";
}

export function UpstreamStrip({ estaciones }: UpstreamStripProps) {
  return (
    <ol className="flex flex-col gap-2">
      {estaciones.map((estacion) => (
        <li key={estacion.nombre} className={`grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-xs ${estacion.esRosario ? "text-ink" : "text-ink-soft"}`}>
          <span className={`truncate ${estacion.esRosario ? "font-medium" : ""}`}>{estacion.nombre}</span>
          <span className="relative h-1.5 overflow-hidden rounded-full bg-rule-soft" title={estacion.alerta ? `alerta ${estacion.alerta.toFixed(2)} m` : "sin umbral publicado"}>
            <span className={`absolute inset-y-0 left-0 rounded-full ${tonoOcupacion(estacion.ocupacionAlerta)}`} style={{ width: `${Math.min(PERCENT, estacion.ocupacionAlerta ?? 0)}%` }} />
          </span>
          <span className="readout flex items-center gap-2 whitespace-nowrap">
            <span className="text-ink">{estacion.metros.toFixed(2)}</span>
            <span className="text-ink-faint">{estacion.ocupacionAlerta === null ? "—" : `${estacion.ocupacionAlerta} %`}</span>
            <span className={estacion.tendencia.toLowerCase() === "crece" ? "text-atencion" : "text-ink-faint"}>{flecha(estacion.tendencia)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
