import { Motion } from "@/components/motion/Motion";
import type { ReportKpis } from "@/lib/kpis";
import { REPORT_TYPES, type Report } from "@/lib/reportTypes";
import { horaArgentina } from "@/lib/time";

const PERCENT = 100;
const LATEST_SHOWN = 8;

function nombreDistrito(distrito: string): string {
  return distrito.charAt(0) + distrito.slice(1).toLowerCase();
}

export function ReportMix({ reportes }: { reportes: ReportKpis }) {
  const total = reportes.activos;
  const tipos = reportes.porTipo.filter((tipo) => tipo.cantidad > 0);
  const maximoDistrito = Math.max(1, ...reportes.porDistrito.map((distrito) => distrito.cantidad));
  return (
    <Motion className="flex flex-col gap-6">
      <div>
        <div className="flex h-3 overflow-hidden rounded-full bg-rule-soft" role="img" aria-label={tipos.map((tipo) => `${tipo.etiqueta}: ${tipo.cantidad}`).join(", ")}>
          {tipos.map((tipo) => (
            <span key={tipo.tipo} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(tipo.cantidad / total) * PERCENT}%`, background: tipo.color }} data-grow-x />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {reportes.porTipo.map((tipo) => (
            <li key={tipo.tipo} className={`flex items-center justify-between gap-3 ${tipo.cantidad ? "" : "opacity-50"}`} data-reveal>
              <span className="flex items-center gap-2 text-ink-soft">
                <span className="size-2 rounded-full" style={{ background: tipo.color }} aria-hidden="true" />
                {tipo.etiqueta}
              </span>
              <span className="readout text-ink">{tipo.cantidad}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="meta">Por distrito</h3>
        <ul className="mt-3 flex flex-col gap-2 text-xs">
          {reportes.porDistrito.map((distrito) => (
            <li key={distrito.distrito} className="grid grid-cols-[7rem_minmax(0,1fr)_2rem] items-center gap-3" data-reveal>
              <span className="truncate text-ink-soft">{nombreDistrito(distrito.distrito)}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-rule-soft">
                <span className="block h-full rounded-full bg-water" style={{ width: `${(distrito.cantidad / maximoDistrito) * PERCENT}%` }} data-grow-x />
              </span>
              <span className="readout text-right text-ink">{distrito.cantidad}</span>
            </li>
          ))}
        </ul>
      </div>
    </Motion>
  );
}

export function LatestReports({ reportes }: { reportes: Report[] }) {
  const recientes = [...reportes].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, LATEST_SHOWN);
  return (
    <Motion>
      <ol className="relative flex flex-col gap-4 border-l border-rule-soft pl-5">
        {recientes.map((reporte) => {
          const tipo = REPORT_TYPES[reporte.tipo];
          return (
            <li key={reporte.id} className="relative" data-reveal>
              <span className="absolute -left-[25px] top-1 size-2.5 rounded-full ring-4 ring-ground" style={{ background: tipo.color }} aria-hidden="true" />
              <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="readout text-ink">{horaArgentina(reporte.creadoEn)}</span>
                <span className="text-ink-soft">{tipo.etiqueta}</span>
                {reporte.confirmaciones ? <span className="readout text-ink-faint">+{reporte.confirmaciones} confirman</span> : null}
              </p>
              {reporte.descripcion ? <p className="mt-1 text-sm leading-relaxed text-ink-soft">{reporte.descripcion}</p> : null}
            </li>
          );
        })}
      </ol>
      {reportes.length > LATEST_SHOWN ? <p className="meta mt-4">y {reportes.length - LATEST_SHOWN} más en el mapa</p> : null}
    </Motion>
  );
}
