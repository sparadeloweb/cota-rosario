import type { Metadata } from "next";
import { ReportFlow } from "@/components/reports/ReportFlow";
import { draftFromQuery, type ReportQuery } from "@/lib/reportFlow";

export const metadata: Metadata = { title: "Reportar · Cota" };

export default async function ReportPage({ searchParams }: { searchParams: Promise<ReportQuery> }) {
  return <ReportFlow initialDraft={draftFromQuery(await searchParams)} />;
}
