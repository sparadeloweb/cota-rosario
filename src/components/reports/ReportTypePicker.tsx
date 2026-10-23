import { ReportGlyph } from "@/components/reports/ReportGlyph";
import { REPORT_TYPES, type ReportType } from "@/lib/reportTypes";

const HINTS: Record<ReportType, string> = {
  street: "El agua cubre la calzada",
  home: "Entra a casas o edificios",
  drain: "Una boca de tormenta no traga",
  closure: "No se puede pasar",
};

interface ReportTypePickerProps {
  selected: ReportType | null;
  onSelect: (type: ReportType) => void;
}

export function ReportTypePicker({ selected, onSelect }: ReportTypePickerProps) {
  return (
    <fieldset className="grid grid-cols-2 gap-2.5 lg:flex-1 lg:grid-rows-2 lg:gap-4">
      <legend className="sr-only">Tipo de reporte</legend>
      {(Object.entries(REPORT_TYPES) as [ReportType, (typeof REPORT_TYPES)[ReportType]][]).map(([id, type]) => {
        const active = selected === id;
        return (
          <label
            key={id}
            className={`relative flex min-h-32 cursor-pointer flex-col justify-between gap-3 overflow-hidden rounded-xl border p-4 lg:rounded-2xl lg:p-8 transition-[border-color,background-color,transform] active:scale-[0.98] has-[:focus-visible]:border-ink-soft ${active ? "bg-panel-soft" : "border-rule bg-panel/60 hover:border-ink-faint"}`}
            style={active ? { borderColor: type.color } : undefined}
          >
            <input type="radio" name="type" value={id} checked={active} onChange={() => onSelect(id)} className="sr-only" />
            <span className="absolute -right-6 -top-6 size-20 rounded-full opacity-15 blur-xl lg:-right-12 lg:-top-12 lg:size-56 lg:blur-3xl" style={{ background: type.color }} aria-hidden="true" />
            <span className="relative flex size-10 items-center justify-center rounded-lg border border-rule bg-ground lg:size-16 lg:rounded-xl" style={{ color: type.color }}>
              <ReportGlyph type={id} className="size-6 lg:size-9" />
            </span>
            <span className="relative">
              <span className="block text-sm font-medium text-ink lg:text-2xl">{type.label}</span>
              <span className="mt-0.5 block text-[0.6875rem] leading-snug text-ink-faint lg:mt-1.5 lg:text-sm">{HINTS[id]}</span>
            </span>
            {active ? (
              <span className="absolute right-3 top-3 flex size-5 items-center lg:right-6 lg:top-6 lg:size-8 justify-center rounded-full text-ground" style={{ background: type.color }} aria-hidden="true">
                <svg viewBox="0 0 24 24" className="size-3.5 lg:size-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
