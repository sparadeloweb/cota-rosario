import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { DESCRIPTION_MAX_CHARS, REPORT_TTL_HOURS, REPORT_TYPES, type Report, type ReportType } from "@/lib/reportTypes";

export { REPORT_TTL_HOURS, REPORT_TYPES, type Report, type ReportType };

export interface NewReportInput {
  lat: unknown;
  lon: unknown;
  tipo: unknown;
  descripcion?: unknown;
  web?: unknown;
}

const BOUNDS = { south: -33.1, north: -32.8, west: -60.85, east: -60.55 };
const MAX_ACTIVE_REPORTS = 500;
const REPORTS_PER_IP_PER_HOUR = 5;
const CONFIRMATIONS_PER_IP_PER_HOUR = 20;
const MILLIS_PER_HOUR = 3_600_000;
const DATA_DIR = process.env.COTA_DATA_DIR ?? "data";
const STORE_FILE = path.join(DATA_DIR, "reportes.json");

const ipActivity = new Map<string, { reportes: number[]; confirmaciones: number[] }>();
let queue: Promise<unknown> = Promise.resolve();

export class ReportError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isActive(report: Report, now: number): boolean {
  return now - new Date(report.creadoEn).getTime() < REPORT_TTL_HOURS * MILLIS_PER_HOUR;
}

async function readStore(): Promise<Report[]> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Report[]) : [];
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    console.error("No se pudo leer el archivo de reportes:", error);
    return [];
  }
}

async function writeStore(reports: Report[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(reports));
}

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

function recent(times: number[], now: number): number[] {
  return times.filter((time) => now - time < MILLIS_PER_HOUR);
}

function enforceRate(ip: string, kind: "reportes" | "confirmaciones", limit: number, now: number): void {
  const activity = ipActivity.get(ip) ?? { reportes: [], confirmaciones: [] };
  const window = recent(activity[kind], now);
  if (window.length >= limit) {
    throw new ReportError("Demasiados envíos desde esta conexión; probá de nuevo en un rato.", 429);
  }
  ipActivity.set(ip, { ...activity, [kind]: [...window, now] });
}

function toCoordinate(value: unknown, min: number, max: number, nombre: string): number {
  const numero = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numero) || numero < min || numero > max) {
    throw new ReportError(`${nombre} fuera de Rosario.`);
  }
  return Number(numero.toFixed(5));
}

function cleanDescription(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new ReportError("La descripción tiene que ser texto.");
  }
  const texto = value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (texto.length > DESCRIPTION_MAX_CHARS) {
    throw new ReportError(`La descripción no puede superar ${DESCRIPTION_MAX_CHARS} caracteres.`);
  }
  return texto;
}

export function validateReport(input: NewReportInput): Pick<Report, "lat" | "lon" | "tipo" | "descripcion"> {
  if (typeof input.web === "string" && input.web.length > 0) {
    throw new ReportError("Envío rechazado.");
  }
  if (typeof input.tipo !== "string" || !(input.tipo in REPORT_TYPES)) {
    throw new ReportError("Elegí qué estás viendo.");
  }
  return {
    lat: toCoordinate(input.lat, BOUNDS.south, BOUNDS.north, "La latitud"),
    lon: toCoordinate(input.lon, BOUNDS.west, BOUNDS.east, "La longitud"),
    tipo: input.tipo as ReportType,
    descripcion: cleanDescription(input.descripcion),
  };
}

export async function listReports(): Promise<Report[]> {
  const now = Date.now();
  const reports = await readStore();
  return reports.filter((report) => isActive(report, now)).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export function createReport(input: NewReportInput, ip: string): Promise<Report> {
  return serialized(async () => {
    const now = Date.now();
    const datos = validateReport(input);
    enforceRate(ip, "reportes", REPORTS_PER_IP_PER_HOUR, now);
    const activos = (await readStore()).filter((report) => isActive(report, now));
    if (activos.length >= MAX_ACTIVE_REPORTS) {
      throw new ReportError("Hay demasiados reportes activos ahora mismo.", 503);
    }
    const report: Report = { id: randomUUID(), ...datos, creadoEn: new Date(now).toISOString(), confirmaciones: 0 };
    await writeStore([...activos, report]);
    return report;
  });
}

export function confirmReport(id: string, ip: string): Promise<Report> {
  return serialized(async () => {
    const now = Date.now();
    enforceRate(ip, "confirmaciones", CONFIRMATIONS_PER_IP_PER_HOUR, now);
    const activos = (await readStore()).filter((report) => isActive(report, now));
    const target = activos.find((report) => report.id === id);
    if (!target) {
      throw new ReportError("Ese reporte ya no está activo.", 404);
    }
    const updated = { ...target, confirmaciones: target.confirmaciones + 1 };
    await writeStore(activos.map((report) => (report.id === id ? updated : report)));
    return updated;
  });
}
