import Link from "next/link";
import { Deck, type DeckSlide } from "@/components/deck/Deck";
import { RISK_FILL } from "@/components/status";
import { HELP_HREF, TopBar } from "@/components/TopBar";
import { conceptos, HERRAMIENTAS, PREGUNTAS, QUE_ES, SEMAFORO, type Concepto } from "@/content/comoFunciona";
import { loadEstado } from "@/lib/estado";
import { RISK_ORDER } from "@/lib/risk";
import { SOURCES } from "@/lib/sources";

export const revalidate = 300;

const CONCEPTS_PER_SLIDE = 4;
const QUESTIONS_PER_SLIDE = 4;
const CIFRAS = [
  { valor: "87", etiqueta: "zonas oficiales de inundación" },
  { valor: "357", etiqueta: "estaciones del INA en la red" },
  { valor: "86", etiqueta: "años de lluvia para medir rarezas" },
  { valor: "5 min", etiqueta: "entre una actualización y la siguiente" },
];
const CADENCIA: Record<string, string> = {
  ina: "una lectura diaria · en vivo",
  openMeteo: "cada hora · en vivo",
  glofas: "diario · en vivo",
  areas: "capa fija municipal",
  riesgoClima: "capa fija municipal",
  defensaCivil: "registro mensual municipal",
  modelos: "con cada pronóstico",
  terrain: "capa fija, cálculo propio",
};

function Capitulo({ numero, titulo, bajada }: { numero: string; titulo: string; bajada?: string }) {
  return (
    <header className="mb-10 flex flex-col gap-3">
      <span className="readout text-xs text-ink-faint">{numero}</span>
      <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">{titulo}</h2>
      {bajada ? <p className="max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">{bajada}</p> : null}
    </header>
  );
}

function ConceptosSlide({ lista }: { lista: Concepto[] }) {
  return (
    <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      {lista.map((concepto) => (
        <div key={concepto.termino} className="flex flex-col gap-2 border-t border-rule pt-4">
          <dt className="text-lg font-medium text-ink">{concepto.termino}</dt>
          <dd className="text-sm leading-relaxed text-ink-soft">{concepto.explicacion}</dd>
        </div>
      ))}
    </dl>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

export default async function ComoFuncionaPage() {
  const estado = await loadEstado();
  const estacion = estado.rio?.estacion;
  const listaConceptos = conceptos({ alerta: estacion?.alerta ?? null, evacuacion: estacion?.evacuacion ?? null, aguasBajas: estacion?.aguasBajas ?? null });
  const gruposConceptos = chunk(listaConceptos, CONCEPTS_PER_SLIDE);
  const [queEs] = QUE_ES;

  const slides: DeckSlide[] = [
    {
      id: "portada",
      titulo: "Portada",
      contenido: (
        <div className="deck-glow -m-10 flex flex-col gap-8 p-10">
          <span className="readout text-xs text-ink-faint">Guía para cualquiera · sin saber de clima ni de ríos</span>
          <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-7xl lg:text-8xl">
            Cómo funciona
            <br />
            Cota
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            Qué mira, de dónde saca cada número, qué significan las palabras que usa y qué herramienta sirve para qué.
          </p>
          <div className="grid grid-cols-2 gap-6 border-t border-rule pt-6 sm:grid-cols-4">
            {CIFRAS.map((cifra) => (
              <div key={cifra.etiqueta} className="flex flex-col gap-1">
                <span className="readout text-3xl text-ink">{cifra.valor}</span>
                <span className="text-xs text-ink-faint">{cifra.etiqueta}</span>
              </div>
            ))}
          </div>
          <p className="meta">↓ flechas, espacio o deslizar</p>
        </div>
      ),
    },
    {
      id: "que-es",
      titulo: queEs.titulo,
      contenido: (
        <div className="flex flex-col gap-10">
          <Capitulo numero="01" titulo="Una sola pregunta" />
          <div className="grid gap-8 lg:grid-cols-3">
            {queEs.parrafos.map((parrafo, index) => (
              <p key={parrafo} className={`leading-relaxed ${index === 0 ? "text-xl text-ink lg:col-span-3 lg:text-2xl" : "border-t border-rule pt-5 text-sm text-ink-soft"}`}>
                {parrafo}
              </p>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "semaforo",
      titulo: "El semáforo",
      contenido: (
        <div className="flex flex-col">
          <Capitulo numero="02" titulo="Cuatro luces" bajada="El nivel general es el peor de los dos factores que mira Cota: el río y la lluvia concentrada." />
          <dl className="flex flex-col divide-y divide-rule">
            {SEMAFORO.map((luz, index) => (
              <div key={luz.termino} className="grid gap-2 py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <dt className="flex items-center gap-3 text-xl font-medium text-ink">
                  <span className="size-3 rounded-full" style={{ background: RISK_FILL[RISK_ORDER[index]] }} aria-hidden="true" />
                  {luz.termino}
                </dt>
                <dd className="text-base leading-relaxed text-ink-soft">{luz.explicacion}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
    {
      id: "herramientas",
      titulo: "Las herramientas",
      contenido: (
        <div className="flex flex-col">
          <Capitulo numero="03" titulo="Tres vistas, tres públicos" />
          <div className="grid gap-6 lg:grid-cols-3">
            {HERRAMIENTAS.map((herramienta, index) => (
              <Link
                key={herramienta.vista}
                href={herramienta.href}
                className="group flex flex-col gap-4 rounded-lg border border-rule bg-panel/60 p-6 transition-colors hover:border-ink-soft"
              >
                <span className="readout text-xs text-ink-faint">0{index + 1}</span>
                <span className="text-2xl font-semibold text-ink">{herramienta.vista}</span>
                <span className="text-sm leading-relaxed text-ink-soft">{herramienta.para}</span>
                <span className="meta mt-auto transition-colors group-hover:text-ink">abrir →</span>
              </Link>
            ))}
          </div>
        </div>
      ),
    },
    ...HERRAMIENTAS.map((herramienta, index) => ({
      id: `herramienta-${index}`,
      titulo: herramienta.vista,
      contenido: (
        <div className="flex flex-col">
          <Capitulo numero={`03.${index + 1}`} titulo={herramienta.vista} bajada={herramienta.para} />
          <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {herramienta.ofrece.map((item) => (
              <li key={item} className="flex gap-4 border-t border-rule pt-4 text-sm leading-relaxed text-ink-soft">
                <span className="mt-2.5 h-px w-4 shrink-0 bg-ink-faint" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href={herramienta.href} className="mt-8 self-start text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
            Abrir {herramienta.vista} →
          </Link>
        </div>
      ),
    })),
    ...gruposConceptos.map((grupo, index) => ({
      id: `conceptos-${index}`,
      titulo: `Conceptos ${index + 1}`,
      contenido: (
        <div className="flex flex-col">
          <Capitulo numero={`04.${index + 1}`} titulo={index === 0 ? "Los conceptos, en criollo" : "Los conceptos, en criollo (sigue)"} />
          <ConceptosSlide lista={grupo} />
        </div>
      ),
    })),
    {
      id: "fuentes",
      titulo: "Las fuentes",
      contenido: (
        <div className="flex flex-col">
          <Capitulo numero="05" titulo="De dónde sale cada dato" bajada="Ningún número es propio. Lo que es modelo está marcado como modelo." />
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {Object.values(SOURCES).map((fuente) => (
              <a
                key={fuente.id}
                href={fuente.portal}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 border-t border-rule pt-4 transition-colors hover:border-ink-soft"
              >
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-medium text-ink">{fuente.organismo.split(" · ")[0]}</span>
                  <span className="meta">{CADENCIA[fuente.id] ?? ""}</span>
                </span>
                <span className="text-sm leading-relaxed text-ink-soft">{fuente.descripcion}</span>
                {fuente.modelo ? <span className="meta text-atencion">modelo, no dato oficial</span> : null}
              </a>
            ))}
          </div>
        </div>
      ),
    },
    ...chunk(PREGUNTAS, QUESTIONS_PER_SLIDE).map((grupo, index) => ({
      id: `preguntas-${index}`,
      titulo: `Preguntas frecuentes ${index + 1}`,
      contenido: (
        <div className="flex flex-col">
          <Capitulo numero={`06.${index + 1}`} titulo={index === 0 ? "Lo que más se pregunta" : "Lo que más se pregunta (sigue)"} />
          <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {grupo.map((item) => (
              <div key={item.pregunta} className="flex flex-col gap-1.5 border-t border-rule pt-4">
                <dt className="text-base font-medium text-ink">{item.pregunta}</dt>
                <dd className="text-sm leading-relaxed text-ink-soft">{item.respuesta}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    })),
    {
      id: "cierre",
      titulo: "Cierre",
      contenido: (
        <div className="deck-glow -m-10 flex flex-col gap-8 p-10">
          <span className="readout text-xs text-ink-faint">07</span>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            Entender antes,
            <br />
            avisar a tiempo.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-ink-soft">
            Cota no es un servicio oficial de alerta. Ante una emergencia, Defensa Civil <span className="readout text-ink">103</span>. Todo el detalle
            técnico está al pie de cada vista, en «Documentación», y en los JSON públicos.
          </p>
          <div className="flex flex-wrap gap-3">
            {HERRAMIENTAS.map((herramienta) => (
              <Link key={herramienta.href} href={herramienta.href} className="rounded-md border border-rule px-4 py-2 text-sm text-ink transition-colors hover:border-ink-soft">
                {herramienta.vista}
              </Link>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <TopBar activo={HELP_HREF} nivel={estado.riesgo.sinDatos ? undefined : estado.riesgo.nivel} />
      <div className="min-h-0 flex-1">
        <Deck slides={slides} />
      </div>
    </div>
  );
}
