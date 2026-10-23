import { test } from "node:test";
import assert from "node:assert/strict";
import { CONSEJOS, CONSEJOS_INCOMPLETO, consejosPara, tituloEstado } from "../src/lib/vecinos";

test("el título del estado nunca afirma normalidad sin datos", () => {
  assert.equal(tituloEstado(null), "Faltan datos para una evaluación completa");
  assert.equal(tituloEstado("normal"), "Sin señales elevadas en los datos consultados");
  assert.match(tituloEstado("alerta"), /^Nivel alerta/i);
});

test("los consejos de una evaluación incompleta suman el aviso de datos parciales", () => {
  assert.deepEqual(consejosPara({ nivel: null, incompleto: true }), CONSEJOS_INCOMPLETO);
  assert.deepEqual(consejosPara({ nivel: "atencion", incompleto: false }), CONSEJOS.atencion);
  const parcial = consejosPara({ nivel: "normal", incompleto: true });
  assert.equal(parcial.at(-1), CONSEJOS_INCOMPLETO[0]);
  assert.equal(parcial.length, CONSEJOS.normal.length + 1);
  assert.equal(CONSEJOS.normal.length, 2);
});
