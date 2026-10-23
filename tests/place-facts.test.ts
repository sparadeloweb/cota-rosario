import { test } from "node:test";
import assert from "node:assert/strict";
import { placeFacts } from "../src/lib/placeFacts";
import type { Finding, TerrainMeta } from "../src/lib/lookup";

const TERRAIN_META = { maxScaleMeters: 3, windowMeters: 300 } as TerrainMeta;
const BASE: Finding = { label: "Casa", inside: false, nearest: { zone: "A2", meters: 640 }, terrain: null, climateRisk: null, district: null, neighbourhood: null };

test("outside the official map it reports the nearest zone without alarm", () => {
  const [official] = placeFacts(BASE, TERRAIN_META);
  assert.equal(official.id, "official");
  assert.equal(official.verdict, "Fuera");
  assert.equal(official.tone, "neutral");
  assert.match(official.detail, /A2.*640 m/);
});

test("inside the official map it takes the tone of today's level", () => {
  const [normal] = placeFacts({ ...BASE, inside: true, zone: "B1", level: "normal" }, TERRAIN_META);
  assert.equal(normal.verdict, "Zona B1");
  assert.equal(normal.tone, "watch");
  const [alert] = placeFacts({ ...BASE, inside: true, zone: "B1", level: "alert" }, TERRAIN_META);
  assert.equal(alert.tone, "alert");
});

test("only facts with data are shown", () => {
  assert.deepEqual(placeFacts(BASE, TERRAIN_META).map((fact) => fact.id), ["official"]);
  const complete = placeFacts({ ...BASE, climateRisk: "high", terrain: { status: "low", meters: 1.24 }, district: { district: "OESTE", share: 18, peakMonth: null } }, TERRAIN_META);
  assert.deepEqual(complete.map((fact) => fact.id), ["official", "climateRisk", "relief", "history"]);
});

test("a low point shows its meters and respects the scale cap", () => {
  const low = placeFacts({ ...BASE, terrain: { status: "low", meters: 1.24 } }, TERRAIN_META).find((fact) => fact.id === "relief");
  assert.equal(low?.verdict, "1.2 m abajo");
  assert.equal(low?.tone, "watch");
  const cap = placeFacts({ ...BASE, terrain: { status: "low", meters: 4 } }, TERRAIN_META).find((fact) => fact.id === "relief");
  assert.equal(cap?.verdict, "más de 3 m abajo");
  const built = placeFacts({ ...BASE, terrain: { status: "built", meters: 0 } }, TERRAIN_META).find((fact) => fact.id === "relief");
  assert.equal(built?.verdict, "Sin lectura");
});

test("high or medium municipal climate risk is flagged, low is not", () => {
  const high = placeFacts({ ...BASE, climateRisk: "high" }, TERRAIN_META).find((fact) => fact.id === "climateRisk");
  assert.equal(high?.tone, "alert");
  const low = placeFacts({ ...BASE, climateRisk: "very low" }, TERRAIN_META).find((fact) => fact.id === "climateRisk");
  assert.equal(low?.tone, "neutral");
  assert.equal(low?.verdict, "Muy bajo");
});
