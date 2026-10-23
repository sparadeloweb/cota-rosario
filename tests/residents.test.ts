import { test } from "node:test";
import assert from "node:assert/strict";
import { ADVICE, ADVICE_INCOMPLETE, tipsFor, statusTitle } from "../src/lib/residents";

test("the status title never claims normality without data", () => {
  assert.equal(statusTitle(null), "Faltan datos para una evaluación completa");
  assert.equal(statusTitle("normal"), "Sin señales elevadas en los datos consultados");
  assert.match(statusTitle("alert"), /^Nivel alerta/i);
});

test("tips for an incomplete assessment add the partial-data notice", () => {
  assert.deepEqual(tipsFor({ level: null, incomplete: true }), ADVICE_INCOMPLETE);
  assert.deepEqual(tipsFor({ level: "watch", incomplete: false }), ADVICE.watch);
  const partial = tipsFor({ level: "normal", incomplete: true });
  assert.equal(partial.at(-1), ADVICE_INCOMPLETE[0]);
  assert.equal(partial.length, ADVICE.normal.length + 1);
  assert.equal(ADVICE.normal.length, 2);
});
