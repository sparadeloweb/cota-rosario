import type { NavIcon } from "@/lib/navigation";

const PATHS: Record<NavIcon, string> = {
  mapa: "M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20Z M9 4v13.5 M15 6.5V20",
  zona: "M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  reportar: "M12 3.5 21 19.5H3Z M12 9.5v4.5 M12 17h.01",
  mas: "M5 7h14 M5 12h14 M5 17h14",
  resumen: "M4.5 4.5h6v6h-6Z M13.5 4.5h6v6h-6Z M4.5 13.5h6v6h-6Z M13.5 13.5h6v6h-6Z",
  rio: "M3 9c3 0 3-2 6-2s3 2 6 2 3-2 6-2 M3 15c3 0 3-2 6-2s3 2 6 2 3-2 6-2",
  lluvia: "M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 15 M9 18l-1 2 M13 18l-1 2 M17 18l-1 2",
  pronostico: "M4 19.5h16 M6 15.5l3.5-4 3 2.5 5.5-7 M15 7h3v3",
  reportes: "M5 4.5h14v11H9l-4 4Z M9 9h6 M9 12h4",
  simulador: "M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4",
};

interface NavGlyphProps {
  icono: NavIcon;
  className?: string;
}

export function NavGlyph({ icono, className = "size-5" }: NavGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[icono]} />
    </svg>
  );
}
