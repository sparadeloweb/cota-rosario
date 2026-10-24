import Link from "next/link";
import { ReportGlyph } from "@/components/reports/ReportGlyph";
import { howLongAgo } from "@/components/reports/useReports";
import { formatDistance } from "@/lib/lookup";
import { reportHrefFor } from "@/lib/reportFlow";
import { REPORT_TTL_HOURS, REPORT_TYPES, reportsNear, type Report } from "@/lib/reportTypes";

const NEARBY_RADIUS_M = 500;
const NEARBY_LIMIT = 3;

interface NearbyReportsProps {
  point: { lat: number; lon: number; label: string };
  reports: readonly Report[];
  available: boolean | null;
  canReport: boolean;
}

function emptyLine(available: boolean | null): string {
  if (available === null) {
    return "Consultando reportes de vecinos…";
  }
  if (available === false) {
    return "Los reportes de vecinos no están disponibles ahora.";
  }
  return `Nadie reportó agua a menos de ${NEARBY_RADIUS_M} m en ${REPORT_TTL_HOURS} h. Esto no descarta agua en la cuadra.`;
}

export function NearbyReports({ point, reports, available, canReport }: NearbyReportsProps) {
  const nearby = available === true ? reportsNear(reports, point, NEARBY_RADIUS_M) : [];
  return (
    <section className="flex flex-col gap-3 border-t border-rule px-4 py-3.5" aria-label="Reportes de vecinos cerca">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="meta text-[0.6875rem]">Vecinos cerca</h3>
        <span className="readout text-[0.6875rem] text-ink-faint">
          {available === true ? `${nearby.length} a ${NEARBY_RADIUS_M} m · ${REPORT_TTL_HOURS} h` : "—"}
        </span>
      </div>
      {nearby.length === 0 ? (
        <p className="text-xs leading-relaxed text-ink-soft">{emptyLine(available)}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {nearby.slice(0, NEARBY_LIMIT).map(({ report, meters }) => (
            <li key={report.id} className="flex items-center gap-2.5 rounded-lg border border-rule-soft bg-ground/60 px-2.5 py-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-rule bg-ground" style={{ color: REPORT_TYPES[report.type].color }}>
                <ReportGlyph type={report.type} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink">{REPORT_TYPES[report.type].label}</span>
              <span className="readout shrink-0 text-[0.6875rem] text-ink-faint">
                a {formatDistance(meters)} · {howLongAgo(report.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canReport ? (
        <Link href={reportHrefFor(point)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ground transition-opacity hover:opacity-90">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.5c-3 4-6 7.4-6 10.6a6 6 0 0 0 12 0c0-3.2-3-6.6-6-10.6Z M12 11v5M9.5 13.5h5" />
          </svg>
          Reportar agua en esta dirección
        </Link>
      ) : null}
    </section>
  );
}
