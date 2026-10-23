"use client";

import { useId, useMemo, useState } from "react";
import type { RiverStation } from "@/lib/river";
import { hasUsableThresholds } from "@/lib/risk";
import { argentinaDateTime } from "@/lib/time";

const PAGE_SIZE = 25;

interface StationTableProps {
  stations: RiverStation[];
}

type Filter = "all" | "with-threshold" | "over-alert";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "with-threshold", label: "Con umbral válido" },
  { id: "over-alert", label: "Sobre alerta" },
];

export function StationTable({ stations }: StationTableProps) {
  const [filter, setFilter] = useState<Filter>("with-threshold");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const inputId = useId();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return stations.filter((station) => {
      const usable = hasUsableThresholds(station);
      if (filter === "with-threshold" && !usable) {
        return false;
      }
      if (filter === "over-alert" && (!usable || station.meters < (station.alert as number))) {
        return false;
      }
      if (term && !`${station.name} ${station.river}`.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [stations, filter, query]);

  const withThreshold = stations.filter(hasUsableThresholds).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setFilter(option.id);
              setVisible(PAGE_SIZE);
            }}
            aria-pressed={filter === option.id}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              filter === option.id ? "border-ink-soft text-ink" : "border-rule text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="Buscar estación o río"
          aria-label="Buscar estación o río"
          className="ml-auto min-w-0 flex-1 rounded-lg border border-rule bg-panel-soft px-3 py-1.5 text-xs outline-none placeholder:text-ink-faint focus:border-ink-soft sm:max-w-56 sm:flex-none"
        />
      </div>

      <p className="text-xs leading-relaxed text-ink-soft">
        Esta consulta devuelve {stations.length} estaciones; {withThreshold} tienen un umbral de alerta positivo y utilizable.
        Las restantes no se comparan con alerta. La tabla conserva sus lecturas con fecha; los indicadores de red usan sólo las de hasta 48 horas.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule text-left">
              <th className="meta px-2 pb-2">Estación</th>
              <th className="meta px-2 pb-2">Río</th>
              <th className="meta px-2 pb-2 text-right">Altura</th>
              <th className="meta px-2 pb-2 text-right">Alerta</th>
              <th className="meta px-2 pb-2 text-right">Evacuación</th>
              <th className="meta px-2 pb-2">Tendencia</th>
              <th className="meta px-2 pb-2">Medición</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, visible).map((station) => {
              const usable = hasUsableThresholds(station);
              const isOverAlert = usable && station.meters >= (station.alert as number);
              return (
                <tr key={`${station.name}-${station.river}`} className="border-b border-rule-soft">
                  <td className="px-2 py-2 text-ink">{station.name}</td>
                  <td className="px-2 py-2 text-xs text-ink-soft">{station.river}</td>
                  <td className={`readout px-2 py-2 text-right ${isOverAlert ? "text-alert" : "text-ink"}`}>{station.meters.toFixed(2)}</td>
                  <td className="readout px-2 py-2 text-right text-ink-soft">{usable ? (station.alert as number).toFixed(2) : "—"}</td>
                  <td className="readout px-2 py-2 text-right text-ink-soft">
                    {station.evacuation !== null && station.evacuation > 0 ? station.evacuation.toFixed(2) : "—"}
                  </td>
                  <td className="px-2 py-2 text-xs text-ink-soft">{station.trend}</td>
                  <td className="readout whitespace-nowrap px-2 py-2 text-xs text-ink-soft">{Number.isFinite(Date.parse(station.date)) ? argentinaDateTime(station.date) : "Sin fecha válida"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="meta">
          {Math.min(visible, filtered.length)} de {filtered.length}
        </span>
        {visible < filtered.length ? (
          <button type="button" onClick={() => setVisible((current) => current + PAGE_SIZE)} className="text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
            Ver más
          </button>
        ) : null}
      </div>
    </div>
  );
}
