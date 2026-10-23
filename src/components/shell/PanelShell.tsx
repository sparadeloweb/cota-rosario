import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TopBar } from "@/components/TopBar";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { SectionNav } from "@/components/shell/SectionNav";
import { PANEL_HOME, PANEL_SECTIONS } from "@/lib/navigation";
import type { RiskLevel } from "@/lib/risk";

interface PanelShellProps {
  level?: RiskLevel | null;
  updatedAt?: string;
  children: ReactNode;
}

export function PanelShell({ level, updatedAt, children }: PanelShellProps) {
  return (
    <div className="flex h-full flex-col">
      <AutoRefresh />
      <TopBar
        home={PANEL_HOME}
        workspace="panel"
        level={level}
        updatedAt={updatedAt}
      />
      <SectionNav items={PANEL_SECTIONS} label="Secciones del panel" />
      <OfflineBanner updatedAt={updatedAt} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
