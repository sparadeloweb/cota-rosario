import { test } from "node:test";
import assert from "node:assert/strict";
import { BodyTooLargeError, clientIp, readJsonBody, UNIDENTIFIED_CLIENT } from "../src/lib/requestGuard";

const headers = (entries: Record<string, string>) => new Headers(entries);

test("the client IP comes from Cloudflare and never from a spoofable forwarded header", () => {
  assert.equal(clientIp(headers({ "cf-connecting-ip": "190.12.3.4", "x-forwarded-for": "1.1.1.1" })), "190.12.3.4");
  assert.equal(clientIp(headers({ "cf-connecting-ip": "2800:810:5ab::1" })), "2800:810:5ab::1");
  assert.equal(clientIp(headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" })), UNIDENTIFIED_CLIENT);
  assert.equal(clientIp(headers({ "cf-connecting-ip": "not-an-ip; drop table" })), UNIDENTIFIED_CLIENT);
  assert.equal(clientIp(headers({})), UNIDENTIFIED_CLIENT);
});

test("a JSON body within the limit is parsed and invalid JSON becomes null", async () => {
  const ok = new Request("http://local/api", { method: "POST", body: JSON.stringify({ a: 1 }) });
  assert.deepEqual(await readJsonBody(ok, 64), { a: 1 });
  const broken = new Request("http://local/api", { method: "POST", body: "{broken" });
  assert.equal(await readJsonBody(broken, 64), null);
});

test("an oversized body is rejected by its declared length and while streaming", async () => {
  const declared = new Request("http://local/api", { method: "POST", body: "x".repeat(10), headers: { "content-length": "999999" } });
  await assert.rejects(() => readJsonBody(declared, 64), BodyTooLargeError);
  const streamed = new Request("http://local/api", { method: "POST", body: JSON.stringify({ text: "x".repeat(500) }) });
  await assert.rejects(() => readJsonBody(streamed, 64), BodyTooLargeError);
});
