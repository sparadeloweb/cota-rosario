import { ReportGlyph } from "@/components/reports/ReportGlyph";
import { REPORT_TYPES, type ReportType } from "@/lib/reportTypes";

const HINTS: Record<ReportType, string> = {
  calle: "El agua cubre la calzada",
  vivienda: "Entra a casas o edificios",
  desague: "Una boca de tormenta no traga",
  corte: "No se puede pasar",
};

interface ReportTypePickerProps {
  elegido: ReportType | null;
  onElegir: (tipo: ReportType) => void;
}

export function ReportTypePicker({ elegido, onElegir }: ReportTypePickerProps) {
  return (
    <fieldset className="grid grid-cols-2 gap-2.5">
      <legend className="sr-only">Tipo de reporte</legend>
      {(Object.entries(REPORT_TYPES) as [ReportType, (typeof REPORT_TYPES)[ReportType]][]).map(([clave, tipo]) => {
        const activo = elegido === clave;
        return (
          <label
            key={clave}
            className={`relative flex min-h-32 cursor-pointer flex-col justify-between gap-3 overflow-hidden rounded-xl border p-4 transition-[border-color,background-color,transform] active:scale-[0.98] has-[:focus-visible]:border-ink-soft ${activo ? "bg-panel-soft" : "border-rule bg-panel/60 hover:border-ink-faint"}`}
            style={activo ? { borderColor: tipo.color } : undefined}
          >
            <input type="radio" name="tipo" value={clave} checked={activo} onChange={() => onElegir(clave)} className="sr-only" />
            <span className="absolute -right-6 -top-6 size-20 rounded-full opacity-15 blur-xl" style={{ background: tipo.color }} aria-hidden="true" />
            <span className="relative flex size-10 items-center justify-center rounded-lg border border-rule bg-ground" style={{ color: tipo.color }}>
              <ReportGlyph tipo={clave} />
            </span>
            <span className="relative">
              <span className="block text-sm font-medium text-ink">{tipo.etiqueta}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-ink-faint">{HINTS[clave]}</span>
            </span>
            {activo ? (
              <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full text-ground" style={{ background: tipo.color }} aria-hidden="true">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}
