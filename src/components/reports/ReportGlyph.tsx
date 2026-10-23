import type { ReportType } from "@/lib/reportTypes";

const PATHS: Record<ReportType, string> = {
  street: "M3 16c2 0 2-1.5 4.5-1.5S10 16 12 16s2-1.5 4.5-1.5S19 16 21 16 M3 20c2 0 2-1.5 4.5-1.5S10 20 12 20s2-1.5 4.5-1.5S19 20 21 20 M7 4v7 M17 4v7",
  home: "M4 11.5 12 5l8 6.5 M6 10v9h12v-9 M6 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1",
  drain: "M5 8h14v4H5Z M8 8v4 M12 8v4 M16 8v4 M12 15v2 M12 20h.01",
  closure: "M4 9h16v5H4Z M7 9l3 5 M12 9l3 5 M17 9l3 5 M6 14v6 M18 14v6",
};

export function ReportGlyph({ type, className = "size-6" }: { type: ReportType; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[type]} />
    </svg>
  );
}
