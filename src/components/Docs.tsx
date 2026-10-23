import type { ReactNode } from "react";

interface DocsProps {
  children: ReactNode;
  title?: string;
}

export function Docs({ children, title = "Fuentes y metodología" }: DocsProps) {
  return (
    <details className="hairline group px-5 py-5 sm:px-5">
      <summary className="meta flex cursor-pointer list-none items-center gap-2 text-ink-soft transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">
          ▸
        </span>
        {title}
      </summary>
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </details>
  );
}

export function DocsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-ink">{title}</h2>
      {children}
    </section>
  );
}
