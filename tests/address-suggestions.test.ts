import { test } from "node:test";
import assert from "node:assert/strict";
import { MIN_QUERY_CHARS, parseSuggestions, suggestionUrl } from "../src/lib/addressSuggestions";

const feature = (coordinates: [number, number], properties: Record<string, unknown>) => ({ type: "Feature", geometry: { type: "Point", coordinates }, properties });

test("suggestions keep only places in Rosario and read like an address", () => {
  const payload = {
    features: [
      feature([-60.6404, -32.9609], { street: "José de San Martín", housenumber: "2000", district: "Abasto", city: "Rosario" }),
      feature([-60.6263, -33.0244], { street: "Avenida San Martín", housenumber: "2000", district: "Centro", city: "Villa Gobernador Gálvez" }),
      feature([-60.6448, -32.9565], { name: "Avenida Pellegrini y Corrientes", street: "Avenida Carlos Pellegrini", district: "Centro", city: "Rosario" }),
      feature([-60.6373, -32.9765], { name: "General San Martín", city: "Rosario" }),
      feature([-60.6536, -32.9497], { name: "Superior de Comercio", street: "Balcarce", housenumber: "1240", district: "Centro", city: "Rosario" }),
    ],
  };
  assert.deepEqual(parseSuggestions(payload), [
    { label: "José de San Martín 2000", detail: "Abasto", lat: -32.9609, lon: -60.6404 },
    { label: "Avenida Pellegrini y Corrientes", detail: "Centro", lat: -32.9565, lon: -60.6448 },
    { label: "General San Martín", detail: "Rosario", lat: -32.9765, lon: -60.6373 },
    { label: "Superior de Comercio", detail: "Balcarce 1240", lat: -32.9497, lon: -60.6536 },
  ]);
});

test("duplicate labels collapse and malformed features are ignored", () => {
  const payload = {
    features: [
      feature([-60.64, -32.95], { name: "Plaza San Martín", city: "Rosario" }),
      feature([-60.641, -32.951], { name: "Plaza San Martín", city: "Rosario" }),
      { type: "Feature", geometry: { type: "Point", coordinates: ["x", "y"] }, properties: { name: "Roto", city: "Rosario" } },
      feature([-60.64, -32.95], { city: "Rosario" }),
    ],
  };
  assert.equal(parseSuggestions(payload).length, 1);
  assert.deepEqual(parseSuggestions({ error: "nope" }), []);
  assert.deepEqual(parseSuggestions(null), []);
});

test("the request is biased to Rosario and needs a few characters", () => {
  assert.equal(suggestionUrl("ab"), null);
  const url = new URL(suggestionUrl(" Oroño y Pellegrini ") ?? "");
  assert.equal(url.searchParams.get("q"), "Oroño y Pellegrini");
  assert.ok(url.searchParams.get("bbox"));
  assert.ok(url.searchParams.get("lat") && url.searchParams.get("lon"));
  assert.ok(MIN_QUERY_CHARS >= 3);
});
