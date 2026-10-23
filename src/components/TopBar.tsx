import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { RefreshButton } from "@/components/RefreshButton";
import { riskColor } from "@/components/status";
import { HELP_HREF, PANEL_HOME, VECINOS_HOME } from "@/lib/navigation";
import { riskLabel, type RiskLevel } from "@/lib/risk";
import { fechaHoraArgentina, horaArgentina } from "@/lib/time";

export type Workspace = "vecinos" | "panel";

const WORKSPACES: readonly { clave: Workspace; href: string; etiqueta: string }[] = [
  { clave: "vecinos", href: VECINOS_HOME, etiqueta: "Vecinos" },
  { clave: "panel", href: PANEL_HOME, etiqueta: "Operaciones" },
];

interface TopBarProps {
  inicio: string;
  espacio?: Workspace | null;
  nivel?: RiskLevel | null;
  actualizadoEn?: string;
  centro?: ReactNode;
}

function WorkspaceSwitch({ actual }: { actual: Workspace | null }) {
  return (
    <nav aria-label="Espacio" className="flex rounded-lg border border-rule bg-ground/60 p-0.5">
      {WORKSPACES.map((espacio) => {
        const activo = espacio.clave === actual;
        return (
          <Link
            key={espacio.clave}
            href={espacio.href}
            aria-current={activo ? "page" : undefined}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${activo ? "bg-panel-soft text-ink shadow-[inset_0_0_0_1px_var(--rule)]" : "text-ink-faint hover:text-ink"}`}
          >
            {espacio.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}

function StatusPill({ nivel, actualizadoEn }: { nivel: RiskLevel | null; actualizadoEn?: string }) {
  return (
    <div className="flex items-center rounded-full border border-rule bg-ground/60 py-0.5 pl-2.5 pr-0.5">
      <span
        className="flex items-center gap-2 pr-2"
        aria-label={`Estado: ${riskLabel(nivel)}${actualizadoEn ? `, consulta ${fechaHoraArgentina(actualizadoEn)}` : ""}`}
        title={actualizadoEn ? `Consulta ${fechaHoraArgentina(actualizadoEn)}, hora argentina. Revisá también la fecha de cada fuente.` : undefined}
      >
        <span className="relative flex size-2" aria-hidden="true">
          {nivel && nivel !== "normal" ? <span className="absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden" style={{ background: riskColor(nivel) }} /> : null}
          <span className="relative size-2 rounded-full" style={{ background: riskColor(nivel) }} />
        </span>
        <span className="text-[13px] text-ink max-md:hidden">{riskLabel(nivel)}</span>
        {actualizadoEn ? <span className="readout text-[11px] text-ink-faint max-sm:hidden">{horaArgentina(actualizadoEn)}</span> : null}
      </span>
      {actualizadoEn ? (
        <span className="border-l border-rule pl-0.5">
          <RefreshButton />
        </span>
      ) : (
        <span className="w-1.5" />
      )}
    </div>
  );
}

export function TopBar({ inicio, espacio, nivel, actualizadoEn, centro }: TopBarProps) {
  return (
    <header className="glass-rail z-40 grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-3 pt-[env(safe-area-inset-top)] box-content sm:gap-6 sm:px-5">
      <Link href={inicio} className="group flex items-center gap-3 rounded-lg py-1 pr-1 focus-visible:outline-offset-4" aria-label="Cota, inicio">
        <LogoMark className="transition-transform duration-300 group-hover:-translate-y-px" />
        <Wordmark />
      </Link>

      <div className="flex min-w-0 justify-center">{centro}</div>

      <div className="flex items-center justify-end gap-2">
        {nivel !== undefined ? <StatusPill nivel={nivel} actualizadoEn={actualizadoEn} /> : null}
        {espacio !== undefined ? <WorkspaceSwitch actual={espacio} /> : null}
        <Link
          href={HELP_HREF}
          aria-label="Cómo funciona Cota"
          title="Cómo funciona"
          className="flex size-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-panel-soft hover:text-ink max-sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7 M12 17h.01" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
