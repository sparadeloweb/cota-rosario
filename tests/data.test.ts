import { test } from "node:test";
import assert from "node:assert/strict";
import { rainFromResponse, outlookFromResponse, type ForecastResponse } from "../src/lib/rain";
import { addCalendarDays, argentinaDay, sourceTime } from "../src/lib/time";
import { nonNegative, probability, requireRecent } from "../src/lib/dataChecks";

const now = Date.parse("2026-10-13T16:00:00Z");
function forecast(start = "2026-10-13", days = 7): ForecastResponse {
  const first = Date.parse(`${start}T00:00:00Z`);
  return {
    utc_offset_seconds: -10800,
    hourly: {
      time: Array.from({ length: days * 24 }, (_, i) => new Date(first + i * 3600000).toISOString().slice(0, 16)),
      precipitation: Array(days * 24).fill(0),
    },
    daily: { time: Array.from({ length: days }, (_, i) => addCalendarDays(start, i)), precipitation_sum: Array(days).fill(0) },
  };
}

test("rain uses the source timezone regardless of the server", () => {
  const previous = process.env.TZ;
  try {
    const outputs = ["UTC", "America/Argentina/Buenos_Aires"].map((tz) => {
      process.env.TZ = tz;
      const data = forecast();
      data.hourly.precipitation[13] = 12;
      data.hourly.precipitation[14] = 14;
      return rainFromResponse(data, now);
    });
    assert.deepEqual(outputs[0], outputs[1]);
    assert.equal(outputs[0].peakWindow?.millimeters, 26);
    assert.equal(outputs[0].peakWindow?.from, "2026-10-13T13:00-03:00");
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});

test("a null rain value is never turned into zero", () => {
  const data = forecast();
  data.hourly.precipitation[13] = null;
  assert.throws(() => rainFromResponse(data, now), /Lluvia horaria/);
  assert.throws(() => nonNegative(null, "rain"));
  assert.throws(() => nonNegative(-1, "rain"));
  assert.equal(probability(null), null);
  assert.equal(probability(0), 0);
  assert.equal(probability(101), null);
});

test("short or discontinuous hourly windows are rejected", () => {
  assert.throws(() => rainFromResponse(forecast("2026-10-13", 2), now), /48 horas/);
  const data = forecast();
  data.hourly.time[15] = data.hourly.time[14];
  assert.throws(() => rainFromResponse(data, now), /horas faltantes/);
});

test("the weekly window starts today and needs seven full days", () => {
  const data = forecast();
  const out = outlookFromResponse(data, now);
  assert.equal(out.days[0].date, "2026-10-13");
  assert.equal(out.days.at(-1)?.date, "2026-10-19");
  assert.equal(out.days[0].probability, null);
  assert.throws(() => outlookFromResponse(forecast("2026-10-11"), now), /siete días/);
  data.daily!.precipitation_sum[2] = null;
  assert.throws(() => outlookFromResponse(data, now), /Lluvia diaria/);
});

test("date checks tell fetch time apart from data validity", () => {
  assert.equal(argentinaDay(Date.parse("2026-10-14T01:00Z")), "2026-10-13");
  assert.equal(addCalendarDays("2026-12-31", 1), "2027-01-01");
  assert.equal(sourceTime("2026-10-13T13:00", -10800), "2026-10-13T13:00-03:00");
  assert.throws(() => sourceTime("2026-10-13T13:00", NaN));
  assert.throws(() => requireRecent("2026-10-10T00:00Z", 48 * 3600000, "INA", now));
  assert.throws(() => requireRecent("2026-10-14T00:00Z", 48 * 3600000, "INA", now));
  requireRecent("2026-10-13T00:00Z", 48 * 3600000, "INA", now);
});

test("Flood Hub stays out of the sources while there is no key", async () => {
  const { activeSources, floodHubEnabled } = await import("../src/lib/sources");
  assert.equal(floodHubEnabled({}), false);
  assert.equal(floodHubEnabled({ FLOODHUB_API_KEY: "   " }), false);
  assert.equal("floodHub" in activeSources({}), false);
  assert.equal(activeSources({ FLOODHUB_API_KEY: "clave" }).floodHub?.model, true);
});
