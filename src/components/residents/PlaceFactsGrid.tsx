import type { Finding, TerrainMeta } from "@/lib/lookup";
import { placeFacts, type FactKey, type FactTone } from "@/lib/placeFacts";

const FACT_GLYPH: Record<FactKey, string> = {
  official: "M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20Z M9 4v13.5 M15 6.5V20",
  climateRisk: "M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 15 M9 18l-1 2 M13 18l-1 2 M17 18l-1 2",
  relief: "M3 18 9 9l4 5 3-3 5 7Z",
  history: "M4 19.5h16 M7 16V11 M12 16V6 M17 16v-3",
};

const TONE_TEXT: Record<FactTone, string> = { neutral: "text-ink", watch: "text-watch", alert: "text-alert", critical: "text-critical" };
const TONE_DOT: Record<FactTone, string> = { neutral: "var(--ink-faint)", watch: "var(--watch)", alert: "var(--alert)", critical: "var(--critical)" };

export function PlaceFactsGrid({ finding, terrain }: { finding: Finding; terrain: TerrainMeta | null }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule-soft bg-rule-soft">
      {placeFacts(finding, terrain).map((fact) => (
        <div key={fact.id} className="flex flex-col gap-1 bg-panel px-3 py-3">
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
  );
}
