import type { Metadata } from "next";
import { ReportFlow } from "@/components/reports/ReportFlow";

export const metadata: Metadata = { title: "Reportar · Cota" };

export default function ReportPage() {
  return <ReportFlow />;
}
