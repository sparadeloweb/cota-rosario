"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGlyph } from "@/components/shell/NavGlyph";
import { isActive, type NavItem } from "@/lib/navigation";

interface SectionNavProps {
  items: readonly NavItem[];
  etiqueta: string;
  variante: "pill" | "row";
}

export function SectionNav({ items, etiqueta, variante }: SectionNavProps) {
  const pathname = usePathname();
  const pill = variante === "pill";
  return (
    <nav aria-label={etiqueta} className={pill ? "flex min-w-0 justify-center" : "glass-rail shrink-0 border-b border-rule"}>
      <ul className={pill ? "flex max-w-full overflow-x-auto rounded-full border border-rule bg-ground/60 p-0.5 [scrollbar-width:none]" : "flex overflow-x-auto px-2 [scrollbar-width:none] sm:px-4"}>
        {items.map((item) => {
          const activo = isActive(item, pathname);
          const forma = pill
            ? `rounded-full px-3 py-1 text-[13px] ${activo ? "bg-panel-soft text-ink shadow-[inset_0_0_0_1px_var(--rule)]" : "text-ink-soft hover:text-ink"}`
            : `border-b-2 px-3 py-2.5 text-[13px] ${activo ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"}`;
          return (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} aria-current={activo ? "page" : undefined} className={`flex items-center gap-2 whitespace-nowrap transition-colors ${forma}`}>
                {pill ? null : <NavGlyph icono={item.icono} className="size-4" />}
                {item.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
