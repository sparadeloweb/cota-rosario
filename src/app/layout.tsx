import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cota · riesgo hídrico de Rosario",
  description:
    "Altura del Paraná contra los niveles oficiales del INA, lluvia pronosticada y áreas inundables de la Municipalidad de Rosario, cruzadas en un solo panel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable} h-dvh antialiased`}>
      <body className="flex h-dvh flex-col overflow-hidden font-sans">{children}</body>
    </html>
  );
}
