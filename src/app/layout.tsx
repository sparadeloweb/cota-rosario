import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";
import { MOTION_READY_FLAG } from "@/components/motion/flag";
import { GROUND_COLOR } from "@/lib/theme";

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
  applicationName: "Cota",
  appleWebApp: { capable: true, title: "Cota", statusBarStyle: "black-translucent" },
  icons: { apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: GROUND_COLOR,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const MOTION_GATE_MS = 2500;
const MOTION_GATE_SCRIPT = `(function(){try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement;d.dataset.motion="on";var g=function(){setTimeout(function(){if(!window.${MOTION_READY_FLAG})d.dataset.motion="off"},${MOTION_GATE_MS})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",g);else g()}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable} h-dvh antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_GATE_SCRIPT }} />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden font-sans">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
