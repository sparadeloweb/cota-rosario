"use client";

import type { FormEvent } from "react";
import { AddressSearch } from "@/components/AddressSearch";
import type { AddressSuggestion } from "@/lib/addressSuggestions";
import { NAME_MAX_CHARS } from "@/lib/places";

const NAME_SUGGESTIONS = ["Casa", "Trabajo", "Escuela", "Familia"] as const;

interface PlaceFormProps {
  address: string;
  name: string;
  busy: boolean;
  full: boolean;
  message: string | null;
  fullNotice: string;
  onAddress: (value: string) => void;
  onName: (value: string) => void;
  onSearch: (event: FormEvent) => void;
  onLocate: () => void;
  onPick: (suggestion: AddressSuggestion) => void;
}

export function PlaceForm({ address, name, busy, full, message, fullNotice, onAddress, onName, onSearch, onLocate, onPick }: PlaceFormProps) {
  const locked = full || busy;
  return (
    <form onSubmit={onSearch} className="flex flex-col gap-3 rounded-xl border border-rule bg-panel/70 p-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Nombre del lugar">
        {NAME_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onName(name === suggestion ? "" : suggestion)}
            disabled={locked}
            aria-pressed={name === suggestion}
            className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-40 ${name === suggestion ? "border-water bg-water/15 text-ink" : "border-rule text-ink-soft hover:text-ink"}`}
          >
            {suggestion}
          </button>
        ))}
        <input value={NAME_SUGGESTIONS.some((suggestion) => suggestion === name) ? "" : name} onChange={(event) => onName(event.target.value)} maxLength={NAME_MAX_CHARS} placeholder="otro nombre" aria-label="Otro nombre" disabled={locked} className="min-w-28 flex-1 rounded-full border border-dashed border-rule bg-transparent px-3 py-1 text-xs text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none disabled:opacity-40" />
      </div>
      <AddressSearch
        value={address}
        onValueChange={onAddress}
        onPick={onPick}
        label="Dirección"
        placeholder="Calle y número, ej.: Córdoba 1500"
        disabled={locked}
        leading={
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 20l-4-4" />
          </svg>
        }
        inputClassName="w-full rounded-lg border border-rule bg-ground py-3 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none disabled:opacity-50"
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" disabled={locked || !address.trim()} className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ground transition-opacity hover:opacity-90 disabled:opacity-30">
          {busy ? "Buscando…" : "Guardar dirección"}
        </button>
        <button type="button" onClick={onLocate} disabled={locked} className="flex items-center justify-center gap-2 rounded-lg border border-rule px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-ink-soft hover:text-ink disabled:opacity-40">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M12 2v3 M12 19v3 M2 12h3 M19 12h3" />
          </svg>
          Estoy acá
        </button>
      </div>
      {message ? <p role="alert" className="text-xs text-watch">{message}</p> : null}
      {full ? <p className="text-xs text-ink-faint">{fullNotice}</p> : null}
    </form>
  );
}
