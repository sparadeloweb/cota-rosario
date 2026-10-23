import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TopBar } from "@/components/TopBar";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { SectionNav } from "@/components/shell/SectionNav";
import { TabBar } from "@/components/shell/TabBar";
import { VECINOS_HOME, VECINOS_TABS } from "@/lib/navigation";
import type { RiskLevel } from "@/lib/risk";

interface VecinosShellProps {
  nivel?: RiskLevel | null;
  actualizadoEn?: string;
  children: ReactNode;
}

export function VecinosShell({ nivel, actualizadoEn, children }: VecinosShellProps) {
  return (
    <div className="with-tabbar flex h-full flex-col">
      <AutoRefresh />
      <TopBar
        inicio={VECINOS_HOME}
        espacio="vecinos"
        nivel={nivel}
        actualizadoEn={actualizadoEn}
      />
      <div className="max-lg:hidden">
        <SectionNav items={VECINOS_TABS} etiqueta="Secciones" />
      </div>
      <OfflineBanner actualizadoEn={actualizadoEn} />
      <div className="flex min-h-0 flex-1 flex-col max-lg:pb-[var(--tabbar-h)]">{children}</div>
      <TabBar items={VECINOS_TABS} />
    </div>
  );
}
