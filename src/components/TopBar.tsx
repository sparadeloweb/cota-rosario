import Link from "next/link";
import { RISK_FILL } from "@/components/status";
import { RISK_LABEL, type RiskLevel } from "@/lib/risk";

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

function horaUtc(iso: string): string {
  return `${iso.slice(11, 16)} UTC`;
}

export function TopBar({ activo, nivel, actualizadoEn }: TopBarProps) {
  const esAyuda = activo === HELP_HREF;
  return (
    <header className="glass-rail z-40 flex shrink-0 items-center gap-4 border-b border-rule px-4 py-2.5 sm:gap-6 sm:px-5">
      <Link href="/" className="flex items-baseline gap-2.5">
        <span className="text-base font-semibold tracking-tight text-ink">Cota</span>
        <span className="meta hidden sm:inline">Rosario</span>
      </Link>

      <nav aria-label="Vistas" className="flex items-center gap-3 sm:gap-4">
        {VISTAS.map((vista) => {
          const esActivo = vista.href === activo;
          return (
            <Link
              key={vista.href}
              href={vista.href}
              aria-current={esActivo ? "page" : undefined}
              className={`whitespace-nowrap border-b py-1 text-sm transition-colors ${esActivo ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              {vista.etiqueta}
            </Link>
          );
        })}
      </nav>

      <span className="ml-auto flex items-center gap-3 whitespace-nowrap text-sm">
        {actualizadoEn ? (
          <span className="readout hidden text-[11px] text-ink-faint md:inline" title="Hora en que se generó esta vista; se renueva sola cada 5 minutos">
            actualizado {horaUtc(actualizadoEn)}
          </span>
        ) : null}
        {nivel ? (
          <span className="flex items-center gap-2" aria-label={`Estado: ${RISK_LABEL[nivel]}`}>
            <span className="size-2 rounded-full" style={{ background: RISK_FILL[nivel] }} aria-hidden="true" />
            <span className="hidden text-ink sm:inline">{RISK_LABEL[nivel]}</span>
          </span>
        ) : null}
        <Link
          href={HELP_HREF}
          aria-current={esAyuda ? "page" : undefined}
          aria-label="Cómo funciona Cota"
          className={`flex size-7 items-center justify-center rounded-full border text-xs transition-colors sm:size-auto sm:rounded-md sm:px-2.5 sm:py-1 ${
            esAyuda ? "border-ink text-ink" : "border-rule text-ink-soft hover:border-ink-soft hover:text-ink"
          }`}
        >
          <span className="sm:hidden">?</span>
          <span className="hidden sm:inline">Cómo funciona</span>
        </Link>
      </span>
    </header>
  );
}
