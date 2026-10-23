import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_LUGARES, agregarLugar, parseLugares, quitarLugar, renombrarLugar, serializeLugares, type Lugar } from "../src/lib/places";

const CASA: Lugar = { id: "casa", nombre: "Casa", lat: -32.9468, lon: -60.6393 };
const TRABAJO: Lugar = { id: "trabajo", nombre: "Trabajo", lat: -32.9552, lon: -60.6723 };

test("guardar y leer conserva nombre y coordenadas", () => {
  assert.deepEqual(parseLugares(serializeLugares([CASA, TRABAJO])), [CASA, TRABAJO]);
});

test("datos corruptos o ajenos devuelven una lista vacía sin romper", () => {
  assert.deepEqual(parseLugares(null), []);
  assert.deepEqual(parseLugares("{no es json"), []);
  assert.deepEqual(parseLugares(JSON.stringify({ casa: CASA })), []);
  assert.deepEqual(parseLugares(JSON.stringify([{ ...CASA, lat: "-32.9" }, { ...CASA, id: "x", nombre: "  " }])), []);
});

test("se descartan puntos fuera de Rosario y se corta en el máximo", () => {
  const buenos = Array.from({ length: MAX_LUGARES + 2 }, (_, i) => ({ ...CASA, id: `l${i}`, lat: CASA.lat - i * 0.001 }));
  const cordoba = { ...CASA, id: "cba", lat: -31.42, lon: -64.18 };
  const leidos = parseLugares(JSON.stringify([cordoba, ...buenos]));
  assert.equal(leidos.length, MAX_LUGARES);
  assert.ok(!leidos.some((lugar) => lugar.id === "cba"));
});

test("agregar rechaza duplicados a menos de 30 m, puntos fuera, nombres vacíos y la lista llena", () => {
  assert.equal(agregarLugar([CASA], { ...TRABAJO }).error, null);
  assert.equal(agregarLugar([CASA], { ...CASA, id: "otra", lat: CASA.lat + 0.0001 }).error, "duplicado");
  assert.equal(agregarLugar([], { ...CASA, lat: -34.6, lon: -58.4 }).error, "fuera");
  assert.equal(agregarLugar([], { ...CASA, nombre: "   " }).error, "nombre");
  const llena = Array.from({ length: MAX_LUGARES }, (_, i) => ({ ...CASA, id: `l${i}`, lat: CASA.lat - i * 0.002 }));
  const resultado = agregarLugar(llena, TRABAJO);
  assert.equal(resultado.error, "lleno");
  assert.equal(resultado.lugares.length, MAX_LUGARES);
});

test("quitar y renombrar no mutan la lista original", () => {
  const lista = [CASA, TRABAJO];
  assert.deepEqual(quitarLugar(lista, "casa"), [TRABAJO]);
  assert.equal(renombrarLugar(lista, "casa", "  Depto  ")[0].nombre, "Depto");
  assert.equal(renombrarLugar(lista, "casa", "   ")[0].nombre, "Casa");
  assert.equal(lista[0].nombre, "Casa");
  assert.equal(lista.length, 2);
});
