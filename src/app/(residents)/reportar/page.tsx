import type { Metadata } from "next";
import { ReportFlow } from "@/components/reports/ReportFlow";

export const metadata: Metadata = { title: "Reportar · Cota" };

export default function ReportPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex w-full flex-1 flex-col">
        <ReportFlow />
      </div>
    </div>
  );
}
