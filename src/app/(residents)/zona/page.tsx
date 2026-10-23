import type { Metadata } from "next";
import { ResidentsShell } from "@/components/shell/ResidentsShell";
import { PlacesBoard } from "@/components/residents/PlacesBoard";
import { loadStatus } from "@/lib/status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi zona · Cota" };

export default async function MyAreaPage() {
  const { risk } = await loadStatus();
  return (
    <ResidentsShell level={risk.level} updatedAt={risk.assessedAt}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlacesBoard zones={risk.zones} />
      </div>
    </ResidentsShell>
  );
}
