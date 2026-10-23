import { test } from "node:test";
import assert from "node:assert/strict";
import type { FeatureCollection, Polygon } from "geojson";
import { featureAt, nearestFeature } from "../src/lib/lookup";

test("polygon distance is measured against its segments, not only its vertices", () => {
  const collection: FeatureCollection<Polygon, Record<string, string>> = { type: "FeatureCollection", features: [{ type: "Feature", properties: { zone: "demo" }, geometry: { type: "Polygon", coordinates: [[[-60.67, -32.96], [-60.65, -32.96], [-60.65, -32.94], [-60.67, -32.94], [-60.67, -32.96]]] } }] };
  assert.equal(featureAt(collection, -32.95, -60.66)?.properties.zone, "demo");
  assert.equal(featureAt(collection, -32.961, -60.66), undefined);
  const nearest = nearestFeature(collection, -32.961, -60.66);
  assert.ok(nearest && nearest.meters > 100 && nearest.meters < 120);
});

test("geocoder results are validated before use", async () => {
  const { parseGeocoderResult } = await import("../src/lib/placeReader");
  assert.deepEqual(parseGeocoderResult([{ lat: "-32.95", lon: "-60.65", display_name: "Córdoba 1500, Centro, Rosario" }]), { lat: -32.95, lon: -60.65, label: "Córdoba 1500, Centro, Rosario" });
  assert.equal(parseGeocoderResult([]), null);
  assert.equal(parseGeocoderResult({ error: "rate limited" }), null);
  assert.equal(parseGeocoderResult([{ lat: "x", lon: "-60.65", display_name: "Algo" }]), null);
  assert.equal(parseGeocoderResult([{ lat: "-32.9", lon: "-60.6" }]), null);
});
