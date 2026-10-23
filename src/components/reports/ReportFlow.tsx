"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SectionHero } from "@/components/panel/SectionHero";
import { ReportGlyph } from "@/components/reports/ReportGlyph";
import { ReportSent } from "@/components/reports/ReportSent";
import { ReportStepper } from "@/components/reports/ReportStepper";
import { ReportTypePicker } from "@/components/reports/ReportTypePicker";
import { geocodificar } from "@/lib/placeReader";
import { EMPTY_DRAFT, FRASES_RAPIDAS, REPORT_STEPS, agregarFrase, cuerpoDelEnvio, pasoAnterior, puedeAvanzar, siguientePaso, type ReportDraftFlow, type ReportStep } from "@/lib/reportFlow";
import { DESCRIPTION_MAX_CHARS, REPORT_TTL_HOURS, REPORT_TYPES } from "@/lib/reportTypes";
import { EMERGENCY_PHONE, VECINOS_HOME } from "@/lib/navigation";

const API = "/api/reportes";
const GEOLOCATION_TIMEOUT_MS = 10_000;
const COORD_DECIMALS = 4;
const PERCENT = 100;

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
    return <ReportSent onOtro={reiniciar} />;
  }

  const tipoElegido = borrador.tipo ? REPORT_TYPES[borrador.tipo] : null;
  const tieneLugar = borrador.lat !== null && borrador.lon !== null;
  const lugarValido = puedeAvanzar("lugar", borrador);

  return (
    <div className="flex min-h-full flex-col">
      <SectionHero patron="reportar" meta={`Reportar · paso ${numero} de ${REPORT_STEPS.length}`} titulo={TITULOS[paso]}>
        {paso === "tipo" ? "Tu aviso aparece en el mapa para que otros vecinos y el panel de operaciones lo vean." : null}
      </SectionHero>
      <div className="px-5 sm:px-6">
        <ReportStepper paso={paso} />
      </div>

      <section className="flex-1 px-5 py-6 sm:px-6">
        {paso === "tipo" ? <ReportTypePicker elegido={borrador.tipo} onElegir={(tipo) => actualizar({ tipo })} /> : null}

        {paso === "lugar" ? (
          <div className="flex flex-col gap-4">
            <button type="button" onClick={usarUbicacion} disabled={buscando} className="flex items-center gap-4 rounded-xl border border-rule bg-panel/70 p-4 text-left transition-colors hover:border-ink-soft disabled:opacity-50">
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-water/50 bg-water/10 text-water">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M12 2v3 M12 19v3 M2 12h3 M19 12h3" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{buscando ? "Buscando tu ubicación…" : "Usar mi ubicación actual"}</span>
                <span className="mt-0.5 block text-xs text-ink-faint">Lo más preciso si estás en el lugar</span>
              </span>
            </button>
            <div className="flex items-center gap-3 text-[11px] text-ink-faint" aria-hidden="true">
              <span className="h-px flex-1 bg-rule-soft" />o escribí la dirección<span className="h-px flex-1 bg-rule-soft" />
            </div>
            <form onSubmit={buscarDireccion} className="flex gap-2">
              <label htmlFor="direccion-reporte" className="sr-only">Dirección</label>
              <input id="direccion-reporte" value={direccion} onChange={(event) => setDireccion(event.target.value)} placeholder="Ej.: Pellegrini y Oroño" className="min-w-0 flex-1 rounded-lg border border-rule bg-ground px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none" />
              <button type="submit" disabled={buscando || !direccion.trim()} className="rounded-lg border border-rule px-4 py-2.5 text-sm text-ink-soft hover:text-ink disabled:opacity-40">{buscando ? "…" : "Buscar"}</button>
            </form>
            {tieneLugar ? (
              <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${lugarValido ? "border-normal/50 bg-normal/10" : "border-atencion/50 bg-atencion/10"}`}>
                <span className={`mt-0.5 text-sm ${lugarValido ? "text-normal" : "text-atencion"}`} aria-hidden="true">{lugarValido ? "✓" : "!"}</span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{borrador.etiquetaLugar}</span>
                  <span className="readout block text-[11px] text-ink-faint">{borrador.lat!.toFixed(COORD_DECIMALS)}, {borrador.lon!.toFixed(COORD_DECIMALS)}</span>
                  {!lugarValido ? <span className="mt-1 block text-xs text-atencion">Ese punto queda fuera de Rosario.</span> : null}
                </span>
              </div>
            ) : null}
            {avisoLugar ? <p role="alert" className="text-xs text-atencion">{avisoLugar}</p> : null}
            <p className="text-xs leading-relaxed text-ink-faint">
              También podés marcar el punto exacto desde el <Link href={VECINOS_HOME} className="underline decoration-rule underline-offset-4 hover:text-ink">mapa</Link>.
            </p>
          </div>
        ) : null}

        {paso === "detalle" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Frases rápidas">
              {FRASES_RAPIDAS.map((frase) => {
                const usada = borrador.descripcion.toLowerCase().includes(frase);
                return (
                  <button key={frase} type="button" onClick={() => actualizar({ descripcion: agregarFrase(borrador.descripcion, frase) })} disabled={usada} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${usada ? "border-water/50 bg-water/10 text-ink-soft" : "border-rule text-ink-soft hover:border-ink-soft hover:text-ink"}`}>
                    {usada ? "✓ " : "+ "}
                    {frase}
                  </button>
                );
              })}
            </div>
            <label className="flex flex-col gap-2">
              <span className="sr-only">Descripción (opcional)</span>
              <textarea value={borrador.descripcion} onChange={(event) => actualizar({ descripcion: event.target.value })} maxLength={DESCRIPTION_MAX_CHARS} rows={4} placeholder="Contá con tus palabras (opcional)" className="rounded-xl border border-rule bg-ground px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none" />
              <span className="flex items-center gap-2 self-end">
                <span className="h-1 w-16 overflow-hidden rounded-full bg-rule-soft">
                  <span className="block h-full rounded-full bg-ink-soft" style={{ width: `${(borrador.descripcion.length / DESCRIPTION_MAX_CHARS) * PERCENT}%` }} />
                </span>
                <span className="readout text-[11px] text-ink-faint">{borrador.descripcion.length}/{DESCRIPTION_MAX_CHARS}</span>
              </span>
            </label>
          </div>
        ) : null}

        {paso === "revisar" ? (
          <div className="flex flex-col gap-4">
            <article className="overflow-hidden rounded-xl border border-rule bg-panel/70">
              {tipoElegido && borrador.tipo ? (
                <header className="flex items-center gap-3 border-b border-rule-soft px-4 py-3.5">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-rule bg-ground" style={{ color: tipoElegido.color }}>
                    <ReportGlyph tipo={borrador.tipo} />
                  </span>
                  <span className="text-base font-medium text-ink">{tipoElegido.etiqueta}</span>
                  <button type="button" onClick={() => setPaso("tipo")} className="ml-auto text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">Cambiar</button>
                </header>
              ) : null}
              <dl className="flex flex-col gap-3 px-4 py-3.5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><dt className="meta">Dónde</dt><dd className="mt-1 text-ink">{borrador.etiquetaLugar || "—"}</dd></div>
                  <button type="button" onClick={() => setPaso("lugar")} className="shrink-0 text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">Cambiar</button>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div><dt className="meta">Detalle</dt><dd className="mt-1 text-ink-soft">{borrador.descripcion.trim() || "Sin descripción"}</dd></div>
                  <button type="button" onClick={() => setPaso("detalle")} className="shrink-0 text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">Cambiar</button>
                </div>
              </dl>
            </article>
            <p className="text-xs leading-relaxed text-ink-faint">Se publica sin tu nombre durante {REPORT_TTL_HOURS} horas. Si hay riesgo para personas, llamá a Defensa Civil al <a href={`tel:${EMERGENCY_PHONE}`} className="text-ink underline decoration-rule underline-offset-4">{EMERGENCY_PHONE}</a>.</p>
            {envio.estado === "error" ? <p role="alert" className="rounded-lg border border-atencion/50 bg-atencion/10 px-3 py-2 text-xs text-atencion">{envio.mensaje}</p> : null}
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-rule-soft bg-ground/95 px-5 py-3 backdrop-blur sm:px-6">
        <button type="button" onClick={() => setPaso(pasoAnterior(paso))} disabled={paso === "tipo"} className="rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:text-ink disabled:invisible">
          Atrás
        </button>
        {paso === "revisar" ? (
          <button type="button" onClick={enviar} disabled={!puedeAvanzar("revisar", borrador) || envio.estado === "enviando"} className="ml-auto flex-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-ground hover:opacity-90 disabled:opacity-30 sm:flex-none">
            {envio.estado === "enviando" ? "Enviando…" : "Enviar reporte"}
          </button>
        ) : (
          <button type="button" onClick={() => setPaso(siguientePaso(paso))} disabled={!puedeAvanzar(paso, borrador)} className="ml-auto flex-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-ground hover:opacity-90 disabled:opacity-30 sm:flex-none">
            {paso === "detalle" && !borrador.descripcion.trim() ? "Seguir sin detalle" : "Siguiente"}
          </button>
        )}
      </div>
    </div>
  );
}
