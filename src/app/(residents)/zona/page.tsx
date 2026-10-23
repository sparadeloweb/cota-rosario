import type { Metadata } from "next";
import { PlacesBoard } from "@/components/residents/PlacesBoard";
import { loadStatus } from "@/lib/status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi zona · Cota" };

export default async function MyAreaPage() {
  const { risk } = await loadStatus();
  return <PlacesBoard zones={risk.zones} />;
}
