import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TopBar } from "@/components/TopBar";
import { LiveOfflineBanner, LiveStatusPill } from "@/components/shell/LiveStatus";
import { SectionNav } from "@/components/shell/SectionNav";
import { TabBar } from "@/components/shell/TabBar";
import { RESIDENTS_HOME, RESIDENTS_TABS } from "@/lib/navigation";

export function ResidentsShell({ children }: { children: ReactNode }) {
  return (
    <div className="with-tabbar flex h-full flex-col">
      <AutoRefresh />
      <TopBar home={RESIDENTS_HOME} workspace="residents" status={<LiveStatusPill />} />
      <div className="max-lg:hidden">
        <SectionNav items={RESIDENTS_TABS} label="Secciones" />
      </div>
      <LiveOfflineBanner />
      <div className="flex min-h-0 flex-1 flex-col max-lg:pb-[var(--tabbar-h)]">{children}</div>
      <TabBar items={RESIDENTS_TABS} />
    </div>
  );
}
