import Link from "next/link";
import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TopBar } from "@/components/TopBar";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { SectionNav } from "@/components/shell/SectionNav";
import { HELP_HREF, PANEL_HOME, PANEL_SECTIONS, VECINOS_HOME } from "@/lib/navigation";
import type { RiskLevel } from "@/lib/risk";

interface PanelShellProps {
  nivel?: RiskLevel | null;
  actualizadoEn?: string;
  children: ReactNode;
}

export function PanelShell({ nivel, actualizadoEn, children }: PanelShellProps) {
  return (
    <div className="flex h-full flex-col">
      <AutoRefresh />
      <TopBar
        inicio={PANEL_HOME}
        nivel={nivel}
        actualizadoEn={actualizadoEn}
        centro={<span className="meta hidden sm:inline">Panel de operaciones</span>}
        acciones={
          <>
            <Link href={VECINOS_HOME} className="rounded-md border border-rule px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink">
              Vecinos
            </Link>
            <Link
              href={HELP_HREF}
              aria-label="Cómo funciona Cota"
              title="Cómo funciona"
              className="flex size-8 items-center justify-center rounded-full border border-rule text-sm text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
            >
              ?
            </Link>
          </>
        }
      />
      <SectionNav items={PANEL_SECTIONS} etiqueta="Secciones del panel" variante="row" />
      <OfflineBanner actualizadoEn={actualizadoEn} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
