"use client";

import { useState } from "react";

const FEEDBACK_MS = 1800;

interface CopyButtonProps {
  texto: string;
}

export function CopyButton({ texto }: CopyButtonProps) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), FEEDBACK_MS);
    } catch {
      setCopiado(false);
    }
  };
  return (
    <button type="button" onClick={copiar} className="rounded-md border border-rule px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-ink-soft hover:text-ink">
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}
