import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import districts from "../../public/data/districts.json";
import { featureAt } from "@/lib/lookup";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

import { DESCRIPTION_MAX_CHARS, REPORT_TTL_HOURS, REPORT_TYPES, type Report, type ReportType } from "@/lib/reportTypes";

export { REPORT_TTL_HOURS, REPORT_TYPES, type Report, type ReportType };

export interface NewReportInput {
  lat: unknown;
  lon: unknown;
  type: unknown;
  description?: unknown;
  web?: unknown;
}

const BOUNDS = { south: -33.1, north: -32.8, west: -60.85, east: -60.55 };
const MAX_ACTIVE_REPORTS = 500;
const REPORTS_PER_IP_PER_HOUR = 5;
const CONFIRMATIONS_PER_IP_PER_HOUR = 20;
const MILLIS_PER_HOUR = 3_600_000;
const DATA_DIR = process.env.COTA_DATA_DIR ?? "data";
const STORE_FILE = path.join(DATA_DIR, "reports.json");
const LEGACY_STORE_FILE = path.join(DATA_DIR, "reportes.json");
const LEGACY_REPORT_TYPES: Record<string, ReportType> = { calle: "street", vivienda: "home", desague: "drain", corte: "closure" };

const ipActivity = new Map<string, { reports: number[]; confirmations: number[] }>();
interface StoredReport extends Report { confirmationsBy: string[] }
const city = districts as FeatureCollection<Polygon | MultiPolygon, Record<string, string>>;
let queue: Promise<unknown> = Promise.resolve();

export class ReportError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isActive(report: Report, now: number): boolean {
  return now - new Date(report.createdAt).getTime() < REPORT_TTL_HOURS * MILLIS_PER_HOUR;
}

function fromLegacyRow(row: Record<string, unknown>): Record<string, unknown> {
  if (!("tipo" in row)) {
    return row;
  }
  const { tipo, creadoEn, descripcion, confirmaciones, ...rest } = row;
  return { ...rest, type: LEGACY_REPORT_TYPES[String(tipo)] ?? tipo, createdAt: creadoEn, description: descripcion, confirmations: confirmaciones };
}

function isStoredReport(row: Record<string, unknown>): boolean {
  const confirmationsBy = row.confirmationsBy;
  return (
    typeof row.id === "string" &&
    typeof row.type === "string" &&
    Object.hasOwn(REPORT_TYPES, row.type) &&
    Number.isFinite(row.lat) &&
    Number.isFinite(row.lon) &&
    typeof row.createdAt === "string" &&
    Number.isFinite(Date.parse(row.createdAt)) &&
    typeof row.description === "string" &&
    Number.isInteger(row.confirmations) &&
    (row.confirmations as number) >= 0 &&
    (confirmationsBy === undefined || (Array.isArray(confirmationsBy) && confirmationsBy.every((key: unknown) => typeof key === "string")))
  );
}

async function readStoreFile(): Promise<string> {
  try {
    return await readFile(STORE_FILE, "utf8");
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    return readFile(LEGACY_STORE_FILE, "utf8");
  }
}

async function readStore(): Promise<StoredReport[]> {
  try {
    const parsed = JSON.parse(await readStoreFile()) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Invalid store");
    return parsed.map((stored: unknown) => {
      if (!stored || typeof stored !== "object") throw new Error("Invalid report in store");
      const row = fromLegacyRow(stored as Record<string, unknown>);
      if (!isStoredReport(row)) throw new Error("Invalid report in store");
      return { ...row, confirmationsBy: row.confirmationsBy ?? [] } as StoredReport;
    });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    console.error("Could not read the report store:", error instanceof Error ? error.name : "Error");
    throw new ReportError("Los reportes no están disponibles; no se puede afirmar que no haya aportes.", 503);
  }
}

async function writeStore(reports: StoredReport[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const temporary = `${STORE_FILE}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(reports), { flag: "wx", mode: 0o600 });
    await rename(temporary, STORE_FILE);
    await unlink(LEGACY_STORE_FILE).catch(() => undefined);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function publicReport(report: StoredReport): Report {
  const { id, lat, lon, type, description, createdAt, confirmations } = report;
  return { id, lat, lon, type, description, createdAt, confirmations };
}

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

function recent(times: number[], now: number): number[] {
  return times.filter((time) => now - time < MILLIS_PER_HOUR);
}

function enforceRate(ip: string, kind: "reports" | "confirmations", limit: number, now: number): void {
  for (const [key, activity] of ipActivity) {
    const cleaned = { reports: recent(activity.reports, now), confirmations: recent(activity.confirmations, now) };
    if (cleaned.reports.length + cleaned.confirmations.length === 0) ipActivity.delete(key);
    else ipActivity.set(key, cleaned);
  }
  if (!ipActivity.has(ip) && ipActivity.size >= 5000) throw new ReportError("La protección de envíos está ocupada; probá más tarde.", 503);
  const activity = ipActivity.get(ip) ?? { reports: [], confirmations: [] };
  const recentHits = recent(activity[kind], now);
  if (recentHits.length >= limit) {
    throw new ReportError("Demasiados envíos desde esta conexión; probá de nuevo en un rato.", 429);
  }
  ipActivity.set(ip, { ...activity, [kind]: [...recentHits, now] });
}

function toCoordinate(value: unknown, min: number, max: number, name: string): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new ReportError(`${name} fuera de Rosario.`);
  }
  return Number(number.toFixed(5));
}

function cleanDescription(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new ReportError("La descripción tiene que ser texto.");
  }
  const text = value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > DESCRIPTION_MAX_CHARS) {
    throw new ReportError(`La descripción no puede superar ${DESCRIPTION_MAX_CHARS} caracteres.`);
  }
  return text;
}

export function validateReport(input: NewReportInput): Pick<Report, "lat" | "lon" | "type" | "description"> {
  if (typeof input.web === "string" && input.web.length > 0) {
    throw new ReportError("Envío rechazado.");
  }
  if (typeof input.type !== "string" || !Object.hasOwn(REPORT_TYPES, input.type)) {
    throw new ReportError("Elegí qué estás viendo.");
  }
  const lat = toCoordinate(input.lat, BOUNDS.south, BOUNDS.north, "La latitud");
  const lon = toCoordinate(input.lon, BOUNDS.west, BOUNDS.east, "La longitud");
  if (!featureAt(city, lat, lon)) throw new ReportError("El punto está fuera del área de Rosario cubierta por Cota.");
  return {
    lat,
    lon,
    type: input.type as ReportType,
    description: cleanDescription(input.description),
  };
}

export async function listReports(): Promise<Report[]> {
  return serialized(async () => {
    const reports = await readStore();
    const active = reports.filter((report) => isActive(report, Date.now()));
    if (active.length !== reports.length) await writeStore(active);
    return active.map(publicReport).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export function createReport(input: NewReportInput, ip: string): Promise<Report> {
  return serialized(async () => {
    const now = Date.now();
    const data = validateReport(input);
    enforceRate(ip, "reports", REPORTS_PER_IP_PER_HOUR, now);
    const active = (await readStore()).filter((report) => isActive(report, now));
    if (active.length >= MAX_ACTIVE_REPORTS) {
      throw new ReportError("Hay demasiados reportes activos ahora mismo.", 503);
    }
    const report: StoredReport = { id: randomUUID(), ...data, createdAt: new Date(now).toISOString(), confirmations: 0, confirmationsBy: [] };
    await writeStore([...active, report]);
    return publicReport(report);
  });
}

export function confirmReport(id: string, ip: string): Promise<Report> {
  return serialized(async () => {
    const now = Date.now();
    const active = (await readStore()).filter((report) => isActive(report, now));
    const target = active.find((report) => report.id === id);
    if (!target) {
      throw new ReportError("Ese reporte ya no está activo.", 404);
    }
    const observer = createHash("sha256").update(`${id}:${ip}`).digest("hex");
    if (target.confirmationsBy.includes(observer)) return publicReport(target);
    enforceRate(ip, "confirmations", CONFIRMATIONS_PER_IP_PER_HOUR, now);
    const updated = { ...target, confirmations: target.confirmations + 1, confirmationsBy: [...target.confirmationsBy, observer] };
    await writeStore(active.map((report) => (report.id === id ? updated : report)));
    return publicReport(updated);
  });
}
