"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGlyph } from "@/components/shell/NavGlyph";
import { isActive, type NavItem } from "@/lib/navigation";

interface TabBarProps {
  items: readonly NavItem[];
}

export function TabBar({ items }: TabBarProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-ground pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto flex h-[var(--tabbar-body)] max-w-md items-stretch">
        {items.map((item) => {
          const activo = isActive(item, pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors ${activo ? "text-ink" : "text-ink-faint hover:text-ink-soft"}`}
              >
                <NavGlyph icono={item.icono} />
                <span>{item.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
