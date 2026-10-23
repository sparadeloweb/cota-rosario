import type { MetadataRoute } from "next";
import { GROUND_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Cota · riesgo hídrico de Rosario",
    short_name: "Cota",
    description: "Altura del Paraná, lluvia pronosticada, zonas inundables y reportes de vecinos de Rosario en un solo lugar.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: GROUND_COLOR,
    theme_color: GROUND_COLOR,
    categories: ["weather", "utilities", "news"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Panel de operaciones", url: "/operaciones", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Pronóstico a 7 días", url: "/operaciones/pronostico", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
