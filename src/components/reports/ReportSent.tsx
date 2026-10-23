import Link from "next/link";
import { EMERGENCY_PHONE, VECINOS_HOME } from "@/lib/navigation";
import { REPORT_TTL_HOURS } from "@/lib/reportTypes";

export function ReportSent({ onOtro }: { onOtro: () => void }) {
  return (
    <section className="flex flex-col items-center px-5 py-10 text-center sm:px-6">
      <span className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-normal/20 [animation-iteration-count:2] motion-reduce:hidden" aria-hidden="true" />
        <span className="relative flex size-16 items-center justify-center rounded-full border border-normal/60 bg-normal/15 text-normal">
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </span>
      </span>
      <p className="meta mt-6">Reporte enviado</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Gracias por avisar</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">Aparece en el mapa durante {REPORT_TTL_HOURS} horas y otros vecinos pueden confirmarlo. No reemplaza un aviso a Defensa Civil.</p>
      <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
        <Link href={VECINOS_HOME} className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ground hover:opacity-90">Ver en el mapa</Link>
        <button type="button" onClick={onOtro} className="rounded-lg border border-rule px-4 py-2.5 text-sm text-ink-soft hover:border-ink-soft hover:text-ink">Reportar otra cosa</button>
      </div>
      <a href={`tel:${EMERGENCY_PHONE}`} className="mt-6 text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">Si hay riesgo para personas, llamá al {EMERGENCY_PHONE}</a>
    </section>
  );
}
