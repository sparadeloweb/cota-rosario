const PROMESAS = [
  { titulo: "Mapa oficial", detalle: "si cae dentro de las áreas inundables del Ludueña o el Saladillo y cómo están hoy" },
  { titulo: "Relieve", detalle: "si es un bajo donde el agua tiende a juntarse" },
  { titulo: "Historial", detalle: "cuántos anegamientos registró su distrito" },
] as const;

export function EmptyPlaces() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-rule px-5 py-8 text-center">
      <svg viewBox="0 0 120 80" className="h-20 w-32 text-water" fill="none" aria-hidden="true">
        {[0, 1, 2, 3].map((anillo) => (
          <ellipse key={anillo} cx="60" cy="62" rx={12 + anillo * 14} ry={4 + anillo * 4.5} stroke="currentColor" strokeOpacity={0.55 - anillo * 0.12} strokeWidth="1" />
        ))}
        <path d="M60 58s-14-12-14-24a14 14 0 0 1 28 0c0 12-14 24-14 24Z" fill="var(--ground)" stroke="var(--ink)" strokeWidth="1.4" />
        <circle cx="60" cy="34" r="5" stroke="var(--ink)" strokeWidth="1.4" />
      </svg>
      <div>
        <p className="text-base font-medium text-ink">Todavía no guardaste lugares</p>
        <p className="mt-1 text-sm text-ink-soft">Para cada uno vas a ver, de un vistazo:</p>
      </div>
      <ul className="flex w-full flex-col gap-2 text-left">
        {PROMESAS.map((promesa, indice) => (
          <li key={promesa.titulo} className="flex gap-3 rounded-lg bg-panel/60 px-3 py-2.5">
            <span className="readout mt-0.5 text-xs text-ink-faint">{String(indice + 1).padStart(2, "0")}</span>
            <span className="text-sm leading-snug text-ink-soft">
              <span className="text-ink">{promesa.titulo}:</span> {promesa.detalle}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
