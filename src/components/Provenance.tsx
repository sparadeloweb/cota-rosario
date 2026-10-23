import type { SourceFailure } from "@/lib/status";
import { SOURCES } from "@/lib/sources";
import { argentinaDateTime, argentinaTime } from "@/lib/time";

interface ProvenanceProps {
  stamps: { id: keyof typeof SOURCES; fetchedAt?: string; failure?: SourceFailure }[];
}

export function Provenance({ stamps }: ProvenanceProps) {
  const stamp = (id: string) => stamps.find((entry) => entry.id === id);

  return (
    <div className="flex flex-col divide-y divide-rule-soft">
      {Object.values(SOURCES).map((source) => {
        const entry = stamp(source.id);
        const fetched = entry?.fetchedAt;
        const failure = entry?.failure;
        return (
          <article key={source.id} className="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-sm font-medium text-ink">{source.agency}</h3>
              {failure ? (
                <span className="readout text-[11px] text-alert">sin respuesta {argentinaTime(failure.at)}</span>
              ) : fetched ? (
                <span className="readout text-[11px] text-ink-faint">consultado {argentinaDateTime(fetched)}</span>
              ) : null}
            </div>
            <p className="text-xs text-ink-soft">{source.description}</p>
            <a
              href={source.endpoint}
              target="_blank"
              rel="noopener noreferrer"
              className="readout break-all text-[11px] text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink"
            >
              {source.endpoint}
            </a>
            <a href={source.portal} target="_blank" rel="noopener noreferrer" className="text-xs text-water underline underline-offset-4">Publicación y contexto de la fuente</a>
            <p className="text-xs text-ink-soft">
              {source.model ? <span className="text-watch">modelo, no dato oficial · </span> : null}
              {source.license}
            </p>
          </article>
        );
      })}
    </div>
  );
}
