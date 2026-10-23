"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Motion } from "@/components/motion/Motion";
import { SectionHero } from "@/components/panel/SectionHero";
import { EmptyPlaces } from "@/components/residents/EmptyPlaces";
import { PlaceCard } from "@/components/residents/PlaceCard";
import { PlaceForm } from "@/components/residents/PlaceForm";
import { usePlaces } from "@/components/residents/usePlaces";
import type { AddressSuggestion } from "@/lib/addressSuggestions";
import type { TerrainMeta } from "@/lib/lookup";
import { createPlaceReader, geocode, type PlaceReader } from "@/lib/placeReader";
import { ADD_ERROR, MAX_PLACES, addPlace, removePlace, type Place } from "@/lib/places";
import type { RiskLevel } from "@/lib/risk";

interface PlacesBoardProps {
  zones: { zone: string; level: RiskLevel | null }[];
}

const GEOLOCATION_TIMEOUT_MS = 10_000;
const NAME_FROM_ADDRESS_PARTS = 2;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PlacesBoard({ zones }: PlacesBoardProps) {
  const { places, available, ready, save } = usePlaces();
  const [reader] = useState<PlaceReader>(createPlaceReader);
  const [terrain, setTerrain] = useState<TerrainMeta | null>(null);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    reader.terrain().then(setTerrain).catch(() => setTerrain(null));
  }, [reader]);

  const zoneLevel = useCallback((zone: string): RiskLevel | null => zones.find((entry) => entry.zone === zone.trim())?.level ?? null, [zones]);

  const addToPlaces = (place: Place) => {
    const result = addPlace(places, place);
    if (result.error) {
      setMessage(ADD_ERROR[result.error]);
      return;
    }
    setMessage(save(result.places) ? null : "Este navegador no permite guardar lugares.");
    setAddress("");
    setName("");
  };

  const addSuggestion = (suggestion: AddressSuggestion) => {
    setMessage(null);
    addToPlaces({ id: newId(), name: name.trim() || suggestion.label, lat: suggestion.lat, lon: suggestion.lon });
  };

  const addAddress = async (event: FormEvent) => {
    event.preventDefault();
    const term = address.trim();
    if (!term) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const found = await geocode(term);
      if (!found) {
        setMessage("No encontramos esa dirección dentro de Rosario.");
        return;
      }
      addToPlaces({ id: newId(), name: name.trim() || found.label.split(",").slice(0, NAME_FROM_ADDRESS_PARTS).join(","), lat: found.lat, lon: found.lon });
    } catch {
      setMessage("El buscador de direcciones no respondió. Probá de nuevo en un momento.");
    } finally {
      setBusy(false);
    }
  };

  const addCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setMessage("Este dispositivo no comparte su ubicación.");
      return;
    }
    setBusy(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusy(false);
        addToPlaces({ id: newId(), name: name.trim() || "Mi ubicación", lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => {
        setBusy(false);
        setMessage("No pudimos obtener tu ubicación. Revisá el permiso del navegador.");
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    );
  };

  const full = places.length >= MAX_PLACES;

  return (
    <div className="w-full pb-8 lg:grid lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)] lg:gap-x-8 lg:px-5">
      <div className="flex flex-col lg:sticky lg:top-0 lg:self-start">
        <SectionHero inColumn pattern="zone" meta={`Mis lugares · ${ready ? places.length : 0} de ${MAX_PLACES}`} title="Mi zona">
          Guardá tu casa, el trabajo o la escuela y mirá qué dicen el mapa oficial, el relieve y el historial de cada lugar. Se guardan sólo en este dispositivo.
        </SectionHero>
        <div className="px-4 pt-5 sm:px-5 lg:px-0">
          {!available ? (
          <p className="rounded-xl border border-rule px-4 py-4 text-sm text-ink-soft">Este navegador no permite guardar datos (modo privado o almacenamiento bloqueado). Podés consultar direcciones desde el mapa.</p>
        ) : (
            <PlaceForm address={address} name={name} busy={busy} full={full} message={message} fullNotice={ADD_ERROR.full} onAddress={setAddress} onName={setName} onSearch={addAddress} onLocate={addCurrentLocation} onPick={addSuggestion} />
          )}
        </div>
      </div>

      <div className="px-4 pt-4 sm:px-5 lg:px-0 lg:pt-7">
        {ready ? (
          places.length ? (
            <Motion>
              <ul className="grid gap-3 xl:grid-cols-2 min-[2000px]:grid-cols-3">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} reader={reader} terrain={terrain} zoneLevel={zoneLevel} onRemove={() => save(removePlace(places, place.id))} />
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
