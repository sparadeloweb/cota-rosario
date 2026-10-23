import { test } from "node:test";
import assert from "node:assert/strict";
import { GEOCODER_ORIGIN, MAP_TILE_ORIGIN, SUGGESTION_ORIGIN, contentSecurityPolicy, securityHeaders } from "../src/lib/securityHeaders";

test("production CSP blocks framing, plugins and foreign hosts except the map tiles and geocoder", () => {
  const policy = contentSecurityPolicy(false);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /base-uri 'self'/);
  assert.ok(policy.includes(`img-src 'self' data: blob: ${MAP_TILE_ORIGIN}`));
  assert.ok(policy.includes(`connect-src 'self' ${GEOCODER_ORIGIN} ${SUGGESTION_ORIGIN}`));
  assert.doesNotMatch(policy, /unsafe-eval/);
  assert.match(policy, /upgrade-insecure-requests/);
});

test("development keeps eval and websockets for the dev server and skips HSTS", () => {
  assert.match(contentSecurityPolicy(true), /'unsafe-eval'/);
  assert.match(contentSecurityPolicy(true), /ws: wss:/);
  assert.equal(securityHeaders(true).some((header) => header.key === "Strict-Transport-Security"), false);
});

test("geolocation stays allowed for the app itself and every header has a value", () => {
  const headers = securityHeaders(false);
  const permissions = headers.find((header) => header.key === "Permissions-Policy");
  assert.match(permissions?.value ?? "", /geolocation=\(self\)/);
  assert.ok(headers.every((header) => header.value.length > 0));
});
