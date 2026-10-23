"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGlyph } from "@/components/shell/NavGlyph";
import { isActive, type NavItem } from "@/lib/navigation";

interface SectionNavProps {
  items: readonly NavItem[];
  label: string;
}

export function SectionNav({ items, label }: SectionNavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="glass-rail shrink-0 border-b border-rule">
      <ul className="flex overflow-x-auto px-2 [scrollbar-width:none] sm:px-4">
        {items.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[0.8125rem] transition-colors ${active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
              >
                <NavGlyph icon={item.icon} className="size-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
