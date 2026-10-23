import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { LEGACY_REDIRECTS, PANEL_SECTIONS, VECINOS_TABS, activeItem, isActive } from "../src/lib/navigation";

const APP_DIR = path.join(process.cwd(), "src", "app");
const ROUTE_GROUPS = ["", "(vecinos)"];

function pageExists(href: string): boolean {
  const segments = href === "/" ? [] : href.slice(1).split("/");
  return ROUTE_GROUPS.some((group) => existsSync(path.join(APP_DIR, group, ...segments, "page.tsx")));
}

test("cada pestaña y sección tiene un destino único que empieza con /", () => {
  const hrefs = [...VECINOS_TABS, ...PANEL_SECTIONS].map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  assert.ok(hrefs.every((href) => href.startsWith("/")));
});

test("cada destino de la navegación tiene su página", () => {
  const faltantes = [...VECINOS_TABS, ...PANEL_SECTIONS].map((item) => item.href).filter((href) => !pageExists(href));
  assert.deepEqual(faltantes, []);
});

test("la sección activa respeta las raíces y las subrutas", () => {
  assert.equal(activeItem(PANEL_SECTIONS, "/operaciones/pronostico")?.etiqueta, "Pronóstico");
  assert.equal(activeItem(PANEL_SECTIONS, "/operaciones")?.etiqueta, "Resumen");
  assert.equal(activeItem(PANEL_SECTIONS, "/operaciones/")?.etiqueta, "Resumen");
  assert.equal(activeItem(VECINOS_TABS, "/")?.etiqueta, "Mapa");
  assert.equal(activeItem(VECINOS_TABS, "/operaciones"), undefined);
  assert.equal(isActive(PANEL_SECTIONS[0], "/operaciones/pronostico"), false);
});

test("predicciones vive dentro del panel y su ruta vieja redirige ahí", () => {
  assert.ok(!PANEL_SECTIONS.some((item) => item.href === "/predicciones"));
  assert.ok(!VECINOS_TABS.some((item) => item.href === "/predicciones"));
  const redirect = LEGACY_REDIRECTS.find((item) => item.source === "/predicciones");
  assert.equal(redirect?.destination, "/operaciones/pronostico");
  assert.equal(redirect?.permanent, true);
  assert.ok(pageExists(redirect?.destination ?? ""));
});
