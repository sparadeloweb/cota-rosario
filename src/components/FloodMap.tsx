"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { RISK_FILL } from "@/components/status";
import { RISK_LABEL, type RiskLevel } from "@/lib/risk";

const CENTER: [number, number] = [-32.955, -60.66];
const ZOOM = 12;
const FOUND_ZOOM = 15;
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const ROSARIO_VIEWBOX = "-60.79,-32.83,-60.58,-33.06";
const TERRAIN_OPACITY = 0.8;
const TERRAIN_COLOR = "#d6a04a";
const LOW_POINT_MIN_M = 1;
const MASK_THRESHOLD = 127;

interface FloodMapProps {
  zonas: { zona: string; nivel: RiskLevel }[];
  buscador?: boolean;
}

interface TerrainMeta {
  bounds: { west: number; east: number; north: number; south: number };
  ancho: number;
  alto: number;
  escalaMaximaMetros: number;
  ventanaMetros: number;
  mascaraEdificado: string;
}

type LecturaTerreno = { estado: "bajo" | "plano" | "edificado"; metros: number } | null;

interface Hallazgo {
  etiqueta: string;
  zona?: string;
  nivel?: RiskLevel;
  dentro: boolean;
  terreno: LecturaTerreno;
}

function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
      const [lonA, latA] = ring[index];
      const [lonB, latB] = ring[previous];
      const crosses = latA > lat !== latB > lat && lon < ((lonB - lonA) * (lat - latA)) / (latB - latA) + lonA;
      if (crosses) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function mercator(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

function loadPixels(src: string, meta: TerrainMeta): Promise<Uint8ClampedArray> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = meta.ancho;
      canvas.height = meta.alto;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("sin canvas"));
        return;
      }
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, meta.ancho, meta.alto).data);
    };
    image.onerror = () => reject(new Error(`no se pudo leer ${src}`));
    image.src = src;
  });
}

export function FloodMap({ zonas, buscador = false }: FloodMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const terrainLayerRef = useRef<import("leaflet").ImageOverlay | null>(null);
  const terrainPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const maskPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const [collection, setCollection] = useState<FeatureCollection<Polygon> | null>(null);
  const [terrain, setTerrain] = useState<TerrainMeta | null>(null);
  const [mostrarTerreno, setMostrarTerreno] = useState(true);
  const [consulta, setConsulta] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [hallazgo, setHallazgo] = useState<Hallazgo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nivelDeZona = useCallback(
    (zona: string): RiskLevel => zonas.find((entry) => entry.zona === zona.trim())?.nivel ?? "normal",
    [zonas],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/data/areas-inundables.json")
      .then((response) => response.json())
      .then((data: FeatureCollection<Polygon>) => {
        if (!cancelled) {
          setCollection(data);
        }
      })
      .catch(() => setError("No se pudieron cargar las áreas inundables."));
    fetch("/data/terreno.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: TerrainMeta | null) => {
        if (!cancelled && data) {
          setTerrain(data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!container.current || !collection) {
      return undefined;
    }
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !container.current) {
        return;
      }
      const map = L.map(container.current, { center: CENTER, zoom: ZOOM, zoomControl: false, attributionControl: true });
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(map);
      if (terrain) {
        const { bounds } = terrain;
        terrainLayerRef.current = L.imageOverlay(
          "/data/terreno.png",
          [
            [bounds.south, bounds.west],
            [bounds.north, bounds.east],
          ],
          { opacity: TERRAIN_OPACITY, interactive: false },
        );
        if (mostrarTerreno) {
          terrainLayerRef.current.addTo(map);
        }
      }
      L.geoJSON(collection, {
        style: (feature) => {
          const zona = (feature as Feature<Polygon, { zona: string }>).properties?.zona ?? "";
          const fill = RISK_FILL[nivelDeZona(zona)];
          return { color: fill, weight: 1, fillColor: fill, fillOpacity: 0.18 };
        },
        onEachFeature: (feature, layer) => {
          const properties = (feature as Feature<Polygon, { zona: string; sector: string }>).properties;
          layer.bindPopup(
            `Zona ${properties?.zona ?? "?"} · sector ${properties?.sector || "—"}<br/>${RISK_LABEL[nivelDeZona(properties?.zona ?? "")]}`,
          );
        },
      }).addTo(map);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      terrainLayerRef.current = null;
    };
  }, [collection, terrain, nivelDeZona, mostrarTerreno]);

  const lecturaTerrenoEn = async (lat: number, lon: number): Promise<LecturaTerreno> => {
    if (!terrain) {
      return null;
    }
    if (!terrainPixelsRef.current || !maskPixelsRef.current) {
      [terrainPixelsRef.current, maskPixelsRef.current] = await Promise.all([
        loadPixels("/data/terreno.png", terrain),
        loadPixels(`/data/${terrain.mascaraEdificado}`, terrain),
      ]);
    }
    const { bounds, ancho, alto, escalaMaximaMetros } = terrain;
    const col = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * ancho);
    const row = Math.floor(((mercator(bounds.north) - mercator(lat)) / (mercator(bounds.north) - mercator(bounds.south))) * alto);
    if (col < 0 || row < 0 || col >= ancho || row >= alto) {
      return null;
    }
    const offset = (row * ancho + col) * 4;
    if (maskPixelsRef.current[offset] > MASK_THRESHOLD) {
      return { estado: "edificado", metros: 0 };
    }
    const alpha = terrainPixelsRef.current[offset + 3];
    const metros = (alpha / 255) * escalaMaximaMetros;
    return { estado: metros >= LOW_POINT_MIN_M ? "bajo" : "plano", metros };
  };

  const buscar = async (event: React.FormEvent) => {
    event.preventDefault();
    const termino = consulta.trim();
    if (!termino || !collection) {
      return;
    }
    setBuscando(true);
    setError(null);
    setHallazgo(null);
    try {
      const params = new URLSearchParams({
        q: `${termino}, Rosario, Santa Fe, Argentina`,
        format: "json",
        limit: "1",
        viewbox: ROSARIO_VIEWBOX,
        bounded: "1",
      });
      const response = await fetch(`${NOMINATIM}?${params}`, { headers: { accept: "application/json" } });
      const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
      if (results.length === 0) {
        setError("No encontramos esa dirección dentro de Rosario.");
        return;
      }
      const lat = Number(results[0].lat);
      const lon = Number(results[0].lon);
      const match = collection.features.find((feature) => pointInPolygon(lat, lon, feature.geometry.coordinates));
      const zona = (match?.properties as { zona?: string } | undefined)?.zona?.trim();
      const terreno = await lecturaTerrenoEn(lat, lon).catch(() => null);

      const map = mapRef.current;
      if (map) {
        const L = await import("leaflet");
        markerRef.current?.remove();
        markerRef.current = L.circleMarker([lat, lon], {
          radius: 7,
          color: "#ececee",
          weight: 2,
          fillColor: RISK_FILL[zona ? nivelDeZona(zona) : "normal"],
          fillOpacity: 1,
        }).addTo(map);
        map.setView([lat, lon], FOUND_ZOOM);
      }

      setHallazgo({
        etiqueta: results[0].display_name.split(",").slice(0, 3).join(", "),
        zona,
        nivel: zona ? nivelDeZona(zona) : undefined,
        dentro: Boolean(match),
        terreno,
      });
    } catch {
      setError("El buscador de direcciones no respondió. Probá de nuevo en un momento.");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="relative isolate h-full w-full">
      <div ref={container} className="absolute inset-0" />

      {buscador ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-4">
          <div className="pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-md border border-rule bg-panel shadow-xl">
            <form onSubmit={buscar} className="flex items-center">
              <input
                id="direccion"
                value={consulta}
                onChange={(event) => setConsulta(event.target.value)}
                placeholder="Buscá tu dirección"
                aria-label="Dirección a consultar"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
              />
              <button
                type="submit"
                disabled={buscando}
                className="shrink-0 px-4 py-3 text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
              >
                {buscando ? "Buscando" : "Consultar"}
              </button>
            </form>

            {hallazgo ? (
              <div className="flex flex-col gap-2 border-t border-rule px-4 py-3 text-sm">
                <p className="text-xs text-ink-faint">{hallazgo.etiqueta}</p>
                {hallazgo.dentro ? (
                  <p className="text-ink">
                    Dentro del área inundable oficial zona {hallazgo.zona}. Hoy:{" "}
                    <span className={hallazgo.nivel === "normal" ? "text-normal" : "text-alerta"}>
                      {RISK_LABEL[hallazgo.nivel ?? "normal"].toLowerCase()}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="leading-relaxed text-ink">Fuera de los polígonos oficiales, que cubren el Ludueña y el Saladillo.</p>
                )}
                {hallazgo.terreno ? (
                  <p className="leading-relaxed text-ink-soft">
                    {hallazgo.terreno.estado === "bajo" ? (
                      <>
                        Según el modelo de terreno está{" "}
                        <span className="readout text-ink">{hallazgo.terreno.metros.toFixed(1)} m</span> por debajo de la mediana de su entorno de{" "}
                        {terrain?.ventanaMetros} m: ahí el agua tiende a juntarse.
                      </>
                    ) : hallazgo.terreno.estado === "plano" ? (
                      <>Según el modelo de terreno no es un punto bajo respecto de la mediana de su entorno de {terrain?.ventanaMetros} m.</>
                    ) : (
                      <>
                        Zona densamente edificada: el modelo de superficie mide techos y no distingue la calle de los edificios, así que acá
                        no da una lectura confiable.
                      </>
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? <p className="border-t border-rule px-4 py-3 text-sm text-alerta">{error}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-0 left-0 z-[500] p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-rule bg-panel/95 px-3 py-2 backdrop-blur">
          {(["normal", "atencion", "alerta", "critico"] as RiskLevel[]).map((nivel) => (
            <span key={nivel} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
              <span className="h-0.5 w-3" style={{ background: RISK_FILL[nivel] }} aria-hidden="true" />
              {RISK_LABEL[nivel]}
            </span>
          ))}
          <span className="meta">{collection?.features.length ?? 0} polígonos oficiales</span>
          {terrain ? (
            <button
              type="button"
              onClick={() => setMostrarTerreno((current) => !current)}
              aria-pressed={mostrarTerreno}
              className={`flex items-center gap-1.5 border-l border-rule pl-4 text-[11px] transition-colors ${mostrarTerreno ? "text-ink" : "text-ink-faint hover:text-ink-soft"}`}
            >
              <span className="size-2.5 rounded-sm" style={{ background: TERRAIN_COLOR, opacity: mostrarTerreno ? 1 : 0.35 }} aria-hidden="true" />
              Puntos bajos · modelo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
