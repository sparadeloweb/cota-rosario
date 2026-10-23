"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { geocodificar } from "@/lib/placeReader";
import { EMPTY_DRAFT, REPORT_STEPS, cuerpoDelEnvio, pasoAnterior, puedeAvanzar, siguientePaso, type ReportDraftFlow, type ReportStep } from "@/lib/reportFlow";
import { DESCRIPTION_MAX_CHARS, REPORT_TTL_HOURS, REPORT_TYPES, type ReportType } from "@/lib/reportTypes";
import { EMERGENCY_PHONE, VECINOS_HOME } from "@/lib/navigation";

const API = "/api/reportes";
const GEOLOCATION_TIMEOUT_MS = 10_000;
const COORD_DECIMALS = 4;

const TITULOS: Record<ReportStep, string> = {
  tipo: "¿Qué estás viendo?",
  lugar: "¿Dónde?",
  detalle: "¿Algo más?",
  revisar: "Revisá y enviá",
};

type Envio = { estado: "editando" } | { estado: "enviando" } | { estado: "enviado" } | { estado: "error"; mensaje: string };

export function ReportFlow() {
  const [paso, setPaso] = useState<ReportStep>("tipo");
  const [borrador, setBorrador] = useState<ReportDraftFlow>(EMPTY_DRAFT);
  const [direccion, setDireccion] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [avisoLugar, setAvisoLugar] = useState<string | null>(null);
  const [envio, setEnvio] = useState<Envio>({ estado: "editando" });

  const actualizar = (cambios: Partial<ReportDraftFlow>) => setBorrador((actual) => ({ ...actual, ...cambios }));
  const numero = REPORT_STEPS.indexOf(paso) + 1;

  const usarUbicacion = () => {
    if (!("geolocation" in navigator)) {
      setAvisoLugar("Este dispositivo no comparte su ubicación. Escribí la dirección.");
      return;
    }
    setBuscando(true);
    setAvisoLugar(null);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setBuscando(false);
        actualizar({ lat: posicion.coords.latitude, lon: posicion.coords.longitude, etiquetaLugar: "Mi ubicación actual" });
      },
      () => {
        setBuscando(false);
        setAvisoLugar("No pudimos obtener tu ubicación. Revisá el permiso o escribí la dirección.");
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    );
  };

  const buscarDireccion = async (event: FormEvent) => {
    event.preventDefault();
    if (!direccion.trim()) {
      return;
    }
    setBuscando(true);
    setAvisoLugar(null);
    try {
      const encontrado = await geocodificar(direccion.trim());
      if (encontrado) {
        actualizar({ lat: encontrado.lat, lon: encontrado.lon, etiquetaLugar: encontrado.etiqueta });
      } else {
        setAvisoLugar("No encontramos esa dirección dentro de Rosario.");
      }
    } catch {
      setAvisoLugar("El buscador de direcciones no respondió. Probá de nuevo en un momento.");
    } finally {
      setBuscando(false);
    }
  };

  const enviar = async () => {
    const cuerpo = cuerpoDelEnvio(borrador);
    if (!cuerpo) {
      return;
    }
    setEnvio({ estado: "enviando" });
    try {
      const response = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setEnvio(response.ok && data.ok ? { estado: "enviado" } : { estado: "error", mensaje: data.error ?? "No se pudo enviar el reporte." });
    } catch {
      setEnvio({ estado: "error", mensaje: navigator.onLine ? "No se pudo enviar el reporte. Probá de nuevo." : "Sin conexión: el reporte no se envió. Probá cuando vuelva la señal." });
    }
  };

  const reiniciar = () => {
    setBorrador(EMPTY_DRAFT);
    setDireccion("");
    setPaso("tipo");
    setEnvio({ estado: "editando" });
  };

  if (envio.estado === "enviado") {
    return (
      <section className="px-5 py-8 sm:px-6">
        <p className="meta">Reporte enviado</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Gracias por avisar</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">Tu reporte aparece en el mapa durante {REPORT_TTL_HOURS} horas y otros vecinos pueden confirmarlo. No reemplaza un aviso a Defensa Civil.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={VECINOS_HOME} className="rounded-md border border-ink-soft px-4 py-2 text-sm text-ink hover:border-ink">Ver en el mapa</Link>
          <button type="button" onClick={reiniciar} className="rounded-md border border-rule px-4 py-2 text-sm text-ink-soft hover:text-ink">Reportar otra cosa</button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col">
      <section className="px-5 pt-6 sm:px-6">
        <p className="meta">Reportar · paso {numero} de {REPORT_STEPS.length}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{TITULOS[paso]}</h1>
        <ol className="mt-4 flex gap-1.5" aria-hidden="true">
          {REPORT_STEPS.map((etapa, indice) => (
            <li key={etapa} className={`h-1 flex-1 rounded-full ${indice < numero ? "bg-ink-soft" : "bg-rule"}`} />
          ))}
        </ol>
      </section>

      <section className="px-5 py-6 sm:px-6">
        {paso === "tipo" ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Tipo de reporte</legend>
            {(Object.entries(REPORT_TYPES) as [ReportType, (typeof REPORT_TYPES)[ReportType]][]).map(([clave, tipo]) => (
              <label key={clave} className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors ${borrador.tipo === clave ? "border-ink-soft bg-panel-soft text-ink" : "border-rule text-ink-soft hover:text-ink"}`}>
                <input type="radio" name="tipo" value={clave} checked={borrador.tipo === clave} onChange={() => actualizar({ tipo: clave })} className="sr-only" />
                <span className="size-2.5 rounded-full" style={{ background: tipo.color }} aria-hidden="true" />
                {tipo.etiqueta}
              </label>
            ))}
          </fieldset>
        ) : null}

        {paso === "lugar" ? (
          <div className="flex flex-col gap-4">
            <button type="button" onClick={usarUbicacion} disabled={buscando} className="rounded-md border border-ink-soft px-4 py-3 text-left text-sm text-ink hover:border-ink disabled:opacity-50">
              Usar mi ubicación actual
            </button>
            <form onSubmit={buscarDireccion} className="flex flex-col gap-2">
              <label className="meta" htmlFor="direccion-reporte">O escribí la dirección</label>
              <div className="flex gap-2">
                <input id="direccion-reporte" value={direccion} onChange={(event) => setDireccion(event.target.value)} placeholder="Ej.: Pellegrini y Oroño" className="min-w-0 flex-1 rounded-md border border-rule bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none" />
                <button type="submit" disabled={buscando || !direccion.trim()} className="rounded-md border border-rule px-3 py-2 text-sm text-ink-soft hover:text-ink disabled:opacity-40">{buscando ? "…" : "Buscar"}</button>
              </div>
            </form>
            {borrador.lat !== null && borrador.lon !== null ? (
              <p className="text-sm text-ink">
                {borrador.etiquetaLugar} <span className="readout text-xs text-ink-faint">({borrador.lat.toFixed(COORD_DECIMALS)}, {borrador.lon.toFixed(COORD_DECIMALS)})</span>
              </p>
            ) : null}
            {borrador.lat !== null && !puedeAvanzar("lugar", borrador) ? <p className="text-xs text-atencion">Ese punto queda fuera de Rosario.</p> : null}
            {avisoLugar ? <p role="alert" className="text-xs text-atencion">{avisoLugar}</p> : null}
            <p className="text-xs leading-relaxed text-ink-faint">
              También podés marcar el punto exacto desde el <Link href={VECINOS_HOME} className="underline decoration-rule underline-offset-4 hover:text-ink">mapa</Link>.
            </p>
          </div>
        ) : null}

        {paso === "detalle" ? (
          <label className="flex flex-col gap-2">
            <span className="meta">Descripción (opcional)</span>
            <textarea value={borrador.descripcion} onChange={(event) => actualizar({ descripcion: event.target.value })} maxLength={DESCRIPTION_MAX_CHARS} rows={4} placeholder="Ej.: el agua llega al cordón, no pasan autos" className="rounded-md border border-rule bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none" />
            <span className="readout self-end text-xs text-ink-faint">{borrador.descripcion.length}/{DESCRIPTION_MAX_CHARS}</span>
          </label>
        ) : null}

        {paso === "revisar" ? (
          <dl className="flex flex-col gap-3 text-sm">
            <div><dt className="meta">Qué</dt><dd className="mt-1 text-ink">{borrador.tipo ? REPORT_TYPES[borrador.tipo].etiqueta : "—"}</dd></div>
            <div><dt className="meta">Dónde</dt><dd className="mt-1 text-ink">{borrador.etiquetaLugar || "—"}</dd></div>
            <div><dt className="meta">Detalle</dt><dd className="mt-1 text-ink-soft">{borrador.descripcion.trim() || "Sin descripción"}</dd></div>
            <p className="text-xs leading-relaxed text-ink-faint">Se publica sin tu nombre durante {REPORT_TTL_HOURS} horas. Si hay riesgo para personas, llamá a Defensa Civil al {EMERGENCY_PHONE}.</p>
            {envio.estado === "error" ? <p role="alert" className="text-xs text-atencion">{envio.mensaje}</p> : null}
          </dl>
        ) : null}
      </section>

      <div className="hairline flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <button type="button" onClick={() => setPaso(pasoAnterior(paso))} disabled={paso === "tipo"} className="rounded-md px-3 py-2 text-sm text-ink-soft hover:text-ink disabled:invisible">
          Atrás
        </button>
        {paso === "revisar" ? (
          <button type="button" onClick={enviar} disabled={!puedeAvanzar("revisar", borrador) || envio.estado === "enviando"} className="rounded-md border border-ink-soft px-5 py-2 text-sm text-ink hover:border-ink disabled:opacity-40">
            {envio.estado === "enviando" ? "Enviando…" : "Enviar reporte"}
          </button>
        ) : (
          <button type="button" onClick={() => setPaso(siguientePaso(paso))} disabled={!puedeAvanzar(paso, borrador)} className="rounded-md border border-ink-soft px-5 py-2 text-sm text-ink hover:border-ink disabled:opacity-40">
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
