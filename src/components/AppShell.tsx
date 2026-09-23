import Link from "next/link";
import type { ReactNode } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { RISK_FILL } from "@/components/status";
import { RISK_LABEL, type RiskLevel } from "@/lib/risk";

const VISTAS = [
  { href: "/", etiqueta: "Vecinos" },
  { href: "/operaciones", etiqueta: "Operaciones" },
  { href: "/predicciones", etiqueta: "Predicciones" },
] as const;

interface AppShellProps {
  activo: string;
  nivel: RiskLevel;
  rail: ReactNode;
  lienzo: ReactNode;
  lienzoInferior?: ReactNode;
}

export function AppShell({ activo, nivel, rail, lienzo, lienzoInferior }: AppShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="glass-rail z-40 flex shrink-0 items-center gap-4 border-b border-rule px-4 py-2.5 sm:gap-6 sm:px-5">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="text-base font-semibold tracking-tight text-ink">Cota</span>
          <span className="meta hidden sm:inline">Rosario</span>
        </Link>

        <nav aria-label="Vistas" className="flex items-center gap-3 sm:gap-4">
          {VISTAS.map((vista) => {
            const esActivo = vista.href === activo;
            return (
              <Link
                key={vista.href}
                href={vista.href}
                aria-current={esActivo ? "page" : undefined}
                className={`whitespace-nowrap border-b py-1 text-sm transition-colors ${
                  esActivo ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {vista.etiqueta}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm" aria-label={`Estado: ${RISK_LABEL[nivel]}`}>
          <span className="size-2 rounded-full" style={{ background: RISK_FILL[nivel] }} aria-hidden="true" />
          <span className="hidden text-ink sm:inline">{RISK_LABEL[nivel]}</span>
        </span>
      </header>

      <div className="relative flex min-h-0 flex-1 lg:flex-row">
        <BottomSheet>
          {rail}
          {lienzoInferior ? <div className="hairline px-5 py-6 lg:hidden">{lienzoInferior}</div> : null}
        </BottomSheet>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">{lienzo}</div>
          {lienzoInferior ? (
            <div className="glass-rail hidden max-h-[45%] shrink-0 overflow-y-auto border-t border-rule px-5 py-5 sm:px-6 lg:block">
              {lienzoInferior}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
