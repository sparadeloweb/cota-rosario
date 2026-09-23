import Link from "next/link";
import { RISK_FILL } from "@/components/status";
import { HELP_HREF, TopBar } from "@/components/TopBar";
import { conceptos, HERRAMIENTAS, PREGUNTAS, QUE_ES, SEMAFORO } from "@/content/comoFunciona";
import { loadEstado } from "@/lib/estado";
import { RISK_ORDER } from "@/lib/risk";
import { SOURCES } from "@/lib/sources";

export const revalidate = 300;

const CADENCIA: Record<string, string> = {
  ina: "una lectura por día en Rosario; en vivo",
  openMeteo: "corridas cada hora; en vivo",
  glofas: "diario; en vivo",
  areas: "capa fija de la Municipalidad",
  riesgoClima: "capa fija de la Municipalidad",
  defensaCivil: "registro mensual, hasta donde el municipio publicó",
  modelos: "se recalculan con cada pronóstico",
  terrain: "capa fija, calculada por este panel",
};

export default async function ComoFuncionaPage() {
  const estado = await loadEstado();
  const estacion = estado.rio?.estacion;
  const listaConceptos = conceptos({ alerta: estacion?.alerta ?? null, evacuacion: estacion?.evacuacion ?? null, aguasBajas: estacion?.aguasBajas ?? null });

  return (
    <div className="flex h-full flex-col">
      <TopBar activo={HELP_HREF} nivel={estado.riesgo.sinDatos ? undefined : estado.riesgo.nivel} />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-10 sm:px-8 sm:py-14">
          <header className="flex flex-col gap-4">
            <p className="meta">Guía para cualquiera</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">Cómo funciona Cota</h1>
            <p className="text-base leading-relaxed text-ink-soft">
              Qué mira, de dónde saca cada número, qué significan las palabras que usa y qué herramienta sirve para qué. Sin suponer que sabés de clima ni
              de ríos.
            </p>
          </header>

          {QUE_ES.map((bloque) => (
            <section key={bloque.titulo} className="flex flex-col gap-3">
              <h2 className="meta">{bloque.titulo}</h2>
              {bloque.parrafos.map((parrafo) => (
                <p key={parrafo} className="text-sm leading-relaxed text-ink-soft">
                  {parrafo}
                </p>
              ))}
            </section>
          ))}

          <section className="flex flex-col gap-5">
            <h2 className="meta">Las cuatro luces del semáforo</h2>
            <dl className="flex flex-col gap-3">
              {SEMAFORO.map((luz, index) => (
                <div key={luz.termino} className="flex gap-4 rounded-md border border-rule bg-panel/60 px-4 py-3">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: RISK_FILL[RISK_ORDER[index]] }} aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm text-ink">{luz.termino}</dt>
                    <dd className="text-sm leading-relaxed text-ink-soft">{luz.explicacion}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="meta">Las herramientas</h2>
            {HERRAMIENTAS.map((herramienta) => (
              <div key={herramienta.vista} className="flex flex-col gap-3 border-l border-rule pl-5">
                <h3 className="text-lg font-medium text-ink">
                  <Link href={herramienta.href} className="underline decoration-rule underline-offset-4 hover:decoration-ink">
                    {herramienta.vista}
                  </Link>
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft">{herramienta.para}</p>
                <ul className="flex flex-col gap-2">
                  {herramienta.ofrece.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                      <span className="mt-2.5 h-px w-3 shrink-0 bg-ink-faint" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="meta">Los conceptos, en criollo</h2>
            <dl className="flex flex-col divide-y divide-rule-soft">
              {listaConceptos.map((concepto) => (
                <div key={concepto.termino} className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                  <dt className="text-sm text-ink">{concepto.termino}</dt>
                  <dd className="text-sm leading-relaxed text-ink-soft">{concepto.explicacion}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="meta">De dónde sale cada dato</h2>
            <div className="flex flex-col divide-y divide-rule-soft">
              {Object.values(SOURCES).map((fuente) => (
                <div key={fuente.id} className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-ink">{fuente.organismo.split(" · ")[0]}</span>
                    {fuente.modelo ? <span className="meta text-atencion">modelo, no dato oficial</span> : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm leading-relaxed text-ink-soft">{fuente.descripcion}</p>
                    <p className="meta">{CADENCIA[fuente.id] ?? ""}</p>
                    <a href={fuente.portal} target="_blank" rel="noopener noreferrer" className="readout break-all text-[11px] text-ink-faint underline decoration-rule underline-offset-4 hover:text-ink">
                      {fuente.portal}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="meta">Preguntas frecuentes</h2>
            <dl className="flex flex-col gap-5">
              {PREGUNTAS.map((item) => (
                <div key={item.pregunta} className="flex flex-col gap-1.5">
                  <dt className="text-sm text-ink">{item.pregunta}</dt>
                  <dd className="text-sm leading-relaxed text-ink-soft">{item.respuesta}</dd>
                </div>
              ))}
            </dl>
          </section>

          <footer className="hairline flex flex-col gap-3 pt-8 text-xs leading-relaxed text-ink-faint">
            <p>Cota no es un servicio oficial de alerta. Ante una emergencia, Defensa Civil 103.</p>
            <p>
              Todo el detalle técnico (fórmulas, umbrales, endpoints, vigencia de cada dato) está al pie de cada vista, en el bloque «Documentación», y en
              los JSON públicos <span className="readout">/api/estado</span> y <span className="readout">/api/predicciones</span>.
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
