import { RefreshButton } from "@/components/RefreshButton";
import type { Status } from "@/lib/status";
import { argentinaDateTime } from "@/lib/time";

export function DataStatus({ status }: { status: Status }) {
  const rows = [
    { name: "Paraná · INA", kind: "Lectura de estación", at: status.river?.station.date },
    { name: "Lluvia · Open-Meteo", kind: "Pronóstico modelado · 48 h", at: status.rain?.fetchedAt },
    { name: "Caudal · GloFAS", kind: "Modelo global · 7 días", at: status.discharge?.fetchedAt },
    { name: "Clima · Open-Meteo", kind: "Condiciones modeladas", at: status.weather?.measuredAt },
  ];
  return (
    <details className="border-t border-rule px-5 py-4 sm:px-6">
      <summary className="cursor-pointer text-sm text-ink">Datos de esta consulta · {rows.filter((row) => row.at).length}/{rows.length} disponibles</summary>
      <div className="mt-3 sm:hidden"><RefreshButton /></div>
      <ul className="mt-3 flex flex-col gap-3 text-xs">
        {rows.map((row) => <li key={row.name} className="flex items-start justify-between gap-3"><span className="text-ink">{row.name}<span className="mt-0.5 block text-ink-soft">{row.kind}</span></span><span className={row.at ? "readout text-ink-soft" : "text-watch"}>{row.at ? argentinaDateTime(row.at) : "No disponible"}</span></li>)}
      </ul>
      {status.failures.length ? <ul className="mt-3 space-y-2 text-xs text-watch">{status.failures.map((failure, i) => <li key={`${failure.source}-${i}`}>{failure.message}</li>)}</ul> : null}
      <p className="mt-3 text-xs text-ink-soft">Las respuestas reales se reutilizan hasta 60 segundos y conservan su fecha original. Actualizar vuelve a consultar. Disponible indica controles de formato y vigencia; la precisión depende de la fuente. Las capas cartográficas son instantáneas fijas.</p>
    </details>
  );
}
