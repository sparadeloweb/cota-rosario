import type { Metadata } from "next";
import Link from "next/link";
import { InstallButton } from "@/components/InstallButton";
import { Motion } from "@/components/motion/Motion";
import { SectionHero } from "@/components/panel/SectionHero";
import { NavGlyph } from "@/components/shell/NavGlyph";
import type { NavIcon } from "@/lib/navigation";
import { EMERGENCY_PHONE, HELP_HREF, PANEL_HOME } from "@/lib/navigation";

export const metadata: Metadata = { title: "Más · Cota" };

const LINKS: readonly { href: string; title: string; detail: string; icon: NavIcon }[] = [
  { href: HELP_HREF, title: "Cómo funciona Cota", detail: "Qué muestra cada vista, de dónde salen los datos y qué no puede saber.", icon: "map" },
  { href: `${HELP_HREF}#fuentes`, title: "Fuentes y metodología", detail: "INA, Open-Meteo, GloFAS, Municipalidad de Rosario y Defensa Civil.", icon: "river" },
  { href: PANEL_HOME, title: "Panel de operaciones", detail: "Indicadores, sugerencias, pronóstico a 7 días y simulador.", icon: "summary" },
];

const INSTALL_PERKS = ["Se abre como una app, sin barra del navegador", "Sin conexión muestra la última lectura con su hora", "Tus lugares de Mi zona quedan a un toque"] as const;

const OPEN_DATA = ["/api/status", "/api/kpis", "/api/predictions", "/api/recommendations", "/api/reports"] as const;

export default function MorePage() {
  return (

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-page flex-col pb-8">
          <SectionHero pattern="summary" meta="Cota · Rosario" title="Más">
            Emergencias, instalar la app, cómo funciona Cota y los datos abiertos.
          </SectionHero>

          <Motion className="grid gap-4 px-4 pt-5 sm:px-6 lg:grid-cols-2 lg:items-start">
            <a href={`tel:${EMERGENCY_PHONE}`} className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-critical/40 bg-critical/10 p-4 transition-colors hover:border-critical/70 lg:min-h-full lg:p-6" data-reveal>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-critical text-ground">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="meta block text-critical">Emergencias</span>
                <span className="mt-0.5 block text-lg font-medium text-ink">Defensa Civil · {EMERGENCY_PHONE}</span>
                <span className="block text-xs text-ink-soft">Si hay riesgo para personas, llamá antes de reportar.</span>
              </span>
              <span className="text-ink-soft transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </a>

            <section className="rounded-xl border border-rule bg-panel/70 p-4" data-reveal>
              <div className="flex items-start gap-4">
                <span className="relative flex h-14 w-9 shrink-0 items-start justify-center rounded-lg border border-ink-faint bg-ground pt-2" aria-hidden="true">
                  <span className="size-4 rounded-[5px] bg-water/80" />
                  <span className="absolute bottom-1.5 h-0.5 w-3 rounded-full bg-ink-faint" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-medium text-ink">Instalá Cota en el celular</h2>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {INSTALL_PERKS.map((perk) => (
                      <li key={perk} className="flex gap-2 text-xs leading-snug text-ink-soft">
                        <span className="text-water" aria-hidden="true">✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 border-t border-rule-soft pt-4">
                <InstallButton />
              </div>
            </section>

            <nav aria-label="Más secciones" className="grid overflow-hidden rounded-xl border border-rule lg:col-span-2 lg:grid-cols-3" data-reveal>
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="group flex items-center gap-3.5 border-t border-rule-soft px-4 py-3.5 transition-colors first:border-t-0 hover:bg-panel-soft lg:border-l lg:border-t-0 lg:first:border-l-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-rule text-ink-soft group-hover:text-ink">
                    <NavGlyph icon={link.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{link.title}</span>
                    <span className="block text-xs leading-snug text-ink-faint">{link.detail}</span>
                  </span>
                  <span className="text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true">›</span>
                </Link>
              ))}
            </nav>

            <section className="rounded-xl border border-dashed border-rule p-4 lg:col-span-2" data-reveal>
              <h2 className="meta">Datos abiertos</h2>
              <p className="mt-1.5 text-xs text-ink-faint">Todo lo que muestra Cota, en JSON y sin registro.</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {OPEN_DATA.map((route) => (
                  <li key={route}>
                    <a href={route} className="readout inline-block rounded-md border border-rule bg-ground px-2 py-1 text-[0.6875rem] text-ink-soft hover:border-ink-soft hover:text-ink">
                      {route}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </Motion>
        </div>
      </div>
  );
}
