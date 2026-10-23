import Link from "next/link";
import { NavGlyph } from "@/components/shell/NavGlyph";

const ACTIONS = [
  { href: "/zona", label: "Mi zona", icon: "zone" },
  { href: "/reportar", label: "Reportar agua", icon: "report" },
] as const;

export function QuickActions() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {ACTIONS.map((action) => (
        <Link key={action.href} href={action.href} className="flex items-center justify-center gap-2 rounded-md border border-rule px-3 py-2 text-sm text-ink-soft transition-colors hover:border-ink-soft hover:text-ink">
          <NavGlyph icon={action.icon} className="size-4" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
