import type { ReactNode } from "react";
import { PanelShell } from "@/components/shell/PanelShell";

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
