"use client";

import { useEffect, useState } from "react";
import { riskColor } from "@/components/status";
import type { Hallazgo, TerrainMeta } from "@/lib/lookup";
import { hechosDelLugar, type FactKey, type FactTone } from "@/lib/placeFacts";
import type { PlaceReader } from "@/lib/placeReader";
import type { Lugar } from "@/lib/places";
import { riskLabel, type RiskLevel } from "@/lib/risk";

const FACT_GLYPH: Record<FactKey, string> = {
  oficial: "M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20Z M9 4v13.5 M15 6.5V20",
  clima: "M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 15 M9 18l-1 2 M13 18l-1 2 M17 18l-1 2",
  relieve: "M3 18 9 9l4 5 3-3 5 7Z",
  historial: "M4 19.5h16 M7 16V11 M12 16V6 M17 16v-3",
};

const TONE_TEXT: Record<FactTone, string> = { neutro: "text-ink", atencion: "text-atencion", alerta: "text-alerta", critico: "text-critico" };
const TONE_DOT: Record<FactTone, string> = { neutro: "var(--ink-faint)", atencion: "var(--atencion)", alerta: "var(--alerta)", critico: "var(--critico)" };

interface PlaceCardProps {
  lugar: Lugar;
  lector: PlaceReader;
  terreno: TerrainMeta | null;
  nivelDeZona: (zona: string) => RiskLevel | null;
  onQuitar: () => void;
}

function titulo(texto: string): string {
  return texto.toLowerCase().replace(/(^|\s)\p{L}/gu, (letra) => letra.toUpperCase());
}

export function PlaceCard({ lugar, lector, terreno, nivelDeZona, onQuitar }: PlaceCardProps) {
  const [hallazgo, setHallazgo] = useState<Hallazgo | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    lector
      .leer(lugar.lat, lugar.lon)
      .then((lectura) => vigente && setHallazgo({ ...lectura, etiqueta: lugar.nombre, nivel: lectura.zona ? nivelDeZona(lectura.zona) : undefined }))
      .catch(() => vigente && setFallo(true));
    return () => {
      vigente = false;
    };
  }, [lector, lugar, nivelDeZona]);

  const nivel = hallazgo?.dentro ? (hallazgo.nivel ?? null) : null;
  const acento = hallazgo?.dentro ? riskColor(nivel) : "var(--rule)";
  const ubicacion = [hallazgo?.barrio ? titulo(hallazgo.barrio) : null, hallazgo?.distrito ? `distrito ${titulo(hallazgo.distrito.distrito)}` : null].filter(Boolean).join(" · ");

  return (
    <li className="relative overflow-hidden rounded-xl border border-rule bg-panel/70" data-reveal>
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: acento }} aria-hidden="true" />
      <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-medium text-ink">{lugar.nombre}</h2>
          <p className="mt-0.5 truncate text-xs text-ink-faint">{ubicacion || "Rosario"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {hallazgo?.dentro ? (
            <span className="flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 text-[11px] text-ink-soft">
              <span className="size-1.5 rounded-full" style={{ background: riskColor(nivel) }} aria-hidden="true" />
              hoy {riskLabel(nivel).toLowerCase()}
            </span>
          ) : null}
          <button type="button" onClick={onQuitar} className="rounded-md px-1.5 py-1 text-xs text-ink-faint hover:text-ink focus-visible:text-ink" aria-label={`Quitar ${lugar.nombre}`}>
            Quitar
          </button>
        </div>
      </header>
      {hallazgo ? (
        <dl className="grid grid-cols-2 border-t border-rule-soft">
          {hechosDelLugar(hallazgo, terreno).map((hecho) => (
            <div key={hecho.clave} className="flex flex-col gap-1 border-rule-soft px-4 py-3 odd:border-r [&:nth-child(n+3)]:border-t">
              <dt className="flex items-center gap-1.5 text-[11px] text-ink-faint">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={FACT_GLYPH[hecho.clave]} />
                </svg>
                {hecho.titulo}
              </dt>
              <dd className={`flex items-center gap-1.5 text-sm font-medium ${TONE_TEXT[hecho.tono]}`}>
                <span className="size-1.5 rounded-full" style={{ background: TONE_DOT[hecho.tono] }} aria-hidden="true" />
                {hecho.veredicto}
              </dd>
              <dd className="text-[11px] leading-snug text-ink-faint">{hecho.detalle}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="border-t border-rule-soft px-4 py-4">
          {fallo ? (
            <p className="text-sm text-ink-soft">No pudimos leer las capas de este lugar. Probá recargar.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3" aria-label="Leyendo las capas">
              {[0, 1, 2, 3].map((celda) => (
                <span key={celda} className="h-12 animate-pulse rounded-md bg-rule-soft" />
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
