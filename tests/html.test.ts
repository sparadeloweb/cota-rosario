import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../src/lib/html";

test("HTML special characters are escaped before reaching a map popup", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('x')">&`), "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;");
  assert.equal(escapeHtml("Zona 3 · sector 2"), "Zona 3 · sector 2");
});
