import { REPORT_STEPS, type ReportStep } from "@/lib/reportFlow";

const LABELS: Record<ReportStep, string> = { tipo: "Qué", lugar: "Dónde", detalle: "Detalle", revisar: "Enviar" };

export function ReportStepper({ paso }: { paso: ReportStep }) {
  const actual = REPORT_STEPS.indexOf(paso);
  return (
    <ol className="mt-5 grid grid-cols-4 gap-1.5">
      {REPORT_STEPS.map((etapa, indice) => (
        <li key={etapa} className="flex flex-col gap-1.5" aria-current={indice === actual ? "step" : undefined}>
          <span className="h-1 overflow-hidden rounded-full bg-rule">
            <span className={`block h-full origin-left rounded-full bg-ink transition-transform duration-500 ease-out ${indice <= actual ? "scale-x-100" : "scale-x-0"}`} />
          </span>
          <span className={`text-[11px] ${indice === actual ? "text-ink" : indice < actual ? "text-ink-soft" : "text-ink-faint"}`}>{LABELS[etapa]}</span>
        </li>
      ))}
    </ol>
  );
}
