"use client";

import { useState, type ReactNode } from "react";
import { RISK_FILL } from "@/components/status";
import { ReportGlyph } from "@/components/reports/ReportGlyph";
import { REPORT_TYPES, type ReportType } from "@/lib/reportTypes";
import { RISK_LABEL, RISK_ORDER } from "@/lib/risk";

export interface LegendOverlay {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  onToggle: () => void;
  swatches: { label: string; opacity: number }[];
  note: string;
}

interface MapLegendProps {
  officialZones: number;
  overlays: LegendOverlay[];
  withReports: boolean;
}

const SUMMARY = "Clima municipal 2024: capa fija. Contornos: señal orientativa de esta consulta. Gris: evaluación incompleta.";

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 9 5-9 5-9-5 9-5Z M3 13l9 5 9-5 M3 17.5l9 5 9-5" />
    </svg>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 border-t border-rule-soft px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="meta text-[0.6875rem]">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function RiskScale({ officialZones }: { officialZones: number }) {
  return (
    <Section title="Zonas oficiales por arroyo" aside={<span className="readout text-xs text-ink-soft">{officialZones}</span>}>
      <div className="grid grid-cols-4 gap-1">
        {RISK_ORDER.map((level) => (
          <div key={level} className="flex flex-col gap-1.5">
            <span className="h-2 rounded-full border" style={{ borderColor: RISK_FILL[level], background: `${RISK_FILL[level]}55` }} aria-hidden="true" />
            <span className="text-[0.6875rem] leading-tight text-ink-soft">{RISK_LABEL[level]}</span>
          </div>
        ))}
      </div>
      <p className="text-[0.6875rem] leading-snug text-ink-faint">Contorno y relleno con el color del nivel de hoy en esa zona.</p>
    </Section>
  );
}

function LayerSwitch({ on, color }: { on: boolean; color: string }) {
  return (
    <span
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-[background-color,border-color,box-shadow] duration-200 ${on ? "" : "border-rule bg-ground group-hover:border-ink-faint"}`}
      style={on ? { background: `${color}38`, borderColor: color, boxShadow: `0 0 12px -2px ${color}80` } : undefined}
      aria-hidden="true"
    >
      <span
        className={`flex size-[1.125rem] items-center justify-center rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.6)] transition-[transform,background-color] duration-200 ease-out motion-reduce:transition-none ${on ? "translate-x-5 text-ground" : "translate-x-0 bg-ink-faint text-transparent"}`}
        style={on ? { background: color } : undefined}
      >
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5 9-10" />
        </svg>
      </span>
    </span>
  );
}

function OverlayRow({ overlay }: { overlay: LegendOverlay }) {
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={overlay.onToggle} aria-pressed={overlay.visible} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-panel-soft focus-visible:outline-offset-2">
        <span className={`size-3.5 shrink-0 rounded-[5px] border border-rule transition-opacity ${overlay.visible ? "" : "opacity-30"}`} style={{ background: overlay.color }} aria-hidden="true" />
        <span className={`min-w-0 flex-1 text-sm transition-colors ${overlay.visible ? "text-ink" : "text-ink-soft group-hover:text-ink"}`}>{overlay.label}</span>
        <LayerSwitch on={overlay.visible} color={overlay.color} />
      </button>
      <p className="text-[0.6875rem] leading-snug text-ink-faint">{overlay.note}</p>
      <div className="flex flex-wrap gap-1.5">
        {overlay.swatches.map((swatch) => (
          <span key={swatch.label} className="flex items-center gap-1.5 rounded-md border border-rule-soft bg-ground/60 px-2 py-1 text-[0.6875rem] text-ink-soft">
            <span className="h-2 w-3.5 rounded-sm" style={{ background: overlay.color, opacity: swatch.opacity }} aria-hidden="true" />
            {swatch.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReportKey() {
  return (
    <Section title="Reportes de vecinos · 24 h">
      <div className="grid grid-cols-2 gap-1.5">
        {(Object.entries(REPORT_TYPES) as [ReportType, (typeof REPORT_TYPES)[ReportType]][]).map(([id, type]) => (
          <span key={id} className="flex items-center gap-2 rounded-lg border border-rule-soft bg-ground/60 px-2 py-1.5 text-[0.6875rem] text-ink-soft">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-rule bg-ground" style={{ color: type.color }}>
              <ReportGlyph type={id} className="size-4" />
            </span>
            <span className="truncate">{type.label}</span>
          </span>
        ))}
      </div>
    </Section>
  );
}

export function MapLegend({ officialZones, overlays, withReports }: MapLegendProps) {
  const [open, setOpen] = useState(false);
  const activeLayers = overlays.filter((overlay) => overlay.visible).length;

  return (
    <div className="pointer-events-auto flex max-h-[calc(100dvh-var(--sheet-peek)-14rem)] w-full max-w-sm flex-col overflow-hidden rounded-xl border border-rule bg-panel/95 text-xs shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl lg:max-h-[min(70dvh,36rem)]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="group flex shrink-0 items-center gap-3 px-3 py-2.5 text-left max-lg:min-h-[52px]"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-rule bg-ground text-ink-soft transition-colors group-hover:text-ink">
          <LayersIcon />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm text-ink">Capas y colores del mapa</span>
          <span className="flex items-center gap-2">
            <span className="flex gap-0.5" aria-hidden="true">
              {RISK_ORDER.map((level) => (
                <span key={level} className="h-1 w-3.5 rounded-full" style={{ background: RISK_FILL[level] }} />
              ))}
            </span>
            {overlays.length > 0 ? <span className="meta text-[0.625rem]">{`${activeLayers}/${overlays.length} capas`}</span> : null}
          </span>
        </span>
        <svg viewBox="0 0 24 24" className={`size-4 shrink-0 text-ink-faint transition-transform duration-200 group-hover:text-ink ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>

      <p className={`shrink-0 border-t border-rule-soft px-4 py-2.5 text-[0.6875rem] leading-snug text-ink-soft ${open ? "" : "max-lg:hidden"}`}>{SUMMARY}</p>

      {open ? (
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <RiskScale officialZones={officialZones} />
          {overlays.length > 0 ? (
            <Section title="Capas del mapa">
              <div className="flex flex-col gap-4">
                {overlays.map((overlay) => (
                  <OverlayRow key={overlay.id} overlay={overlay} />
                ))}
              </div>
            </Section>
          ) : null}
          {withReports ? <ReportKey /> : null}
        </div>
      ) : null}
    </div>
  );
}
