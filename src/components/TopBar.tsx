import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { RefreshButton } from "@/components/RefreshButton";
import { riskColor } from "@/components/status";
import { HELP_HREF, PANEL_HOME, RESIDENTS_HOME } from "@/lib/navigation";
import { riskLabel, type RiskLevel } from "@/lib/risk";
import { argentinaDateTime, argentinaTime } from "@/lib/time";

export type Workspace = "residents" | "panel";

const WORKSPACES: readonly { id: Workspace; href: string; label: string }[] = [
  { id: "residents", href: RESIDENTS_HOME, label: "Vecinos" },
  { id: "panel", href: PANEL_HOME, label: "Operaciones" },
];

interface TopBarProps {
  home: string;
  workspace?: Workspace | null;
  status?: ReactNode;
  center?: ReactNode;
}

function WorkspaceSwitch({ current }: { current: Workspace | null }) {
  return (
    <nav aria-label="Espacio" className="flex rounded-lg border border-rule bg-ground/60 p-0.5">
      {WORKSPACES.map((workspace) => {
        const active = workspace.id === current;
        return (
          <Link
            key={workspace.id}
            href={workspace.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${active ? "bg-panel-soft text-ink shadow-[inset_0_0_0_1px_var(--rule)]" : "text-ink-faint hover:text-ink"}`}
          >
            {workspace.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StatusPill({ level, updatedAt }: { level: RiskLevel | null; updatedAt?: string }) {
  return (
    <div className="flex items-center rounded-full border border-rule bg-ground/60 py-0.5 pl-2.5 pr-0.5">
      <span
        className="flex items-center gap-2 pr-2"
        aria-label={`Estado: ${riskLabel(level)}${updatedAt ? `, consulta ${argentinaDateTime(updatedAt)}` : ""}`}
        title={updatedAt ? `Consulta ${argentinaDateTime(updatedAt)}, hora argentina. Revisá también la fecha de cada fuente.` : undefined}
      >
        <span className="relative flex size-2" aria-hidden="true">
          {level && level !== "normal" ? <span className="absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden" style={{ background: riskColor(level) }} /> : null}
          <span className="relative size-2 rounded-full" style={{ background: riskColor(level) }} />
        </span>
        <span className="text-[13px] text-ink max-md:hidden">{riskLabel(level)}</span>
        {updatedAt ? <span className="readout text-[11px] text-ink-faint max-sm:hidden">{argentinaTime(updatedAt)}</span> : null}
      </span>
      {updatedAt ? (
        <span className="border-l border-rule pl-0.5">
          <RefreshButton />
        </span>
      ) : (
        <span className="w-1.5" />
      )}
    </div>
  );
}

export function StatusPillPending() {
  return (
    <div className="flex h-8 items-center gap-2 rounded-full border border-rule bg-ground/60 px-3" role="status" aria-label="Consultando el estado">
      <span className="size-2 animate-pulse rounded-full bg-ink-faint" aria-hidden="true" />
      <span className="text-[13px] text-ink-faint max-md:hidden">Consultando…</span>
    </div>
  );
}

export function TopBar({ home, workspace, status, center }: TopBarProps) {
  return (
    <header className="glass-rail z-40 grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-3 pt-[env(safe-area-inset-top)] box-content sm:gap-6 sm:px-5">
      <Link href={home} className="group flex items-center gap-3 rounded-lg py-1 pr-1 focus-visible:outline-offset-4" aria-label="Cota, inicio">
        <LogoMark className="transition-transform duration-300 group-hover:-translate-y-px" />
        <Wordmark />
      </Link>

      <div className="flex min-w-0 justify-center">{center}</div>

      <div className="flex items-center justify-end gap-2">
        {status}
        {workspace !== undefined ? <WorkspaceSwitch current={workspace} /> : null}
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
