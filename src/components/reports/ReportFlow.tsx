"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AddressSearch } from "@/components/AddressSearch";
import { SectionHero } from "@/components/panel/SectionHero";
import { ReportGlyph } from "@/components/reports/ReportGlyph";
import { ReportGuide } from "@/components/reports/ReportGuide";
import { ReportSent } from "@/components/reports/ReportSent";
import { ReportStepper } from "@/components/reports/ReportStepper";
import { ReportTypePicker } from "@/components/reports/ReportTypePicker";
import { geocode } from "@/lib/placeReader";
import { EMPTY_DRAFT, QUICK_PHRASES, REPORT_STEPS, appendPhrase, submissionBody, previousStep, canAdvance, nextStep, type ReportDraftFlow, type ReportStep } from "@/lib/reportFlow";
import { DESCRIPTION_MAX_CHARS, REPORT_TTL_HOURS, REPORT_TYPES } from "@/lib/reportTypes";
import { EMERGENCY_PHONE, RESIDENTS_HOME } from "@/lib/navigation";

const API = "/api/reports";
const GEOLOCATION_TIMEOUT_MS = 10_000;
const COORD_DECIMALS = 4;
const PERCENT = 100;

const TITLES: Record<ReportStep, string> = {
  type: "¿Qué estás viendo?",
  place: "¿Dónde?",
  detail: "¿Algo más?",
  review: "Revisá y enviá",
};

type Submission = { status: "editing" } | { status: "sending" } | { status: "sent" } | { status: "error"; message: string };

export function ReportFlow() {
  const [step, setStep] = useState<ReportStep>("type");
  const [draft, setDraft] = useState<ReportDraftFlow>(EMPTY_DRAFT);
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const [placeNotice, setPlaceNotice] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission>({ status: "editing" });

  const update = (changes: Partial<ReportDraftFlow>) => setDraft((current) => ({ ...current, ...changes }));
  const number = REPORT_STEPS.indexOf(step) + 1;

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setPlaceNotice("Este dispositivo no comparte su ubicación. Escribí la dirección.");
      return;
    }
    setSearching(true);
    setPlaceNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearching(false);
        update({ lat: position.coords.latitude, lon: position.coords.longitude, placeLabel: "Mi ubicación actual" });
      },
      () => {
        setSearching(false);
        setPlaceNotice("No pudimos obtener tu ubicación. Revisá el permiso o escribí la dirección.");
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    );
  };

  const searchAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!address.trim()) {
      return;
    }
    setSearching(true);
    setPlaceNotice(null);
    try {
      const found = await geocode(address.trim());
      if (found) {
        update({ lat: found.lat, lon: found.lon, placeLabel: found.label });
      } else {
        setPlaceNotice("No encontramos esa dirección dentro de Rosario.");
      }
    } catch {
      setPlaceNotice("El buscador de direcciones no respondió. Probá de nuevo en un momento.");
    } finally {
      setSearching(false);
    }
  };

  const submit = async () => {
    const body = submissionBody(draft);
    if (!body) {
      return;
    }
    setSubmission({ status: "sending" });
    try {
      const response = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setSubmission(response.ok && data.ok ? { status: "sent" } : { status: "error", message: data.error ?? "No se pudo enviar el reporte." });
    } catch {
      setSubmission({ status: "error", message: navigator.onLine ? "No se pudo enviar el reporte. Probá de nuevo." : "Sin conexión: el reporte no se envió. Probá cuando vuelva la señal." });
    }
  };

  const restart = () => {
    setDraft(EMPTY_DRAFT);
    setAddress("");
    setStep("type");
    setSubmission({ status: "editing" });
  };

  if (submission.status === "sent") {
    return <ReportSent onAnother={restart} />;
  }

  const selectedType = draft.type ? REPORT_TYPES[draft.type] : null;
  const hasPlace = draft.lat !== null && draft.lon !== null;
  const isPlaceValid = canAdvance("place", draft);

  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)] lg:gap-x-10 lg:px-5">
      <div className="lg:sticky lg:top-0 lg:self-start lg:pb-8">
        <SectionHero inColumn pattern="report" meta={`Reportar · paso ${number} de ${REPORT_STEPS.length}`} title={TITLES[step]}>
          {step === "type" ? "Tu aviso aparece en el mapa para que otros vecinos y el panel de operaciones lo vean." : null}
        </SectionHero>
        <div className="px-5 sm:px-5 lg:px-0">
          <ReportStepper step={step} />
        </div>
        <ReportGuide />
      </div>

      <div className="flex flex-1 flex-col lg:pt-6">
      <section className="flex-1 px-5 py-6 sm:px-5 lg:flex lg:flex-col lg:px-0">
        {step === "type" ? <ReportTypePicker selected={draft.type} onSelect={(type) => update({ type })} /> : null}

        {step === "place" ? (
          <div className="flex flex-col gap-4">
            <button type="button" onClick={useCurrentLocation} disabled={searching} className="flex items-center gap-4 rounded-xl border border-rule bg-panel/70 p-4 text-left transition-colors hover:border-ink-soft disabled:opacity-50">
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-water/50 bg-water/10 text-water">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M12 2v3 M12 19v3 M2 12h3 M19 12h3" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{searching ? "Buscando tu ubicación…" : "Usar mi ubicación actual"}</span>
                <span className="mt-0.5 block text-xs text-ink-faint">Lo más preciso si estás en el lugar</span>
              </span>
            </button>
            <div className="flex items-center gap-3 text-[0.6875rem] text-ink-faint" aria-hidden="true">
              <span className="h-px flex-1 bg-rule-soft" />o escribí la dirección<span className="h-px flex-1 bg-rule-soft" />
            </div>
            <form onSubmit={searchAddress} className="flex gap-2">
              <div className="min-w-0 flex-1">
                <AddressSearch
                  id="report-address"
                  value={address}
                  onValueChange={setAddress}
                  onPick={(suggestion) => {
                    setPlaceNotice(null);
                    setAddress(suggestion.label);
                    update({ lat: suggestion.lat, lon: suggestion.lon, placeLabel: `${suggestion.label}, ${suggestion.detail}` });
                  }}
                  label="Dirección"
                  placeholder="Ej.: Pellegrini y Oroño"
                  inputClassName="w-full rounded-lg border border-rule bg-ground px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none"
                />
              </div>
              <button type="submit" disabled={searching || !address.trim()} className="rounded-lg border border-rule px-4 py-2.5 text-sm text-ink-soft hover:text-ink disabled:opacity-40">{searching ? "…" : "Buscar"}</button>
            </form>
            {hasPlace ? (
              <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${isPlaceValid ? "border-normal/50 bg-normal/10" : "border-watch/50 bg-watch/10"}`}>
                <span className={`mt-0.5 text-sm ${isPlaceValid ? "text-normal" : "text-watch"}`} aria-hidden="true">{isPlaceValid ? "✓" : "!"}</span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{draft.placeLabel}</span>
                  <span className="readout block text-[0.6875rem] text-ink-faint">{draft.lat!.toFixed(COORD_DECIMALS)}, {draft.lon!.toFixed(COORD_DECIMALS)}</span>
                  {!isPlaceValid ? <span className="mt-1 block text-xs text-watch">Ese punto queda fuera de Rosario.</span> : null}
                </span>
              </div>
            ) : null}
            {placeNotice ? <p role="alert" className="text-xs text-watch">{placeNotice}</p> : null}
            <p className="text-xs leading-relaxed text-ink-faint">
              También podés marcar el punto exacto desde el <Link href={RESIDENTS_HOME} className="underline decoration-rule underline-offset-4 hover:text-ink">mapa</Link>.
            </p>
          </div>
        ) : null}

        {step === "detail" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Frases rápidas">
              {QUICK_PHRASES.map((phrase) => {
                const used = draft.description.toLowerCase().includes(phrase);
                return (
                  <button key={phrase} type="button" onClick={() => update({ description: appendPhrase(draft.description, phrase) })} disabled={used} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${used ? "border-water/50 bg-water/10 text-ink-soft" : "border-rule text-ink-soft hover:border-ink-soft hover:text-ink"}`}>
                    {used ? "✓ " : "+ "}
                    {phrase}
                  </button>
                );
              })}
            </div>
            <label className="flex flex-col gap-2">
              <span className="sr-only">Descripción (opcional)</span>
              <textarea value={draft.description} onChange={(event) => update({ description: event.target.value })} maxLength={DESCRIPTION_MAX_CHARS} rows={4} placeholder="Contá con tus palabras (opcional)" className="rounded-xl border border-rule bg-ground px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none" />
              <span className="flex items-center gap-2 self-end">
                <span className="h-1 w-16 overflow-hidden rounded-full bg-rule-soft">
                  <span className="block h-full rounded-full bg-ink-soft" style={{ width: `${(draft.description.length / DESCRIPTION_MAX_CHARS) * PERCENT}%` }} />
                </span>
                <span className="readout text-[0.6875rem] text-ink-faint">{draft.description.length}/{DESCRIPTION_MAX_CHARS}</span>
              </span>
            </label>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="flex flex-col gap-4">
            <article className="overflow-hidden rounded-xl border border-rule bg-panel/70">
              {selectedType && draft.type ? (
                <header className="flex items-center gap-3 border-b border-rule-soft px-4 py-3.5">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-rule bg-ground" style={{ color: selectedType.color }}>
                    <ReportGlyph type={draft.type} />
                  </span>
                  <span className="text-base font-medium text-ink">{selectedType.label}</span>
                  <button type="button" onClick={() => setStep("type")} className="ml-auto text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">Cambiar</button>
                </header>
              ) : null}
              <dl className="flex flex-col gap-3 px-4 py-3.5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><dt className="meta">Dónde</dt><dd className="mt-1 text-ink">{draft.placeLabel || "—"}</dd></div>
                  <button type="button" onClick={() => setStep("place")} className="shrink-0 text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">Cambiar</button>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div><dt className="meta">Detalle</dt><dd className="mt-1 text-ink-soft">{draft.description.trim() || "Sin descripción"}</dd></div>
                  <button type="button" onClick={() => setStep("detail")} className="shrink-0 text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">Cambiar</button>
                </div>
              </dl>
            </article>
            <p className="text-xs leading-relaxed text-ink-faint">Se publica sin tu nombre durante {REPORT_TTL_HOURS} horas. Si hay riesgo para personas, llamá a Defensa Civil al <a href={`tel:${EMERGENCY_PHONE}`} className="text-ink underline decoration-rule underline-offset-4">{EMERGENCY_PHONE}</a>.</p>
            {submission.status === "error" ? <p role="alert" className="rounded-lg border border-watch/50 bg-watch/10 px-3 py-2 text-xs text-watch">{submission.message}</p> : null}
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-rule-soft bg-ground/95 px-5 py-3 backdrop-blur sm:px-5 lg:px-0">
        <button type="button" onClick={() => setStep(previousStep(step))} disabled={step === "type"} className="rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:text-ink disabled:invisible">
          Atrás
        </button>
        {step === "review" ? (
          <button type="button" onClick={submit} disabled={!canAdvance("review", draft) || submission.status === "sending"} className="ml-auto flex-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-ground hover:opacity-90 disabled:opacity-30 sm:flex-none">
            {submission.status === "sending" ? "Enviando…" : "Enviar reporte"}
          </button>
        ) : (
          <button type="button" onClick={() => setStep(nextStep(step))} disabled={!canAdvance(step, draft)} className="ml-auto flex-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-ground hover:opacity-90 disabled:opacity-30 sm:flex-none">
            {step === "detail" && !draft.description.trim() ? "Seguir sin detalle" : "Siguiente"}
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
