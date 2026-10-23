"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LookupResult } from "@/components/LookupResult";
import { riskColor } from "@/components/status";
import { usePlaces } from "@/components/vecinos/usePlaces";
import type { Hallazgo, TerrainMeta } from "@/lib/lookup";
import { createPlaceReader, geocodificar, type PlaceReader } from "@/lib/placeReader";
import { ERROR_ALTA, MAX_LUGARES, NAME_MAX_CHARS, agregarLugar, quitarLugar, type Lugar } from "@/lib/places";
import { riskLabel, type RiskLevel } from "@/lib/risk";

interface PlacesBoardProps {
  zonas: { zona: string; nivel: RiskLevel | null }[];
}

const GEOLOCATION_TIMEOUT_MS = 10_000;
const NAME_FROM_ADDRESS_PARTS = 2;

function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function PlaceCard({ lugar, lector, terreno, nivelDeZona, onQuitar }: { lugar: Lugar; lector: PlaceReader; terreno: TerrainMeta | null; nivelDeZona: (zona: string) => RiskLevel | null; onQuitar: () => void }) {
  const [hallazgo, setHallazgo] = useState<Hallazgo | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    lector
      .leer(lugar.lat, lugar.lon)
      .then((lectura) => vigente && setHallazgo({ ...lectura, etiqueta: lugar.nombre, nivel: lectura.zona ? nivelDeZona(lectura.zona) : undefined }))
      .catch(() => vigente && setFallo(true));
    return () => {
      vigente = false;
    };
  }, [lector, lugar, nivelDeZona]);

  const nivel = hallazgo?.dentro ? (hallazgo.nivel ?? null) : null;
  return (
    <li className="hairline first:border-t-0">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h2 className="flex min-w-0 items-center gap-2.5 text-base text-ink">
          <span className="size-2 shrink-0 rounded-full" style={{ background: hallazgo?.dentro ? riskColor(nivel) : "var(--ink-faint)" }} aria-hidden="true" />
          <span className="truncate">{lugar.nombre}</span>
        </h2>
        <button type="button" onClick={onQuitar} className="shrink-0 text-xs text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink" aria-label={`Quitar ${lugar.nombre}`}>
          Quitar
        </button>
      </div>
      {hallazgo?.dentro ? <p className="px-4 pt-1 text-xs text-ink-soft">Zona oficial {hallazgo.zona} · hoy {riskLabel(nivel).toLowerCase()}</p> : null}
      {hallazgo ? <LookupResult hallazgo={hallazgo} terrain={terreno} /> : <p className="px-4 py-3 text-sm text-ink-soft">{fallo ? "No pudimos leer las capas de este lugar. Probá recargar." : "Leyendo las capas…"}</p>}
    </li>
  );
}

export function PlacesBoard({ zonas }: PlacesBoardProps) {
  const { lugares, disponible, listo, guardar } = usePlaces();
  const [lector] = useState<PlaceReader>(createPlaceReader);
  const [terreno, setTerreno] = useState<TerrainMeta | null>(null);
  const [direccion, setDireccion] = useState("");
  const [nombre, setNombre] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    lector.terreno().then(setTerreno).catch(() => setTerreno(null));
  }, [lector]);

  const nivelDeZona = useCallback((zona: string): RiskLevel | null => zonas.find((entrada) => entrada.zona === zona.trim())?.nivel ?? null, [zonas]);

  const alta = (lugar: Lugar) => {
    const resultado = agregarLugar(lugares, lugar);
    if (resultado.error) {
      setMensaje(ERROR_ALTA[resultado.error]);
      return;
    }
    setMensaje(guardar(resultado.lugares) ? null : "Este navegador no permite guardar lugares.");
    setDireccion("");
    setNombre("");
  };

  const agregarDireccion = async (event: FormEvent) => {
    event.preventDefault();
    const termino = direccion.trim();
    if (!termino) {
      return;
    }
    setOcupado(true);
    setMensaje(null);
    try {
      const encontrado = await geocodificar(termino);
      if (!encontrado) {
        setMensaje("No encontramos esa dirección dentro de Rosario.");
        return;
      }
      alta({ id: nuevoId(), nombre: nombre.trim() || encontrado.etiqueta.split(",").slice(0, NAME_FROM_ADDRESS_PARTS).join(","), lat: encontrado.lat, lon: encontrado.lon });
    } catch {
      setMensaje("El buscador de direcciones no respondió. Probá de nuevo en un momento.");
    } finally {
      setOcupado(false);
    }
  };

  const agregarUbicacion = () => {
    if (!("geolocation" in navigator)) {
      setMensaje("Este dispositivo no comparte su ubicación.");
      return;
    }
    setOcupado(true);
    setMensaje(null);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setOcupado(false);
        alta({ id: nuevoId(), nombre: nombre.trim() || "Mi ubicación", lat: posicion.coords.latitude, lon: posicion.coords.longitude });
      },
      () => {
        setOcupado(false);
        setMensaje("No pudimos obtener tu ubicación. Revisá el permiso del navegador.");
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    );
  };

  const lleno = lugares.length >= MAX_LUGARES;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
      <section className="px-5 py-6 sm:px-6">
        <p className="meta">Mis lugares · hasta {MAX_LUGARES}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Mi zona</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">Guardá tu casa, el trabajo o la escuela para ver de un vistazo qué dicen el mapa oficial, el relieve y el historial de cada lugar. Se guardan sólo en este dispositivo.</p>
      </section>

      {!disponible ? (
        <p className="hairline px-5 py-4 text-sm text-ink-soft sm:px-6">Este navegador no permite guardar datos (modo privado o almacenamiento bloqueado). Podés consultar direcciones desde el mapa.</p>
      ) : (
        <form onSubmit={agregarDireccion} className="hairline flex flex-col gap-3 px-5 py-5 sm:px-6">
          <label className="flex flex-col gap-1.5">
            <span className="meta">Dirección</span>
            <input value={direccion} onChange={(event) => setDireccion(event.target.value)} placeholder="Ej.: Córdoba 1500" disabled={lleno || ocupado} className="rounded-md border border-rule bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none disabled:opacity-50" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="meta">Nombre (opcional)</span>
            <input value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={NAME_MAX_CHARS} placeholder="Casa, trabajo, escuela…" disabled={lleno || ocupado} className="rounded-md border border-rule bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink-soft focus:outline-none disabled:opacity-50" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={lleno || ocupado || !direccion.trim()} className="rounded-md border border-ink-soft px-4 py-2 text-sm text-ink hover:border-ink disabled:opacity-40">
              {ocupado ? "Buscando…" : "Agregar dirección"}
            </button>
            <button type="button" onClick={agregarUbicacion} disabled={lleno || ocupado} className="rounded-md border border-rule px-4 py-2 text-sm text-ink-soft hover:text-ink disabled:opacity-40">
              Usar mi ubicación
            </button>
          </div>
          {mensaje ? <p role="alert" className="text-xs text-atencion">{mensaje}</p> : null}
          {lleno ? <p className="text-xs text-ink-faint">{ERROR_ALTA.lleno}</p> : null}
        </form>
      )}

      {listo ? (
        lugares.length ? (
          <ul className="hairline flex flex-col">
            {lugares.map((lugar) => (
              <PlaceCard key={lugar.id} lugar={lugar} lector={lector} terreno={terreno} nivelDeZona={nivelDeZona} onQuitar={() => guardar(quitarLugar(lugares, lugar.id))} />
            ))}
          </ul>
        ) : (
          <p className="hairline px-5 py-6 text-sm text-ink-faint sm:px-6">Todavía no guardaste lugares.</p>
        )
      ) : null}
    </div>
  );
}
