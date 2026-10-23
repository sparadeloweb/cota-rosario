import type { Metadata } from "next";
import { ReportFlow } from "@/components/reports/ReportFlow";
import { VecinosShell } from "@/components/shell/VecinosShell";

export const metadata: Metadata = { title: "Reportar · Cota" };

export default function ReportarPage() {
  return (
    <VecinosShell>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-xl">
          <ReportFlow />
        </div>
      </div>
    </VecinosShell>
  );
}
