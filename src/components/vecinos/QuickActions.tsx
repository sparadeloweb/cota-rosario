import Link from "next/link";
import { NavGlyph } from "@/components/shell/NavGlyph";

const ACCIONES = [
  { href: "/zona", etiqueta: "Mi zona", icono: "zona" },
  { href: "/reportar", etiqueta: "Reportar agua", icono: "reportar" },
] as const;

export function QuickActions() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {ACCIONES.map((accion) => (
        <Link key={accion.href} href={accion.href} className="flex items-center justify-center gap-2 rounded-md border border-rule px-3 py-2 text-sm text-ink-soft transition-colors hover:border-ink-soft hover:text-ink">
          <NavGlyph icono={accion.icono} className="size-4" />
          {accion.etiqueta}
        </Link>
      ))}
    </div>
  );
}
