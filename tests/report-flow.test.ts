import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_DRAFT, cuerpoDelEnvio, esTipo, pasoAnterior, puedeAvanzar, siguientePaso } from "../src/lib/reportFlow";
import { DESCRIPTION_MAX_CHARS } from "../src/lib/reportTypes";

const COMPLETO = { tipo: "calle" as const, lat: -32.9468, lon: -60.6393, etiquetaLugar: "Córdoba 1500", descripcion: "  Agua hasta el cordón  " };

test("cada paso exige su dato antes de avanzar", () => {
  assert.equal(puedeAvanzar("tipo", EMPTY_DRAFT), false);
  assert.equal(puedeAvanzar("tipo", { ...EMPTY_DRAFT, tipo: "vivienda" }), true);
  assert.equal(puedeAvanzar("lugar", { ...EMPTY_DRAFT, lat: -32.95 }), false);
  assert.equal(puedeAvanzar("lugar", { ...EMPTY_DRAFT, lat: -34.6, lon: -58.4 }), false);
  assert.equal(puedeAvanzar("lugar", COMPLETO), true);
  assert.equal(puedeAvanzar("detalle", { ...COMPLETO, descripcion: "" }), true);
  assert.equal(puedeAvanzar("detalle", { ...COMPLETO, descripcion: "x".repeat(DESCRIPTION_MAX_CHARS + 1) }), false);
});

test("los tipos heredados del prototipo no pasan como tipos de reporte", () => {
  assert.equal(esTipo("toString"), false);
  assert.equal(esTipo("calle"), true);
});

test("el cuerpo del envío sólo existe con el borrador completo y recorta la descripción", () => {
  assert.equal(cuerpoDelEnvio({ ...COMPLETO, lat: null }), null);
  assert.deepEqual(cuerpoDelEnvio(COMPLETO), { lat: COMPLETO.lat, lon: COMPLETO.lon, tipo: "calle", descripcion: "Agua hasta el cordón", web: "" });
});

test("la navegación entre pasos no se sale de los extremos", () => {
  assert.equal(siguientePaso("tipo"), "lugar");
  assert.equal(siguientePaso("revisar"), "revisar");
  assert.equal(pasoAnterior("tipo"), "tipo");
  assert.equal(pasoAnterior("detalle"), "lugar");
});

test("las frases rápidas se suman a la descripción sin repetirse ni pasarse del máximo", async () => {
  const { agregarFrase } = await import("../src/lib/reportFlow");
  assert.equal(agregarFrase("", "llega al cordón"), "llega al cordón");
  assert.equal(agregarFrase("llega al cordón", "no pasan autos"), "llega al cordón, no pasan autos");
  assert.equal(agregarFrase("Llega al cordón", "llega al cordón"), "Llega al cordón");
  const largo = "x".repeat(DESCRIPTION_MAX_CHARS - 3);
  assert.equal(agregarFrase(largo, "no pasan autos"), largo);
});
