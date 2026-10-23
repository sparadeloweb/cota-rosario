import { EMERGENCY_PHONE } from "@/lib/navigation";
import { REPORT_TTL_HOURS } from "@/lib/reportTypes";

const STEPS = [
  { title: "Aparece en el mapa", detail: `Durante ${REPORT_TTL_HOURS} horas, en el punto que marques.` },
  { title: "Otros vecinos lo confirman", detail: "Cada confirmación suma peso al aviso." },
  { title: "Lo ve el panel de operaciones", detail: "Cuenta en los reportes por tipo y por distrito." },
  { title: "Sin tu nombre", detail: "No pedimos datos personales para publicarlo." },
] as const;

export function ReportGuide() {
  return (
    <aside className="mt-8 hidden flex-col gap-5 px-5 sm:px-5 lg:flex lg:px-0">
      <h2 className="meta">Qué pasa con tu reporte</h2>
      <ol className="flex flex-col gap-4">
        {STEPS.map((item, index) => (
          <li key={item.title} className="flex gap-3">
            <span className="readout flex size-7 shrink-0 items-center justify-center rounded-full border border-rule text-xs text-ink-soft">{index + 1}</span>
            <span>
              <span className="block text-sm text-ink">{item.title}</span>
              <span className="block text-xs leading-relaxed text-ink-faint">{item.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <a href={`tel:${EMERGENCY_PHONE}`} className="rounded-xl border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-ink transition-colors hover:border-critical/70">
        Si hay riesgo para personas, llamá a Defensa Civil al <span className="readout">{EMERGENCY_PHONE}</span>
      </a>
    </aside>
  );
}
