"use client";

import { ReportPanel } from "@/components/reports/ReportPanel";
import type { ReportsState } from "@/components/reports/useReports";

const DROP_PATH = "M12 3.5c-3 4-6 7.4-6 10.6a6 6 0 0 0 12 0c0-3.2-3-6.6-6-10.6Z";

interface ReportFabProps {
  status: ReportsState;
  readOnly: boolean;
  open: boolean;
  onToggle: () => void;
}

export function ReportFab({ status, readOnly, open, onToggle }: ReportFabProps) {
  const total = status.available === true ? status.reports.length : null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Cerrar reportes de vecinos" : readOnly ? "Ver reportes de vecinos" : "Reportar agua o ver reportes de vecinos"}
      className="pointer-events-auto relative ml-auto flex size-12 shrink-0 items-center justify-center rounded-full border border-rule bg-panel/95 text-water shadow-xl backdrop-blur transition-colors active:bg-panel-soft lg:hidden"
    >
      {open ? (
        <svg viewBox="0 0 24 24" className="size-5 text-ink" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d={DROP_PATH} />
          {readOnly ? null : <path d="M12 11v6M9 14h6" strokeLinecap="round" />}
        </svg>
      )}
      {!open && total !== null && total > 0 ? (
        <span className="readout absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-water px-1 text-[0.6875rem] leading-5 text-ground">
          {total}
        </span>
      ) : null}
    </button>
  );
}

interface MobileReportPanelProps {
  status: ReportsState;
  readOnly: boolean;
}

export function MobileReportPanel({ status, readOnly }: MobileReportPanelProps) {
  return (
    <div className="max-h-[calc(100dvh-var(--sheet-peek)-12rem)] min-w-0 flex-1 overflow-y-auto lg:hidden">
      <ReportPanel status={status} readOnly={readOnly} className="max-w-none" />
    </div>
  );
}
