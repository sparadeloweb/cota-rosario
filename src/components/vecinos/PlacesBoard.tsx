"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Motion } from "@/components/motion/Motion";
import { SectionHero } from "@/components/panel/SectionHero";
import { EmptyPlaces } from "@/components/vecinos/EmptyPlaces";
import { PlaceCard } from "@/components/vecinos/PlaceCard";
import { PlaceForm } from "@/components/vecinos/PlaceForm";
import { usePlaces } from "@/components/vecinos/usePlaces";
import type { TerrainMeta } from "@/lib/lookup";
import { createPlaceReader, geocodificar, type PlaceReader } from "@/lib/placeReader";
import { ERROR_ALTA, MAX_LUGARES, agregarLugar, quitarLugar, type Lugar } from "@/lib/places";
import type { RiskLevel } from "@/lib/risk";

interface PlacesBoardProps {
  zonas: { zona: string; nivel: RiskLevel | null }[];
}

const GEOLOCATION_TIMEOUT_MS = 10_000;
const NAME_FROM_ADDRESS_PARTS = 2;

function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    <div className="mx-auto flex w-full max-w-xl flex-col pb-8">
      <SectionHero patron="zona" meta={`Mis lugares · ${listo ? lugares.length : 0} de ${MAX_LUGARES}`} titulo="Mi zona">
        Guardá tu casa, el trabajo o la escuela y mirá qué dicen el mapa oficial, el relieve y el historial de cada lugar. Se guardan sólo en este dispositivo.
      </SectionHero>

      <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6">
        {!disponible ? (
          <p className="rounded-xl border border-rule px-4 py-4 text-sm text-ink-soft">Este navegador no permite guardar datos (modo privado o almacenamiento bloqueado). Podés consultar direcciones desde el mapa.</p>
        ) : (
          <PlaceForm direccion={direccion} nombre={nombre} ocupado={ocupado} lleno={lleno} mensaje={mensaje} avisoLleno={ERROR_ALTA.lleno} onDireccion={setDireccion} onNombre={setNombre} onBuscar={agregarDireccion} onUbicacion={agregarUbicacion} />
        )}

        {listo ? (
          lugares.length ? (
            <Motion>
              <ul className="flex flex-col gap-3">
                {lugares.map((lugar) => (
                  <PlaceCard key={lugar.id} lugar={lugar} lector={lector} terreno={terreno} nivelDeZona={nivelDeZona} onQuitar={() => guardar(quitarLugar(lugares, lugar.id))} />
                ))}
              </ul>
            </Motion>
          ) : (
            <EmptyPlaces />
          )
        ) : null}
      </div>
    </div>
  );
}
