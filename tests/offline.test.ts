import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import manifest from "../src/app/manifest";
import { SIN_LECTURA, antiguedad, avisoDesdeCache, avisoSinConexion } from "../src/lib/offline";

const require = createRequire(import.meta.url);
const { strategyFor } = require("../public/sw-strategy.js") as { strategyFor: (request: { method: string; mode: string; pathname: string; sameOrigin: boolean }) => string };

const AHORA = Date.parse("2026-10-23T15:00:00Z");
const get = (pathname: string, mode = "cors") => ({ method: "GET", mode, pathname, sameOrigin: true });

test("la antigüedad de la última lectura se dice en minutos, horas o con fecha", () => {
  assert.equal(antiguedad("2026-10-23T14:59:30Z", AHORA), "hace instantes");
  assert.equal(antiguedad("2026-10-23T14:20:00Z", AHORA), "hace 40 min");
  assert.equal(antiguedad("2026-10-23T12:00:00Z", AHORA), "hace 3 h");
  assert.equal(antiguedad("2026-10-21T15:00:00Z", AHORA), "del 21/10 12:00");
});

test("sin fecha válida nunca se presenta como lectura actual", () => {
  assert.equal(antiguedad(undefined, AHORA), SIN_LECTURA);
  assert.equal(antiguedad("no es fecha", AHORA), SIN_LECTURA);
  assert.equal(antiguedad("2026-10-24T15:00:00Z", AHORA), SIN_LECTURA);
  assert.equal(avisoSinConexion(undefined, AHORA), "Sin conexión · no hay una lectura guardada");
  const aviso = avisoSinConexion("2026-10-23T12:00:00Z", AHORA);
  assert.match(aviso, /hace 3 h \(09:00\)/);
  assert.match(aviso, /No es el estado actual/);
});

test("el manifiesto declara una app instalable con íconos normales y maskable", () => {
  const datos = manifest();
  assert.equal(datos.start_url, "/");
  assert.equal(datos.display, "standalone");
  assert.equal(datos.short_name, "Cota");
  const tamanos = (datos.icons ?? []).map((icono) => icono.sizes);
  assert.ok(tamanos.includes("192x192") && tamanos.includes("512x512"));
  assert.ok((datos.icons ?? []).some((icono) => icono.purpose === "maskable"));
});

test("el service worker nunca cachea envíos y prioriza la red para datos y páginas", () => {
  assert.equal(strategyFor(get("/api/estado")), "network-first");
  assert.equal(strategyFor(get("/", "navigate")), "network-first");
  assert.equal(strategyFor({ ...get("/api/reportes"), method: "POST" }), "network-only");
  assert.equal(strategyFor(get("/api/reportes/abc/confirmar")), "network-only");
  assert.equal(strategyFor(get("/_next/static/chunks/app.js")), "cache-first");
  assert.equal(strategyFor(get("/data/terreno.png")), "stale-while-revalidate");
  assert.equal(strategyFor({ ...get("/tiles/1/2/3.png"), sameOrigin: false }), "network-only");
});

test("una copia guardada siempre se anuncia como copia, con o sin red", () => {
  assert.match(avisoDesdeCache("2026-10-23T12:00:00Z", AHORA, true), /^No pudimos actualizar con el servidor · mostrando la copia guardada de esta pantalla, hace 3 h \(09:00\)\. No es el estado actual\.$/);
  assert.match(avisoDesdeCache("2026-10-23T12:00:00Z", AHORA, false), /^Sin conexión · /);
  assert.match(avisoDesdeCache(undefined, AHORA, true), /sin hora de lectura/);
});
