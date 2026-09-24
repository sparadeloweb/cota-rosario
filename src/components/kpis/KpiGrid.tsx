import type { ReactNode } from "react";

export interface KpiTile {
  etiqueta: string;
  valor: string;
  unidad?: string;
  detalle?: string;
  tono?: "neutro" | "atencion" | "alerta" | "normal";
}

interface KpiGridProps {
  tiles: KpiTile[];
  columnas?: 2 | 3;
  children?: ReactNode;
}

const TONO_CLASS: Record<NonNullable<KpiTile["tono"]>, string> = {
  neutro: "text-ink",
  atencion: "text-atencion",
  alerta: "text-alerta",
  normal: "text-normal",
};

export function KpiGrid({ tiles, columnas = 3, children }: KpiGridProps) {
  return (
    <div className="flex flex-col gap-4">
      <dl className={`grid gap-px overflow-hidden rounded-lg border border-rule bg-rule ${columnas === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {tiles.map((tile) => (
          <div key={tile.etiqueta} className="flex flex-col gap-1 bg-panel px-3.5 py-3">
            <dt className="meta">{tile.etiqueta}</dt>
            <dd className="flex items-baseline gap-1">
              <span className={`readout text-xl ${TONO_CLASS[tile.tono ?? "neutro"]}`}>{tile.valor}</span>
              {tile.unidad ? <span className="text-xs text-ink-soft">{tile.unidad}</span> : null}
            </dd>
            {tile.detalle ? <dd className="text-[11px] leading-snug text-ink-faint">{tile.detalle}</dd> : null}
          </div>
        ))}
      </dl>
      {children}
    </div>
  );
}
