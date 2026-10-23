import type { ReactNode } from "react";
import type { Kpis } from "@/lib/kpis";

export function PanelSection({ title, note, children, className = "" }: { title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`hairline px-5 py-6 sm:px-5 ${className}`}>
      <h2 className="meta">{title}</h2>
      {note ? <p className="mt-2 text-xs leading-relaxed text-ink-soft">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PanelPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="w-full pb-10">{children}</div>
    </div>
  );
}

export function ReportsSummary({ reports }: { reports: Kpis["reports"] }) {
  if (!reports) {
    return <p className="text-xs text-ink-soft">La consulta de reportes no está disponible: no se puede afirmar que no haya aportes.</p>;
  }
  if (reports.active === 0) {
    return <p className="text-xs text-ink-soft">Ningún reporte de vecinos en las últimas 24 horas.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ul className="flex flex-col gap-1.5 text-xs">
        {reports.byType.map((type) => (
          <li key={type.type} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-soft">
              <span className="size-2 rounded-full" style={{ background: type.color }} aria-hidden="true" />
              {type.label}
            </span>
            <span className="readout text-ink">{type.count}</span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-1.5 text-xs">
        {reports.byDistrict.map((district) => (
          <li key={district.district} className="flex items-center justify-between gap-3">
            <span className="text-ink-soft">{district.district.charAt(0) + district.district.slice(1).toLowerCase()}</span>
            <span className="readout text-ink">{district.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
