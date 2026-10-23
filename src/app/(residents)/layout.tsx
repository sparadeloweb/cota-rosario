import type { ReactNode } from "react";
import { ResidentsShell } from "@/components/shell/ResidentsShell";

export default function ResidentsLayout({ children }: { children: ReactNode }) {
  return <ResidentsShell>{children}</ResidentsShell>;
}
