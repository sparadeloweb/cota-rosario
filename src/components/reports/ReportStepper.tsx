import { REPORT_STEPS, type ReportStep } from "@/lib/reportFlow";

const LABELS: Record<ReportStep, string> = { type: "Qué", place: "Dónde", detail: "Detalle", review: "Enviar" };

export function ReportStepper({ step }: { step: ReportStep }) {
  const current = REPORT_STEPS.indexOf(step);
  return (
    <ol className="mt-5 grid grid-cols-4 gap-1.5">
      {REPORT_STEPS.map((stepId, index) => (
        <li key={stepId} className="flex flex-col gap-1.5" aria-current={index === current ? "step" : undefined}>
          <span className="h-1 overflow-hidden rounded-full bg-rule">
            <span className={`block h-full origin-left rounded-full bg-ink transition-transform duration-500 ease-out ${index <= current ? "scale-x-100" : "scale-x-0"}`} />
          </span>
          <span className={`text-[0.6875rem] ${index === current ? "text-ink" : index < current ? "text-ink-soft" : "text-ink-faint"}`}>{LABELS[stepId]}</span>
        </li>
      ))}
    </ol>
  );
}
