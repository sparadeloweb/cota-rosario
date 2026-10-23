import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TopBar } from "@/components/TopBar";
import { LiveOfflineBanner, LiveStatusPill } from "@/components/shell/LiveStatus";
import { SectionNav } from "@/components/shell/SectionNav";
import { PANEL_HOME, PANEL_SECTIONS } from "@/lib/navigation";

export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <AutoRefresh />
      <TopBar home={PANEL_HOME} workspace="panel" status={<LiveStatusPill />} />
      <SectionNav items={PANEL_SECTIONS} label="Secciones del panel" />
      <LiveOfflineBanner />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
