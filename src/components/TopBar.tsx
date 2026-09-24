import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/Logo";
import { RISK_FILL } from "@/components/status";
import { RISK_LABEL, type RiskLevel } from "@/lib/risk";
import { horaArgentina } from "@/lib/time";

const VISTAS = [
  { href: "/", etiqueta: "Vecinos" },
  { href: "/operaciones", etiqueta: "Operaciones" },
  { href: "/predicciones", etiqueta: "Predicciones" },
] as const;

export const HELP_HREF = "/como-funciona";

interface TopBarProps {
  activo: string;
  nivel?: RiskLevel;
  actualizadoEn?: string;
}

export function TopBar({ activo, nivel, actualizadoEn }: TopBarProps) {
  const esAyuda = activo === HELP_HREF;
  return (
    <header className="glass-rail z-40 grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-rule px-3 py-2 sm:gap-6 sm:px-5">
      <Link href="/" className="flex items-center gap-2.5 rounded-md py-0.5 pr-1 transition-opacity hover:opacity-80" aria-label="Cota, inicio">
        <LogoMark />
        <Wordmark />
      </Link>

      <nav aria-label="Vistas" className="flex min-w-0 justify-center">
        <div className="flex max-w-full overflow-x-auto rounded-full border border-rule bg-ground/60 p-0.5 [scrollbar-width:none]">
          {VISTAS.map((vista) => {
            const esActivo = vista.href === activo;
            return (
              <Link
                key={vista.href}
                href={vista.href}
                aria-current={esActivo ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-colors sm:px-4 sm:text-[13px] ${
                  esActivo ? "bg-panel-soft text-ink shadow-[inset_0_0_0_1px_var(--rule)]" : "text-ink-soft hover:text-ink"
                }`}
              >
                {vista.etiqueta}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {nivel ? (
          <span
            className="flex items-center gap-2 rounded-full border border-rule px-2 py-1 sm:px-3"
            aria-label={`Estado: ${RISK_LABEL[nivel]}${actualizadoEn ? `, actualizado a las ${horaArgentina(actualizadoEn)}` : ""}`}
            title={actualizadoEn ? `Actualizado a las ${horaArgentina(actualizadoEn)}, hora argentina; se renueva solo cada 5 minutos` : undefined}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-40" style={{ background: RISK_FILL[nivel] }} aria-hidden="true" />
              <span className="relative inline-flex size-2 rounded-full" style={{ background: RISK_FILL[nivel] }} aria-hidden="true" />
            </span>
            <span className="hidden text-[13px] text-ink sm:inline">{RISK_LABEL[nivel]}</span>
            {actualizadoEn ? <span className="readout hidden text-[11px] text-ink-faint md:inline">{horaArgentina(actualizadoEn)}</span> : null}
          </span>
        ) : null}
        <Link
          href={HELP_HREF}
          aria-current={esAyuda ? "page" : undefined}
          aria-label="Cómo funciona Cota"
          title="Cómo funciona"
          className={`flex size-8 items-center justify-center rounded-full border text-sm transition-colors ${
            esAyuda ? "border-ink bg-panel-soft text-ink" : "border-rule text-ink-soft hover:border-ink-soft hover:text-ink"
          }`}
        >
          ?
        </Link>
      </div>
    </header>
  );
}
