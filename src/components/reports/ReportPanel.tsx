"use client";

import { useState } from "react";
import { howLongAgo, type ReportsState } from "@/components/reports/useReports";
import { DESCRIPTION_MAX_CHARS, REPORT_TYPES, REPORT_TTL_HOURS, type ReportType } from "@/lib/reportTypes";
const LIST_LIMIT = 8;

interface ReportPanelProps {
  status: ReportsState;
  readOnly?: boolean;
  className?: string;
}

export function ReportPanel({ status, readOnly = false, className = "max-w-xs" }: ReportPanelProps) {
  const { reports, placing, draft, sending, error, available, confirmed, confirming, startPlacing, cancel, updateDraft, submit, confirm } = status;
  const [isListOpen, setListOpen] = useState(false);

  return (
    <div className={`pointer-events-auto flex w-full flex-col gap-2 ${className}`}>
      <div className="flex flex-col overflow-hidden rounded-md border border-rule bg-panel/95 shadow-xl backdrop-blur">
        {placing ? (
          <div className="flex flex-col gap-3 px-3 py-3 text-sm">
            {draft ? (
              <>
                <p className="text-xs text-ink-soft">Marcaste un punto. ¿Qué estás viendo ahí?</p>
                <p className="readout text-xs text-ink-faint">{draft.lat.toFixed(5)}, {draft.lon.toFixed(5)}</p>
                <p className="text-xs text-ink-soft">Tu reporte será público. Describí lo que observás sin incluir nombres ni datos personales.</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(REPORT_TYPES) as ReportType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateDraft({ type })}
                      aria-pressed={draft.type === type}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                        draft.type === type ? "border-ink text-ink" : "border-rule text-ink-soft hover:text-ink"
                      }`}
                    >
                      <span className="size-2 shrink-0 rounded-full" style={{ background: REPORT_TYPES[type].color }} aria-hidden="true" />
                      {REPORT_TYPES[type].label}
                    </button>
                  ))}
                </div>
                <label className="flex flex-col gap-1">
                  <span className="meta">Detalle (opcional)</span>
                  <input
                    value={draft.description}
                    maxLength={DESCRIPTION_MAX_CHARS}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                    placeholder="Ej.: cubre el cordón en Mendoza y Ovidio Lagos"
                    className="rounded-md border border-rule bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-ink-faint focus:border-ink-soft"
                  />
                </label>
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={cancel} className="text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending}
                    className="rounded-md border border-ink px-3 py-1.5 text-xs text-ink transition-colors hover:bg-ink hover:text-ground disabled:opacity-50"
                  >
                    {sending ? "Enviando" : "Enviar reporte"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-ink">Tocá el mapa donde está el agua.</p>
                <p className="text-xs text-ink-soft">Podés acercar el mapa antes para apuntar a la cuadra exacta.</p>
                <button type="button" onClick={cancel} className="self-start text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
                  Cancelar
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2">
            {readOnly ? (
              <button
                type="button"
                onClick={() => setListOpen((current) => !current)}
                aria-expanded={isListOpen}
                className="flex flex-1 items-center gap-2 rounded-md border border-rule px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink-soft"
                title={`Reportes de vecinos en las últimas ${REPORT_TTL_HOURS} h`}
              >
                <span className="size-2 rounded-full bg-water" aria-hidden="true" />
                Reportes de vecinos
                <span className="readout ml-auto text-xs text-ink-soft">{available === true ? reports.length : "—"}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startPlacing}
                  className="flex flex-1 items-center gap-2 rounded-md border border-rule px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink-soft"
                >
                  <span className="size-2 rounded-full bg-water" aria-hidden="true" />
                  Reportar agua en mi cuadra
                </button>
                <button
                  type="button"
                  onClick={() => setListOpen((current) => !current)}
                  aria-expanded={isListOpen}
                  className="readout shrink-0 rounded-md border border-rule px-2 py-1.5 text-xs text-ink-soft transition-colors hover:text-ink"
                  title={`Reportes de vecinos en las últimas ${REPORT_TTL_HOURS} h`}
                >
                  {available === true ? reports.length : "—"}
                </button>
              </>
            )}
          </div>
        )}
        {error ? <p className="border-t border-rule px-3 py-2 text-xs text-alert">{error}</p> : null}
      </div>

      {isListOpen && !placing ? (
        <div className="flex max-h-64 flex-col overflow-y-auto rounded-md border border-rule bg-panel/95 shadow-xl backdrop-blur">
          {reports.length === 0 ? (
            <p className="px-3 py-3 text-xs text-ink-soft">{available === null ? "Consultando aportes…" : available === false ? "Consulta no disponible; no podemos afirmar que no haya aportes." : `No hay aportes registrados en ${REPORT_TTL_HOURS} horas. Esto no descarta agua en la zona.`}</p>
          ) : (
            reports.slice(0, LIST_LIMIT).map((report) => (
              <div key={report.id} className="flex items-start gap-2 border-b border-rule-soft px-3 py-2 text-xs last:border-b-0">
                <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: REPORT_TYPES[report.type].color }} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-ink">
                    {REPORT_TYPES[report.type].label} <span className="text-ink-faint">· {howLongAgo(report.createdAt)}</span>
                  </span>
                  {report.description ? <span className="truncate text-ink-soft">{report.description}</span> : null}
                </div>
                <button
                  type="button"
                  onClick={() => confirm(report.id)}
                  disabled={confirming !== null || confirmed.includes(report.id)}
                  className="readout shrink-0 text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink disabled:opacity-60"
                  title="Yo también lo veo"
                >
                  {confirming === report.id ? "…" : confirmed.includes(report.id) ? "Confirmado" : `Confirmar · ${report.confirmations}`}
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
