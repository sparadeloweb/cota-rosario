import type { ReactNode } from "react";
import type { Kpis } from "@/lib/kpis";


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
