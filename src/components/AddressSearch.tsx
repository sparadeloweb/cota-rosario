"use client";

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { parseSuggestions, suggestionUrl, type AddressSuggestion } from "@/lib/addressSuggestions";

const DEBOUNCE_MS = 300;

interface AddressSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  onPick: (suggestion: AddressSuggestion) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  inputClassName: string;
  leading?: ReactNode;
  id?: string;
}

interface Results {
  query: string;
  items: AddressSuggestion[];
}

const EMPTY_RESULTS: Results = { query: "", items: [] };

export function AddressSearch({ value, onValueChange, onPick, placeholder, label, disabled = false, inputClassName, leading, id }: AddressSearchProps) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-input`;
  const listId = `${generatedId}-list`;
  const [results, setResults] = useState<Results>(EMPTY_RESULTS);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const query = value.trim();

  useEffect(() => {
    const url = suggestionUrl(query);
    if (!url || disabled) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(url, { signal: controller.signal, headers: { accept: "application/json" } })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: unknown) => setResults({ query, items: parseSuggestions(payload) }))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setResults({ query, items: [] });
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, disabled]);

  const suggestions = results.query === query ? results.items : [];
  const open = focused && !disabled && suggestions.length > 0 && dismissedFor !== value;
  const activeOption = open && activeIndex >= 0 && activeIndex < suggestions.length ? activeIndex : -1;

  const pick = (suggestion: AddressSuggestion) => {
    setDismissedFor(suggestion.label);
    setActiveIndex(-1);
    onPick(suggestion);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && activeOption >= 0) {
      event.preventDefault();
      pick(suggestions[activeOption]);
    } else if (event.key === "Escape") {
      setDismissedFor(value);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      {leading}
      <input
        id={inputId}
        value={value}
        onChange={(event) => {
          setActiveIndex(-1);
          setDismissedFor(null);
          onValueChange(event.target.value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOption >= 0 ? `${listId}-${activeOption}` : undefined}
        className={inputClassName}
      />
      {open ? (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-rule bg-panel shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)]">
          <ul id={listId} role="listbox" aria-label="Direcciones sugeridas" className="max-h-72 overflow-y-auto py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.label}-${suggestion.lat}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeOption}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(suggestion)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm ${index === activeOption ? "bg-panel-soft text-ink" : "text-ink-soft"}`}
              >
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-ink-faint" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                </svg>
                <span className="min-w-0 flex-1 truncate text-ink">{suggestion.label}</span>
                <span className="max-w-[45%] shrink-0 truncate text-xs text-ink-faint">{suggestion.detail}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-rule-soft px-3 py-1.5 text-[0.625rem] text-ink-faint">Sugerencias de Photon · datos © OpenStreetMap</p>
        </div>
      ) : null}
    </div>
  );
}
