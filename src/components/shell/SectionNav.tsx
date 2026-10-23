"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGlyph } from "@/components/shell/NavGlyph";
import { isActive, type NavItem } from "@/lib/navigation";

interface SectionNavProps {
  items: readonly NavItem[];
  etiqueta: string;
}

export function SectionNav({ items, etiqueta }: SectionNavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label={etiqueta} className="glass-rail shrink-0 border-b border-rule">
      <ul className="flex overflow-x-auto px-2 [scrollbar-width:none] sm:px-4">
        {items.map((item) => {
          const activo = isActive(item, pathname);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors ${activo ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
              >
                <NavGlyph icono={item.icono} className="size-4" />
                {item.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
