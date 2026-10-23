import type { ReactNode } from "react";

export interface KpiTile {
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  tone?: "neutral" | "watch" | "alert" | "normal";
}

interface KpiGridProps {
  tiles: KpiTile[];
  columns?: 2 | 3;
  children?: ReactNode;
}

const TONE_CLASS: Record<NonNullable<KpiTile["tone"]>, string> = {
  neutral: "text-ink",
  watch: "text-watch",
  alert: "text-alert",
  normal: "text-normal",
};

export function KpiGrid({ tiles, columns = 3, children }: KpiGridProps) {
  return (
    <div className="flex flex-col gap-4">
      <dl className={`grid gap-px overflow-hidden rounded-lg border border-rule bg-rule ${columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-1 bg-panel px-3.5 py-3">
            <dt className="meta">{tile.label}</dt>
            <dd className="flex items-baseline gap-1">
              <span className={`readout text-xl ${TONE_CLASS[tile.tone ?? "neutral"]}`}>{tile.value}</span>
              {tile.unit ? <span className="text-xs text-ink-soft">{tile.unit}</span> : null}
            </dd>
            {tile.detail ? <dd className="text-[0.6875rem] leading-snug text-ink-faint">{tile.detail}</dd> : null}
          </div>
        ))}
      </dl>
      {children}
    </div>
  );
}
