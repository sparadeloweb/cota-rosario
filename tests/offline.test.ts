import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import manifest from "../src/app/manifest";
import { NO_READING, describeAge, cachedCopyNotice, offlineNotice } from "../src/lib/offline";

const require = createRequire(import.meta.url);
const { strategyFor } = require("../public/sw-strategy.js") as { strategyFor: (request: { method: string; mode: string; pathname: string; sameOrigin: boolean }) => string };

const NOW = Date.parse("2026-10-23T15:00:00Z");
const get = (pathname: string, mode = "cors") => ({ method: "GET", mode, pathname, sameOrigin: true });

test("the age of the last reading is told in minutes, hours or with a date", () => {
  assert.equal(describeAge("2026-10-23T14:59:30Z", NOW), "hace instantes");
  assert.equal(describeAge("2026-10-23T14:20:00Z", NOW), "hace 40 min");
  assert.equal(describeAge("2026-10-23T12:00:00Z", NOW), "hace 3 h");
  assert.equal(describeAge("2026-10-21T15:00:00Z", NOW), "del 21/10 12:00");
});

test("without a valid date it is never presented as a current reading", () => {
  assert.equal(describeAge(undefined, NOW), NO_READING);
  assert.equal(describeAge("no es fecha", NOW), NO_READING);
  assert.equal(describeAge("2026-10-24T15:00:00Z", NOW), NO_READING);
  assert.equal(offlineNotice(undefined, NOW), "Sin conexión · no hay una lectura guardada");
  const notice = offlineNotice("2026-10-23T12:00:00Z", NOW);
  assert.match(notice, /hace 3 h \(09:00\)/);
  assert.match(notice, /No es el estado actual/);
});

test("the manifest declares an installable app with regular and maskable icons", () => {
  const data = manifest();
  assert.equal(data.start_url, "/");
  assert.equal(data.display, "standalone");
  assert.equal(data.short_name, "Cota");
  const sizes = (data.icons ?? []).map((icon) => icon.sizes);
  assert.ok(sizes.includes("192x192") && sizes.includes("512x512"));
  assert.ok((data.icons ?? []).some((icon) => icon.purpose === "maskable"));
});

test("the service worker never caches submissions and prefers the network for data and pages", () => {
  assert.equal(strategyFor(get("/api/status")), "network-first");
  assert.equal(strategyFor(get("/", "navigate")), "network-first");
  assert.equal(strategyFor({ ...get("/api/reports"), method: "POST" }), "network-only");
  assert.equal(strategyFor(get("/api/reports/abc/confirm")), "network-only");
  assert.equal(strategyFor(get("/_next/static/chunks/app.js")), "cache-first");
  assert.equal(strategyFor(get("/data/terrain.png")), "stale-while-revalidate");
  assert.equal(strategyFor({ ...get("/tiles/1/2/3.png"), sameOrigin: false }), "network-only");
});

test("a cached copy is always announced as a copy, online or offline", () => {
  assert.match(cachedCopyNotice("2026-10-23T12:00:00Z", NOW, true), /^No pudimos actualizar con el servidor · mostrando la copia guardada de esta pantalla, hace 3 h \(09:00\)\. No es el estado actual\.$/);
  assert.match(cachedCopyNotice("2026-10-23T12:00:00Z", NOW, false), /^Sin conexión · /);
  assert.match(cachedCopyNotice(undefined, NOW, true), /sin hora de lectura/);
});
