import { test } from "node:test";
import assert from "node:assert/strict";
import { nearestAddressUrl, parseNearestAddress } from "../src/lib/addressSuggestions";

const feature = (coordinates: [number, number], properties: Record<string, unknown>) => ({ type: "Feature", geometry: { type: "Point", coordinates }, properties });

test("nearest address prefers a street and house number in Rosario", () => {
  const payload = {
    features: [
      feature([-60.6313, -32.9528], { name: "Bar El Cairo", city: "Rosario", district: "Centro" }),
      feature([-60.6312, -32.9529], { street: "Mendoza", housenumber: "512", city: "Rosario", district: "Centro" }),
    ],
  };
  assert.deepEqual(parseNearestAddress(payload), { label: "Mendoza 512", detail: "Centro" });
});

test("nearest address falls back to the street name without a number", () => {
  const payload = { features: [feature([-60.64, -32.95], { street: "Bv. Oroño", city: "Rosario", district: "Centro" })] };
  assert.deepEqual(parseNearestAddress(payload), { label: "Bv. Oroño", detail: "Centro" });
});

test("nearest address ignores results outside Rosario and malformed payloads", () => {
  assert.equal(parseNearestAddress({ features: [feature([-60.6263, -33.0244], { street: "San Martín", housenumber: "2000", city: "Villa Gobernador Gálvez" })] }), null);
  assert.equal(parseNearestAddress(null), null);
  assert.equal(parseNearestAddress({ features: "nope" }), null);
});

test("nearest address url asks the reverse geocoder for the exact point", () => {
  const url = new URL(nearestAddressUrl(-32.9529, -60.6312));
  assert.equal(url.pathname, "/reverse");
  assert.equal(url.searchParams.get("lat"), "-32.9529");
  assert.equal(url.searchParams.get("lon"), "-60.6312");
});
