"use client";

import { useEffect, useState } from "react";
import { riskColor } from "@/components/status";
import type { Finding, TerrainMeta } from "@/lib/lookup";
import { placeFacts, type FactKey, type FactTone } from "@/lib/placeFacts";
import type { PlaceReader, PlaceReading } from "@/lib/placeReader";
import type { Place } from "@/lib/places";
import { riskLabel, type RiskLevel } from "@/lib/risk";

const FACT_GLYPH: Record<FactKey, string> = {
  official: "M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20Z M9 4v13.5 M15 6.5V20",
  climateRisk: "M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 15 M9 18l-1 2 M13 18l-1 2 M17 18l-1 2",
  relief: "M3 18 9 9l4 5 3-3 5 7Z",
  history: "M4 19.5h16 M7 16V11 M12 16V6 M17 16v-3",
};

const TONE_TEXT: Record<FactTone, string> = { neutral: "text-ink", watch: "text-watch", alert: "text-alert", critical: "text-critical" };
const TONE_DOT: Record<FactTone, string> = { neutral: "var(--ink-faint)", watch: "var(--watch)", alert: "var(--alert)", critical: "var(--critical)" };

interface PlaceCardProps {
  place: Place;
  reader: PlaceReader;
  terrain: TerrainMeta | null;
  zoneLevel: (zone: string) => RiskLevel | null;
  onRemove: () => void;
}

function title(text: string): string {
  return text.toLowerCase().replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

export function PlaceCard({ place, reader, terrain, zoneLevel, onRemove }: PlaceCardProps) {
  const [reading, setReading] = useState<PlaceReading | null>(null);
  const [failed, setFailed] = useState(false);
  const { lat, lon } = place;

  useEffect(() => {
    let isCurrent = true;
    reader
      .read(lat, lon)
      .then((result) => isCurrent && setReading(result))
      .catch(() => isCurrent && setFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [reader, lat, lon]);

  const finding: Finding | null = reading ? { ...reading, label: place.name, level: reading.zone ? zoneLevel(reading.zone) : undefined } : null;

  const level = finding?.inside ? (finding.level ?? null) : null;
  const accent = finding?.inside ? riskColor(level) : "var(--rule)";
  const locationLabel = [finding?.neighbourhood ? title(finding.neighbourhood) : null, finding?.district ? `distrito ${title(finding.district.district)}` : null].filter(Boolean).join(" · ");

  return (
    <li className="relative overflow-hidden rounded-xl border border-rule bg-panel/70" data-reveal>
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} aria-hidden="true" />
      <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-medium text-ink">{place.name}</h2>
          <p className="mt-0.5 truncate text-xs text-ink-faint">{locationLabel || "Rosario"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {finding?.inside ? (
            <span className="flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 text-[0.6875rem] text-ink-soft">
              <span className="size-1.5 rounded-full" style={{ background: riskColor(level) }} aria-hidden="true" />
              hoy {riskLabel(level).toLowerCase()}
            </span>
          ) : null}
          <button type="button" onClick={onRemove} className="rounded-md px-1.5 py-1 text-xs text-ink-faint hover:text-ink focus-visible:text-ink" aria-label={`Quitar ${place.name}`}>
            Quitar
          </button>
        </div>
      </header>
      {finding ? (
        <dl className="grid grid-cols-2 border-t border-rule-soft">
          {placeFacts(finding, terrain).map((fact) => (
            <div key={fact.id} className="flex flex-col gap-1 border-rule-soft px-4 py-3 odd:border-r [&:nth-child(n+3)]:border-t">
              <dt className="flex items-center gap-1.5 text-[0.6875rem] text-ink-faint">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={FACT_GLYPH[fact.id]} />
                </svg>
                {fact.title}
              </dt>
              <dd className={`flex items-center gap-1.5 text-sm font-medium ${TONE_TEXT[fact.tone]}`}>
                <span className="size-1.5 rounded-full" style={{ background: TONE_DOT[fact.tone] }} aria-hidden="true" />
                {fact.verdict}
              </dd>
              <dd className="text-[0.6875rem] leading-snug text-ink-faint">{fact.detail}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="border-t border-rule-soft px-4 py-4">
          {failed ? (
            <p className="text-sm text-ink-soft">No pudimos leer las capas de este lugar. Probá recargar.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3" aria-label="Leyendo las capas">
              {[0, 1, 2, 3].map((cell) => (
                <span key={cell} className="h-12 animate-pulse rounded-md bg-rule-soft" />
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
