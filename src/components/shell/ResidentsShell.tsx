import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TopBar } from "@/components/TopBar";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { SectionNav } from "@/components/shell/SectionNav";
import { TabBar } from "@/components/shell/TabBar";
import { RESIDENTS_HOME, RESIDENTS_TABS } from "@/lib/navigation";
import type { RiskLevel } from "@/lib/risk";

interface ResidentsShellProps {
  level?: RiskLevel | null;
  updatedAt?: string;
  children: ReactNode;
}

export function ResidentsShell({ level, updatedAt, children }: ResidentsShellProps) {
  return (
    <div className="with-tabbar flex h-full flex-col">
      <AutoRefresh />
      <TopBar
        home={RESIDENTS_HOME}
        workspace="residents"
        level={level}
        updatedAt={updatedAt}
      />
      <div className="max-lg:hidden">
        <SectionNav items={RESIDENTS_TABS} label="Secciones" />
      </div>
      <OfflineBanner updatedAt={updatedAt} />
      <div className="flex min-h-0 flex-1 flex-col max-lg:pb-[var(--tabbar-h)]">{children}</div>
      <TabBar items={RESIDENTS_TABS} />
    </div>
  );
}
