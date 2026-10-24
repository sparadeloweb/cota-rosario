import { test } from "node:test";
import assert from "node:assert/strict";
import { rainIntensity, type WeatherNow } from "../src/lib/weather";

const weather = (changes: Partial<WeatherNow>): WeatherNow => ({
  temperature: 15,
  feelsLike: 14,
  humidity: 80,
  pressure: 1008,
  wind: 10,
  rainNow: 0,
  rainProbability: 5,
  windowHours: 6,
  code: 3,
  description: "Nublado",
  icon: "overcast",
  measuredAt: "2026-10-24T03:00",
  fetchedAt: "2026-10-24T06:00:00Z",
  ...changes,
});

test("no rain without weather or with a dry sky", () => {
  assert.equal(rainIntensity(null), null);
  assert.equal(rainIntensity(weather({})), null);
});

test("measured precipitation decides the intensity", () => {
  assert.equal(rainIntensity(weather({ rainNow: 0.3 })), "light");
  assert.equal(rainIntensity(weather({ rainNow: 4, icon: "rain" })), "heavy");
});

test("a rainy sky code counts as light rain even before the gauge moves", () => {
  assert.equal(rainIntensity(weather({ icon: "drizzle" })), "light");
  assert.equal(rainIntensity(weather({ icon: "storm" })), "heavy");
});
