import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { RefreshButton } from "@/components/RefreshButton";
import { riskColor } from "@/components/status";
import { riskLabel, type RiskLevel } from "@/lib/risk";
import { fechaHoraArgentina } from "@/lib/time";

interface TopBarProps {
  inicio: string;
  nivel?: RiskLevel | null;
  actualizadoEn?: string;
  centro?: ReactNode;
  acciones?: ReactNode;
}

export function TopBar({ inicio, nivel, actualizadoEn, centro, acciones }: TopBarProps) {
  return (
    <header className="glass-rail z-40 grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-rule px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-6 sm:px-5">
      <Link href={inicio} className="flex items-center gap-2.5 rounded-md py-0.5 pr-1 transition-opacity hover:opacity-80" aria-label="Cota, inicio">
        <LogoMark />
        <Wordmark />
      </Link>

      <div className="flex min-w-0 justify-center">{centro}</div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {actualizadoEn ? <span className="hidden sm:inline-flex"><RefreshButton /></span> : null}
        {nivel !== undefined ? (
          <span
            className="flex items-center gap-2 rounded-full border border-rule px-2 py-1 sm:px-3"
            aria-label={`Estado: ${riskLabel(nivel)}${actualizadoEn ? `, consulta ${fechaHoraArgentina(actualizadoEn)}` : ""}`}
            title={actualizadoEn ? `Consulta ${fechaHoraArgentina(actualizadoEn)}, hora argentina. Revisá también la fecha de cada fuente.` : undefined}
          >
            <span className="relative inline-flex size-2 rounded-full" style={{ background: riskColor(nivel) }} aria-hidden="true" />
            <span className="text-[13px] text-ink max-sm:hidden lg:inline">{riskLabel(nivel)}</span>
            {actualizadoEn ? <span className="readout hidden text-xs text-ink-soft xl:inline">{fechaHoraArgentina(actualizadoEn)}</span> : null}
          </span>
        ) : null}
        {acciones}
      </div>
    </header>
  );
}
