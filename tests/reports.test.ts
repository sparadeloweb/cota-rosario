import { test } from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("isolated store: validation, writes, confirmations, expiry and corruption", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "cota-reports-test-"));
  process.env.COTA_DATA_DIR = directory;
  const { createReport, confirmReport, listReports, validateReport } = await import("../src/lib/reports");
  const input = { lat: -32.9468, lon: -60.6393, type: "street", description: "Prueba local de demo" };

  await t.test("rejects inherited names and points outside the polygon", () => {
    assert.throws(() => validateReport({ ...input, type: "toString" }));
    assert.throws(() => validateReport({ ...input, lat: -32.8, lon: -60.55 }));
    assert.equal(validateReport({ ...input, description: " <b>Prueba</b> " }).description, "Prueba");
  });

  const report = await createReport(input, "autor-demo");
  await t.test("the same connection confirms once and the DTO reveals no keys", async () => {
    assert.equal((await confirmReport(report.id, "observador-a")).confirmations, 1);
    assert.equal((await confirmReport(report.id, "observador-a")).confirmations, 1);
    assert.equal((await confirmReport(report.id, "observador-b")).confirmations, 2);
    const rows = await listReports();
    assert.equal(rows.length, 1);
    assert.equal(Object.hasOwn(rows[0], "confirmationsBy"), false);
    assert.equal(Object.hasOwn(report, "confirmationsBy"), false);
  });

  await t.test("concurrent writes keep every report", async () => {
    await Promise.all(Array.from({ length: 8 }, (_, i) => createReport(input, `autor-${i}`)));
    assert.equal((await listReports()).length, 9);
    assert.equal(JSON.parse(await readFile(path.join(directory, "reports.json"), "utf8")).length, 9);
  });

  await t.test("expired reports are removed on read", async () => {
    const file = path.join(directory, "reports.json");
    const rows = JSON.parse(await readFile(file, "utf8"));
    rows[0].createdAt = new Date(Date.now() - 25 * 3600000).toISOString();
    await writeFile(file, JSON.stringify(rows));
    assert.equal((await listReports()).length, 8);
    assert.equal(JSON.parse(await readFile(file, "utf8")).length, 8);
  });

  await t.test("a corrupt file fails without deleting it or returning zero reports", async () => {
    const file = path.join(directory, "reports.json");
    await writeFile(file, "{archivo roto");
    await assert.rejects(listReports, { status: 503 });
    await assert.rejects(() => createReport(input, "autor-final"), { status: 503 });
    assert.equal(await readFile(file, "utf8"), "{archivo roto");
  });

  await t.test("reads a legacy Spanish store, migrates its rows and removes it on the next write", async () => {
    await unlink(path.join(directory, "reports.json"));
    const legacy = path.join(directory, "reportes.json");
    await writeFile(legacy, JSON.stringify([{ id: "legado", lat: input.lat, lon: input.lon, tipo: "vivienda", descripcion: "Agua en la casa", creadoEn: new Date().toISOString(), confirmaciones: 2 }]));
    const [migrated] = await listReports();
    assert.equal(migrated.type, "home");
    assert.equal(migrated.description, "Agua en la casa");
    assert.equal(migrated.confirmations, 2);
    await createReport(input, "after-migration");
    assert.equal(JSON.parse(await readFile(path.join(directory, "reports.json"), "utf8")).length, 2);
    await assert.rejects(() => access(legacy));
  });
});
