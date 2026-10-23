import { test } from "node:test";
import assert from "node:assert/strict";
import { clearLiveSources, readLiveSource, type FreshnessPolicy } from "../src/lib/liveSources";

const POLICY: FreshnessPolicy = { freshMs: 1_000, staleMs: 10_000, hourly: false };
const HOURLY: FreshnessPolicy = { ...POLICY, hourly: true };
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("responses are reused while fresh and Refresh fetches again", async () => {
  let calls = 0;
  const load = async () => ++calls;
  const start = Date.now() + 1_000_000;
  assert.equal(await readLiveSource("test:reuse", POLICY, load, start), 1);
  assert.equal(await readLiveSource("test:reuse", POLICY, load, start + 500), 1);
  assert.equal(clearLiveSources(start + 60_000), true);
  assert.equal(await readLiveSource("test:reuse", POLICY, load, start + 60_000), 2);
});

test("a stale value is served at once and refreshed in the background", async () => {
  let calls = 0;
  const load = async () => ++calls;
  const start = Date.now() + 2_000_000;
  assert.equal(await readLiveSource("test:stale", POLICY, load, start), 1);
  assert.equal(await readLiveSource("test:stale", POLICY, load, start + 5_000), 1);
  await settle();
  assert.equal(await readLiveSource("test:stale", POLICY, load, start + 5_100), 2);
});

test("a value past its stale limit is never served", async () => {
  let calls = 0;
  const load = async () => ++calls;
  const start = Date.now() + 3_000_000;
  assert.equal(await readLiveSource("test:expired", POLICY, load, start), 1);
  assert.equal(await readLiveSource("test:expired", POLICY, load, start + 20_000), 2);
});

test("a failed refresh keeps the last good value and a failed first load is not cached", async () => {
  let calls = 0;
  const flaky = async () => {
    calls += 1;
    if (calls === 2 || calls === 3) throw new Error("upstream down");
    return calls;
  };
  const start = Date.now() + 4_000_000;
  assert.equal(await readLiveSource("test:flaky", POLICY, flaky, start), 1);
  assert.equal(await readLiveSource("test:flaky", POLICY, flaky, start + 5_000), 1);
  await settle();
  assert.equal(await readLiveSource("test:flaky", POLICY, flaky, start + 5_100), 1);
  assert.equal(calls, 2);
  await assert.rejects(() => readLiveSource("test:cold", POLICY, async () => { throw new Error("down"); }, start));
  assert.equal(await readLiveSource("test:cold", POLICY, async () => 7, start + 1), 7);
});

test("hourly sources are reloaded when the hour changes", async () => {
  let calls = 0;
  const load = async () => ++calls;
  const hour = 3_600_000;
  const start = (Math.floor(Date.now() / hour) + 100) * hour + 10;
  assert.equal(await readLiveSource("test:hourly", HOURLY, load, start), 1);
  assert.equal(await readLiveSource("test:hourly", HOURLY, load, start + hour), 2);
});

test("back-to-back refresh requests do not clear the cache every time", async () => {
  let calls = 0;
  const load = async () => ++calls;
  const start = Date.now() + 5_000_000;
  assert.equal(clearLiveSources(start), true);
  await readLiveSource("test:limit", POLICY, load, start);
  assert.equal(clearLiveSources(start + 1_000), false);
  assert.equal(await readLiveSource("test:limit", POLICY, load, start + 1_000), 1);
  assert.equal(clearLiveSources(start + 10_000), true);
  assert.equal(await readLiveSource("test:limit", POLICY, load, start + 10_000), 2);
});
