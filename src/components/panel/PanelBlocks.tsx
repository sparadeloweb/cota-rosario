import type { ReactNode } from "react";
import { SourceDown } from "@/components/SourceDown";
import type { Estado, SourceFailure } from "@/lib/estado";
import type { Kpis } from "@/lib/kpis";

const CAUDAL_DECIMALS = 0;
const PERCENT = 100;

export function PanelHeader({ meta, titulo, children }: { meta: string; titulo: string; children?: ReactNode }) {
  return (
    <section className="px-5 py-6 sm:px-6">
      <p className="meta">{meta}</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{titulo}</h1>
      {children ? <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p> : null}
    </section>
  );
}

export function PanelSection({ titulo, nota, children, className = "" }: { titulo: string; nota?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`hairline px-5 py-6 sm:px-6 ${className}`}>
      <h2 className="meta">{titulo}</h2>
      {nota ? <p className="mt-2 text-xs leading-relaxed text-ink-soft">{nota}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PanelPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl pb-10">{children}</div>
    </div>
  );
}

export function CaudalBlock({ caudal, falla }: { caudal: Estado["caudal"]; falla?: SourceFailure }) {
  if (!caudal) {
    return <SourceDown falla={falla} />;
  }
  const maximo = Math.max(...caudal.dias.map((dia) => dia.caudal), 1);
  return (
    <>
      <div className="flex items-baseline gap-2.5">
        <span className="readout text-3xl font-medium text-ink">{caudal.actual === null ? "—" : caudal.actual.toFixed(CAUDAL_DECIMALS)}</span>
        <span className="text-sm text-ink-soft">m³/s</span>
        <span className="meta ml-auto">próximos 7 días</span>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {caudal.dias.map((dia) => (
          <li key={dia.fecha} className="flex items-center gap-3 text-xs">
            <span className="readout w-20 shrink-0 text-ink-faint">{dia.fecha.slice(5)}</span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-rule-soft">
              <span className="block h-full rounded-full bg-ink-faint" style={{ width: `${(dia.caudal / maximo) * PERCENT}%` }} />
            </span>
            <span className="readout w-16 shrink-0 text-right text-ink">{dia.caudal.toFixed(CAUDAL_DECIMALS)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ReportesResumen({ reportes }: { reportes: Kpis["reportes"] }) {
  if (!reportes) {
    return <p className="text-xs text-ink-soft">La consulta de reportes no está disponible: no se puede afirmar que no haya aportes.</p>;
  }
  if (reportes.activos === 0) {
    return <p className="text-xs text-ink-soft">Ningún reporte de vecinos en las últimas 24 horas.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ul className="flex flex-col gap-1.5 text-xs">
        {reportes.porTipo.map((tipo) => (
          <li key={tipo.tipo} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-soft">
              <span className="size-2 rounded-full" style={{ background: tipo.color }} aria-hidden="true" />
              {tipo.etiqueta}
            </span>
            <span className="readout text-ink">{tipo.cantidad}</span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-1.5 text-xs">
        {reportes.porDistrito.map((distrito) => (
          <li key={distrito.distrito} className="flex items-center justify-between gap-3">
            <span className="text-ink-soft">{distrito.distrito.charAt(0) + distrito.distrito.slice(1).toLowerCase()}</span>
            <span className="readout text-ink">{distrito.cantidad}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
