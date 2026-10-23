"use client";

import { useState } from "react";

const FEEDBACK_MS = 1800;

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), FEEDBACK_MS);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" onClick={copy} className="rounded-md border border-rule px-2.5 py-1 text-[0.6875rem] text-ink-soft transition-colors hover:border-ink-soft hover:text-ink">
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
