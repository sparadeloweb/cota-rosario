import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_DRAFT, submissionBody, isReportType, previousStep, canAdvance, nextStep } from "../src/lib/reportFlow";
import { DESCRIPTION_MAX_CHARS } from "../src/lib/reportTypes";

const COMPLETE_DRAFT = { type: "street" as const, lat: -32.9468, lon: -60.6393, placeLabel: "Córdoba 1500", description: "  Agua hasta el cordón  " };

test("each step requires its data before advancing", () => {
  assert.equal(canAdvance("type", EMPTY_DRAFT), false);
  assert.equal(canAdvance("type", { ...EMPTY_DRAFT, type: "home" }), true);
  assert.equal(canAdvance("place", { ...EMPTY_DRAFT, lat: -32.95 }), false);
  assert.equal(canAdvance("place", { ...EMPTY_DRAFT, lat: -34.6, lon: -58.4 }), false);
  assert.equal(canAdvance("place", COMPLETE_DRAFT), true);
  assert.equal(canAdvance("detail", { ...COMPLETE_DRAFT, description: "" }), true);
  assert.equal(canAdvance("detail", { ...COMPLETE_DRAFT, description: "x".repeat(DESCRIPTION_MAX_CHARS + 1) }), false);
});

test("prototype-inherited names are not accepted as report types", () => {
  assert.equal(isReportType("toString"), false);
  assert.equal(isReportType("street"), true);
});

test("the submission body exists only for a complete draft and trims the description", () => {
  assert.equal(submissionBody({ ...COMPLETE_DRAFT, lat: null }), null);
  assert.deepEqual(submissionBody(COMPLETE_DRAFT), { lat: COMPLETE_DRAFT.lat, lon: COMPLETE_DRAFT.lon, type: "street", description: "Agua hasta el cordón", web: "" });
});

test("step navigation never goes past either end", () => {
  assert.equal(nextStep("type"), "place");
  assert.equal(nextStep("review"), "review");
  assert.equal(previousStep("type"), "type");
  assert.equal(previousStep("detail"), "place");
});

test("quick phrases are appended without repeating or passing the limit", async () => {
  const { appendPhrase } = await import("../src/lib/reportFlow");
  assert.equal(appendPhrase("", "llega al cordón"), "llega al cordón");
  assert.equal(appendPhrase("llega al cordón", "no pasan autos"), "llega al cordón, no pasan autos");
  assert.equal(appendPhrase("Llega al cordón", "llega al cordón"), "Llega al cordón");
  const length = "x".repeat(DESCRIPTION_MAX_CHARS - 3);
  assert.equal(appendPhrase(length, "no pasan autos"), length);
});
