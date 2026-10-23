import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TopBar } from "@/components/TopBar";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { SectionNav } from "@/components/shell/SectionNav";
import { PANEL_HOME, PANEL_SECTIONS } from "@/lib/navigation";
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
        espacio="panel"
        nivel={nivel}
        actualizadoEn={actualizadoEn}
      />
      <SectionNav items={PANEL_SECTIONS} etiqueta="Secciones del panel" variante="row" />
      <OfflineBanner actualizadoEn={actualizadoEn} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
