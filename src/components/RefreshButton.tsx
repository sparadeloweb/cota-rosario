"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { refreshSources } from "@/app/actions";

export function RefreshButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await refreshSources(); router.refresh(); })}
      disabled={pending}
      aria-label={pending ? "Consultando las fuentes" : "Actualizar los datos de esta vista"}
      title="Actualizar"
      className={`flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-panel-soft hover:text-ink disabled:opacity-60 ${className}`}
    >
      <svg viewBox="0 0 24 24" className={`size-3.5 ${pending ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8 M4 4v4h4 M4 13a8 8 0 0 0 14.5 4.5L20 16 M20 20v-4h-4" />
      </svg>
    </button>
  );
}
