import Link from "next/link";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Sparkline } from "@/components/kpis/Sparkline";
import { Motion } from "@/components/motion/Motion";
import { evidenciaDePrioridad, type ParteDeSituacion, type Prioridad, type Recomendacion } from "@/lib/recomendaciones";

const PRIORITY_ORDER: readonly Prioridad[] = ["alta", "media", "baja"];
const PRIORITY_LABEL: Record<Prioridad, string> = { alta: "Ahora", media: "Hoy", baja: "Cuando se pueda" };

interface BriefingProps {
  recomendaciones: Recomendacion[];
  parte: ParteDeSituacion;
}

export function Briefing({ recomendaciones, parte }: BriefingProps) {
  const grupos = PRIORITY_ORDER.map((prioridad) => ({ prioridad, items: recomendaciones.filter((item) => item.prioridad === prioridad) })).filter((grupo) => grupo.items.length);
  return (
    <Motion className="flex flex-col gap-6">
      {grupos.map((grupo) => (
        <section key={grupo.prioridad} className="flex flex-col gap-2.5">
          <h3 className="flex items-center gap-2 text-xs font-medium text-ink" data-reveal>
            <span className="size-2 rounded-full" style={{ background: evidenciaDePrioridad(grupo.prioridad) }} aria-hidden="true" />
            {PRIORITY_LABEL[grupo.prioridad]}
            <span className="readout text-ink-faint">{grupo.items.length}</span>
          </h3>
          <ol className="flex flex-col gap-2">
            {grupo.items.map((item) => (
              <li key={item.id} className="relative overflow-hidden rounded-lg border border-rule bg-panel/60 py-3.5 pl-5 pr-4" data-reveal>
                <span className="absolute inset-y-0 left-0 w-[3px] origin-top" style={{ background: evidenciaDePrioridad(item.prioridad) }} aria-hidden="true" data-grow-y />
                <p className="text-sm font-medium text-ink">{item.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.accion}</p>
                <p className="mt-2 border-t border-rule-soft pt-2 text-[11px] leading-relaxed text-ink-faint">
                  <span className="meta mr-1.5">dato</span>
                  {item.porQue}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <figure className="rounded-lg border border-dashed border-rule bg-ground/40 px-4 py-4" data-reveal>
        <figcaption className="flex items-center justify-between gap-3">
          <span className="meta">Parte de situación para compartir</span>
          <CopyButton texto={parte.texto} />
        </figcaption>
        <blockquote className="readout mt-3 text-xs leading-relaxed text-ink-soft">{parte.texto}</blockquote>
      </figure>
    </Motion>
  );
}

interface PulseCardProps {
  href: string;
  titulo: string;
  valor: string;
  unidad?: string;
  detalle: string;
  acento?: string;
  children?: ReactNode;
}

export function PulseCard({ href, titulo, valor, unidad, detalle, acento, children }: PulseCardProps) {
  return (
    <Link href={href} className="group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-lg border border-rule bg-panel/60 px-4 py-3.5 transition-colors hover:border-ink-faint focus-visible:border-ink-faint" data-reveal>
      {acento ? <span className="absolute inset-x-0 top-0 h-px" style={{ background: acento }} aria-hidden="true" /> : null}
      <span className="flex items-center justify-between gap-2">
        <span className="meta">{titulo}</span>
        <span className="text-xs text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="readout text-2xl font-medium text-ink">{valor}</span>
        {unidad ? <span className="text-xs text-ink-soft">{unidad}</span> : null}
      </span>
      <span className="text-xs leading-snug text-ink-faint">{detalle}</span>
      {children}
    </Link>
  );
}

export function PulseGrid({ children }: { children: ReactNode }) {
  return <Motion className="grid grid-cols-2 gap-2.5">{children}</Motion>;
}

export function PulseSpark({ valores, alerta }: { valores: number[]; alerta?: number | null }) {
  return <Sparkline valores={valores} alto={32} marcas={alerta ? [{ valor: alerta, color: "var(--alerta)" }] : []} />;
}
