import Link from "next/link";
import type { ReactNode } from "react";
import { RISK_FILL } from "@/components/status";
import { RISK_LABEL, type RiskLevel } from "@/lib/risk";

const VISTAS = [
  { href: "/", etiqueta: "Vecinos" },
  { href: "/operaciones", etiqueta: "Operaciones" },
] as const;

interface AppShellProps {
  activo: string;
  nivel: RiskLevel;
  rail: ReactNode;
  lienzo: ReactNode;
}

export function AppShell({ activo, nivel, rail, lienzo }: AppShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="glass-rail z-30 flex shrink-0 items-center gap-6 border-b border-rule px-4 py-2.5 sm:px-5">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="text-base font-semibold tracking-tight text-ink">Cota</span>
          <span className="meta hidden sm:inline">Rosario</span>
        </Link>

        <nav aria-label="Vistas" className="flex items-center gap-4">
          {VISTAS.map((vista) => {
            const esActivo = vista.href === activo;
            return (
              <Link
                key={vista.href}
                href={vista.href}
                aria-current={esActivo ? "page" : undefined}
                className={`border-b py-1 text-sm transition-colors ${
                  esActivo ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {vista.etiqueta}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ background: RISK_FILL[nivel] }} aria-hidden="true" />
          <span className="text-ink">{RISK_LABEL[nivel]}</span>
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        <aside className="glass-rail z-20 flex w-full shrink-0 flex-col overflow-y-auto border-rule lg:w-[27rem] lg:border-r xl:w-[30rem]">
          {rail}
        </aside>
        <div className="relative min-h-[18rem] flex-1 lg:min-h-0">{lienzo}</div>
      </div>
    </div>
  );
}
