import Link from "next/link";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Sparkline } from "@/components/kpis/Sparkline";
import { Motion } from "@/components/motion/Motion";
import { priorityColor, type SituationReport, type Priority, type Recommendation } from "@/lib/recommendations";

const PRIORITY_ORDER: readonly Priority[] = ["high", "medium", "low"];
const PRIORITY_LABEL: Record<Priority, string> = { high: "Ahora", medium: "Hoy", low: "Cuando se pueda" };

interface BriefingProps {
  recommendations: Recommendation[];
  situationReport: SituationReport;
}

export function Briefing({ recommendations, situationReport }: BriefingProps) {
  const groups = PRIORITY_ORDER.map((priority) => ({ priority, items: recommendations.filter((item) => item.priority === priority) })).filter((group) => group.items.length);
  return (
    <Motion className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.priority} className="flex flex-col gap-2.5">
          <h3 className="flex items-center gap-2 text-xs font-medium text-ink" data-reveal>
            <span className="size-2 rounded-full" style={{ background: priorityColor(group.priority) }} aria-hidden="true" />
            {PRIORITY_LABEL[group.priority]}
            <span className="readout text-ink-faint">{group.items.length}</span>
          </h3>
          <ol className="flex flex-col gap-2">
            {group.items.map((item) => (
              <li key={item.id} className="relative overflow-hidden rounded-lg border border-rule bg-panel/60 py-3.5 pl-5 pr-4" data-reveal>
                <span className="absolute inset-y-0 left-0 w-[3px] origin-top" style={{ background: priorityColor(item.priority) }} aria-hidden="true" data-grow-y />
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.action}</p>
                <p className="mt-2 border-t border-rule-soft pt-2 text-[0.6875rem] leading-relaxed text-ink-faint">
                  <span className="meta mr-1.5">dato</span>
                  {item.why}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <figure className="rounded-lg border border-dashed border-rule bg-ground/40 px-4 py-4" data-reveal>
        <figcaption className="flex items-center justify-between gap-3">
          <span className="meta">Parte de situación para compartir</span>
          <CopyButton text={situationReport.text} />
        </figcaption>
        <blockquote className="readout mt-3 text-xs leading-relaxed text-ink-soft">{situationReport.text}</blockquote>
      </figure>
    </Motion>
  );
}

interface PulseCardProps {
  href: string;
  title: string;
  value: string;
  unit?: string;
  detail: string;
  accent?: string;
  children?: ReactNode;
}

export function PulseCard({ href, title, value, unit, detail, accent, children }: PulseCardProps) {
  return (
    <Link href={href} className="group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-lg border border-rule bg-panel/60 px-4 py-3.5 transition-colors hover:border-ink-faint focus-visible:border-ink-faint" data-reveal>
      {accent ? <span className="absolute inset-x-0 top-0 h-px" style={{ background: accent }} aria-hidden="true" /> : null}
      <span className="flex items-center justify-between gap-2">
        <span className="meta">{title}</span>
        <span className="text-xs text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="readout text-2xl font-medium text-ink">{value}</span>
        {unit ? <span className="text-xs text-ink-soft">{unit}</span> : null}
      </span>
      <span className="text-xs leading-snug text-ink-faint">{detail}</span>
      {children}
    </Link>
  );
}

export function PulseGrid({ children }: { children: ReactNode }) {
  return <Motion className="grid grid-cols-2 gap-2.5">{children}</Motion>;
}

export function PulseSpark({ values, alert }: { values: number[]; alert?: number | null }) {
  return <Sparkline values={values} height={32} marks={alert ? [{ value: alert, color: "var(--alert)" }] : []} />;
}
