"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { PANEL_HOME, RESIDENTS_HOME } from "@/lib/navigation";

const TITLES: Record<string, string> = { "/": "el mapa", "/zona": "tus lugares", "/reportar": "el reporte", "/mas": "el menú", "/operaciones": "el panel", "/operaciones/pronostico": "el pronóstico" };

export default function Loading() {
  const path = usePathname();
  return (
    <div className="flex h-full flex-col">
      <TopBar home={path.startsWith(PANEL_HOME) ? PANEL_HOME : RESIDENTS_HOME} />
      <div role="status" aria-live="polite" className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-xl text-ink">Cargando {TITLES[path] ?? "la vista"}…</p>
        <p className="max-w-lg text-sm text-ink-soft">Podés seguir navegando mientras se actualiza la información.</p>
      </div>
    </div>
  );
}
