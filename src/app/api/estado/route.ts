import { NextResponse } from "next/server";
import { loadEstado } from "@/lib/estado";
import { SOURCES } from "@/lib/sources";

export const dynamic = "force-dynamic";

const PARTIAL_STATUS = 206;
const UNAVAILABLE_STATUS = 503;

export async function GET() {
  const estado = await loadEstado();
  const status = estado.riesgo.sinDatos ? UNAVAILABLE_STATUS : estado.riesgo.incompleto ? PARTIAL_STATUS : 200;
  return NextResponse.json({ ...estado, fuentes: SOURCES }, { status });
}
