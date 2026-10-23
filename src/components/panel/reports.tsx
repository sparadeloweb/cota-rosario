import { Motion } from "@/components/motion/Motion";
import type { ReportKpis } from "@/lib/kpis";
import { REPORT_TYPES, type Report } from "@/lib/reportTypes";
import { argentinaTime } from "@/lib/time";

const PERCENT = 100;
const LATEST_SHOWN = 8;

function districtName(district: string): string {
  return district.charAt(0) + district.slice(1).toLowerCase();
}

export function ReportMix({ reports }: { reports: ReportKpis }) {
  const total = reports.active;
  const types = reports.byType.filter((type) => type.count > 0);
  const maxDistrict = Math.max(1, ...reports.byDistrict.map((district) => district.count));
  return (
    <Motion className="flex flex-col gap-6">
      <div>
        <div className="flex h-3 overflow-hidden rounded-full bg-rule-soft" role="img" aria-label={types.map((type) => `${type.label}: ${type.count}`).join(", ")}>
          {types.map((type) => (
            <span key={type.type} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(type.count / total) * PERCENT}%`, background: type.color }} data-grow-x />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {reports.byType.map((type) => (
            <li key={type.type} className={`flex items-center justify-between gap-3 ${type.count ? "" : "opacity-50"}`} data-reveal>
              <span className="flex items-center gap-2 text-ink-soft">
                <span className="size-2 rounded-full" style={{ background: type.color }} aria-hidden="true" />
                {type.label}
              </span>
              <span className="readout text-ink">{type.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="meta">Por distrito</h3>
        <ul className="mt-3 flex flex-col gap-2 text-xs">
          {reports.byDistrict.map((district) => (
            <li key={district.district} className="grid grid-cols-[7rem_minmax(0,1fr)_2rem] items-center gap-3" data-reveal>
              <span className="truncate text-ink-soft">{districtName(district.district)}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-rule-soft">
                <span className="block h-full rounded-full bg-water" style={{ width: `${(district.count / maxDistrict) * PERCENT}%` }} data-grow-x />
              </span>
              <span className="readout text-right text-ink">{district.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </Motion>
  );
}

export function LatestReports({ reports }: { reports: Report[] }) {
  const recent = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, LATEST_SHOWN);
  return (
    <Motion>
      <ol className="relative flex flex-col gap-4 border-l border-rule-soft pl-5">
        {recent.map((report) => {
          const type = REPORT_TYPES[report.type];
          return (
            <li key={report.id} className="relative" data-reveal>
              <span className="absolute -left-[25px] top-1 size-2.5 rounded-full ring-4 ring-ground" style={{ background: type.color }} aria-hidden="true" />
              <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="readout text-ink">{argentinaTime(report.createdAt)}</span>
                <span className="text-ink-soft">{type.label}</span>
                {report.confirmations ? <span className="readout text-ink-faint">+{report.confirmations} confirman</span> : null}
              </p>
              {report.description ? <p className="mt-1 text-sm leading-relaxed text-ink-soft">{report.description}</p> : null}
            </li>
          );
        })}
      </ol>
      {reports.length > LATEST_SHOWN ? <p className="meta mt-4">y {reports.length - LATEST_SHOWN} más en el mapa</p> : null}
    </Motion>
  );
}
