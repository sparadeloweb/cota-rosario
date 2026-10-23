export type NavIcon = "mapa" | "zona" | "reportar" | "mas" | "resumen" | "rio" | "lluvia" | "pronostico" | "reportes" | "simulador";

export interface NavItem {
  href: string;
  etiqueta: string;
  icono: NavIcon;
}

export const VECINOS_HOME = "/";
export const PANEL_HOME = "/operaciones";
export const HELP_HREF = "/como-funciona";
export const EMERGENCY_PHONE = "103";

export const VECINOS_TABS: readonly NavItem[] = [
  { href: VECINOS_HOME, etiqueta: "Mapa", icono: "mapa" },
  { href: "/mas", etiqueta: "Más", icono: "mas" },
];

export const PANEL_SECTIONS: readonly NavItem[] = [
  { href: PANEL_HOME, etiqueta: "Resumen", icono: "resumen" },
  { href: "/operaciones/pronostico", etiqueta: "Pronóstico", icono: "pronostico" },
];

export const LEGACY_REDIRECTS: readonly { source: string; destination: string; permanent: true }[] = [
  { source: "/predicciones", destination: "/operaciones/pronostico", permanent: true },
];

const SECTION_ROOTS = new Set([VECINOS_HOME, PANEL_HOME]);

export function isActive(item: NavItem, pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (SECTION_ROOTS.has(item.href)) {
    return path === item.href;
  }
  return path === item.href || path.startsWith(`${item.href}/`);
}

export function activeItem(items: readonly NavItem[], pathname: string): NavItem | undefined {
  return items.find((item) => isActive(item, pathname));
}
