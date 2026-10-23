import type { Metadata } from "next";
import { VecinosShell } from "@/components/shell/VecinosShell";
import { PlacesBoard } from "@/components/vecinos/PlacesBoard";
import { loadEstado } from "@/lib/estado";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi zona · Cota" };

export default async function ZonaPage() {
  const { riesgo } = await loadEstado();
  return (
    <VecinosShell nivel={riesgo.nivel} actualizadoEn={riesgo.evaluadoEn}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlacesBoard zonas={riesgo.zonas} />
      </div>
    </VecinosShell>
  );
}
