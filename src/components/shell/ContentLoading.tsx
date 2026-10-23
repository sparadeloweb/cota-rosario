"use client";

import { usePathname } from "next/navigation";

const SUBJECTS: Record<string, string> = {
  "/": "el mapa",
  "/zona": "tus lugares",
  "/reportar": "el reporte",
  "/mas": "el menú",
  "/operaciones": "el resumen",
  "/operaciones/rio": "el río",
  "/operaciones/lluvia": "la lluvia",
  "/operaciones/pronostico": "el pronóstico",
  "/operaciones/reportes": "los reportes",
  "/operaciones/simulador": "el simulador",
};

const SKELETON_ROWS = 3;

export function ContentLoading() {
  const pathname = usePathname();
  return (
    <div role="status" aria-live="polite" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-6">
        <p className="meta">Cargando {SUBJECTS[pathname] ?? "la vista"}…</p>
        <div className="h-8 w-48 animate-pulse rounded-md bg-rule-soft" />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="h-3 w-20 animate-pulse rounded bg-rule-soft" />
              <div className="h-9 w-24 animate-pulse rounded-md bg-rule-soft" />
            </div>
          ))}
        </div>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-panel/60" />
        ))}
      </div>
    </div>
  );
}
