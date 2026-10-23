import type { Metadata } from "next";
import Link from "next/link";
import { InstallButton } from "@/components/InstallButton";
import { VecinosShell } from "@/components/shell/VecinosShell";
import { EMERGENCY_PHONE, HELP_HREF, PANEL_HOME } from "@/lib/navigation";

export const metadata: Metadata = { title: "Más · Cota" };

const ENLACES = [
  { href: HELP_HREF, titulo: "Cómo funciona Cota", detalle: "Qué muestra cada vista, de dónde salen los datos y qué no puede saber." },
  { href: `${HELP_HREF}#fuentes`, titulo: "Fuentes y metodología", detalle: "INA, Open-Meteo, GloFAS, Municipalidad de Rosario y Defensa Civil." },
  { href: PANEL_HOME, titulo: "Panel de operaciones", detalle: "Indicadores, sugerencias, pronóstico a 7 días y simulador." },
] as const;

const DATOS = ["/api/estado", "/api/kpis", "/api/predicciones", "/api/recomendaciones", "/api/reportes"] as const;

export default function MasPage() {
  return (
    <VecinosShell>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-xl flex-col">
          <section className="px-5 py-6 sm:px-6">
            <p className="meta">Cota · Rosario</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Más</h1>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Instalar en el celular</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">Se abre como una app y, sin conexión, muestra la última lectura con su hora.</p>
            <div className="mt-4">
              <InstallButton />
            </div>
          </section>

          <nav aria-label="Más secciones" className="hairline flex flex-col">
            {ENLACES.map((enlace) => (
              <Link key={enlace.href} href={enlace.href} className="hairline flex flex-col gap-1 px-5 py-4 transition-colors first:border-t-0 hover:bg-panel-soft sm:px-6">
                <span className="text-sm text-ink">{enlace.titulo}</span>
                <span className="text-xs leading-relaxed text-ink-soft">{enlace.detalle}</span>
              </Link>
            ))}
          </nav>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Emergencias</h2>
            <a href={`tel:${EMERGENCY_PHONE}`} className="mt-3 inline-flex items-center gap-2 rounded-md border border-rule px-4 py-2 text-sm text-ink hover:border-ink-soft">
              Defensa Civil · {EMERGENCY_PHONE}
            </a>
          </section>

          <section className="hairline px-5 py-6 sm:px-6">
            <h2 className="meta">Datos abiertos</h2>
            <ul className="mt-3 flex flex-col gap-1.5">
              {DATOS.map((ruta) => (
                <li key={ruta}>
                  <a href={ruta} className="readout text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink">
                    GET {ruta}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </VecinosShell>
  );
}
