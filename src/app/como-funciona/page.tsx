import Image from "next/image";
import Link from "next/link";
import { Deck, type DeckSlide } from "@/components/deck/Deck";
import { RISK_FILL } from "@/components/status";
import { TopBar } from "@/components/TopBar";
import { RESIDENTS_HOME } from "@/lib/navigation";
import { concepts, TOOLS, QUESTIONS, PROCESS, WHAT_IT_IS, TRAFFIC_LIGHT, type Concept } from "@/content/howItWorks";
import { DemoNotice } from "@/components/DemoNotice";
import { RISK_ORDER } from "@/lib/risk";
import { SOURCES } from "@/lib/sources";


const CONCEPTS_PER_SLIDE = 4;
const QUESTIONS_PER_SLIDE = 4;
const FIGURES = [
  { value: "87", label: "zonas oficiales de inundación" },
  { value: "7", label: "pasos de construcción con IA" },
  { value: "86", label: "años de registros de lluvia" },
  { value: "3", label: "vistas para consultar la ciudad" },
];
const INSTITUTIONS = [
  { name: "Tecnoteca", file: "/logos/tecnoteca.png", width: 1200, height: 597 },
  { name: "Ministerio de Ambiente y Cambio Climático · Provincia de Santa Fe", file: "/logos/ministerio-ambiente-santa-fe.png", width: 1200, height: 137 },
  { name: "Gobierno de Santa Fe", file: "/logos/gobierno-santa-fe.png", width: 757, height: 164 },
];
const CADENCE: Record<string, string> = {
  ina: "lecturas con fecha",
  openMeteo: "pronóstico modelado",
  glofas: "caudal modelado",
  weather: "condiciones modeladas",
  floodZones: "capa fija municipal",
  climateRisk: "capa fija municipal",
  civilDefense: "registro mensual municipal",
  models: "con cada pronóstico",
  terrain: "capa fija, cálculo propio",
};

function Chapter({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-10 flex flex-col gap-3">
      <span className="readout text-xs text-ink-faint">{number}</span>
      <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">{title}</h2>
      {subtitle ? <p className="max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">{subtitle}</p> : null}
    </header>
  );
}

function ConceptsSlide({ list }: { list: Concept[] }) {
  return (
    <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      {list.map((concept) => (
        <div key={concept.term} className="flex flex-col gap-2 border-t border-rule pt-4">
          <dt className="text-lg font-medium text-ink">{concept.term}</dt>
          <dd className="text-sm leading-relaxed text-ink-soft">{concept.explanation}</dd>
        </div>
      ))}
    </dl>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

export default async function HowItWorksPage() {
  const conceptList = concepts({ alert: null, evacuation: null, lowWater: null });
  const conceptGroups = chunk(conceptList, CONCEPTS_PER_SLIDE);
  const [whatItIs] = WHAT_IT_IS;

  const slides: DeckSlide[] = [
    {
      id: "portada",
      title: "Portada",
      glow: true,
      content: (
        <div className="flex flex-col gap-8">
          <span className="readout text-xs text-ink-faint">Río, lluvia y territorio · Rosario</span>
          <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-7xl lg:text-8xl">
            Cómo funciona
            <br />
            Cota
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            Lecturas del Paraná, pronósticos de lluvia y mapas de Rosario. Conocé las herramientas para consultar tu zona, seguir indicadores y comparar escenarios.
          </p>
          <div className="grid grid-cols-2 gap-6 border-t border-rule pt-6 sm:grid-cols-4">
            {FIGURES.map((figure) => (
              <div key={figure.label} className="flex flex-col gap-1">
                <span className="readout text-3xl text-ink">{figure.value}</span>
                <span className="text-xs text-ink-faint">{figure.label}</span>
              </div>
            ))}
          </div>
          <p className="meta">↓ flechas, espacio o deslizar</p>
        </div>
      ),
    },
    {
      id: "alcance",
      title: whatItIs.title,
      content: (
        <div className="flex flex-col gap-10">
          <Chapter number="01" title="La ciudad, en un mismo mapa" />
          <div className="grid gap-8 lg:grid-cols-3">
            {whatItIs.paragraphs.map((paragraph, index) => (
              <p key={paragraph} className={`leading-relaxed ${index === 0 ? "text-xl text-ink lg:col-span-3 lg:text-2xl" : "border-t border-rule pt-5 text-sm text-ink-soft"}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "semaforo",
      title: "El semáforo",
      content: (
        <div className="flex flex-col">
          <Chapter number="02" title="Cuatro luces" subtitle="El nivel combina río y lluvia. Si falta un factor, la evaluación es parcial; el gris indica evaluación incompleta." />
          <dl className="flex flex-col divide-y divide-rule">
            {TRAFFIC_LIGHT.map((light, index) => (
              <div key={light.term} className="grid gap-2 py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <dt className="flex items-center gap-3 text-xl font-medium text-ink">
                  <span className="size-3 rounded-full" style={{ background: RISK_FILL[RISK_ORDER[index]] }} aria-hidden="true" />
                  {light.term}
                </dt>
                <dd className="text-base leading-relaxed text-ink-soft">{light.explanation}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
    {
      id: "herramientas",
      title: "Las herramientas",
      content: (
        <div className="flex flex-col">
          <Chapter number="03" title="Tres vistas, tres públicos" />
          <div className="grid gap-6 lg:grid-cols-3">
            {TOOLS.map((tool, index) => (
              <Link
                key={tool.view}
                href={tool.href}
                className="group flex flex-col gap-4 rounded-lg border border-rule bg-panel/60 p-6 transition-colors hover:border-ink-soft"
              >
                <span className="readout text-xs text-ink-faint">0{index + 1}</span>
                <span className="text-2xl font-semibold text-ink">{tool.view}</span>
                <span className="text-sm leading-relaxed text-ink-soft">{tool.purpose}</span>
                <span className="meta mt-auto transition-colors group-hover:text-ink">abrir →</span>
              </Link>
            ))}
          </div>
        </div>
      ),
    },
    ...chunk(PROCESS, 4).map((group, index) => ({ id: `construccion-${index}`, title: `Cómo la construimos ${index + 1}`, content: <div><Chapter number={`03.${index + 1}`} title="De la idea al producto" /><ConceptsSlide list={group} /></div> })),
    ...TOOLS.map((tool, index) => ({
      id: `herramienta-${index}`,
      title: tool.view,
      content: (
        <div className="flex flex-col">
          <Chapter number={`03.${index + 1}`} title={tool.view} subtitle={tool.purpose} />
          <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {tool.offers.map((item) => (
              <li key={item} className="flex gap-4 border-t border-rule pt-4 text-sm leading-relaxed text-ink-soft">
                <span className="mt-2.5 h-px w-4 shrink-0 bg-ink-faint" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href={tool.href} className="mt-8 self-start text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
            Abrir {tool.view} →
          </Link>
        </div>
      ),
    })),
    ...conceptGroups.map((group, index) => ({
      id: `conceptos-${index}`,
      title: `Conceptos ${index + 1}`,
      content: (
        <div className="flex flex-col">
          <Chapter number={`04.${index + 1}`} title={index === 0 ? "Los conceptos, en criollo" : "Los conceptos, en criollo (sigue)"} />
          <ConceptsSlide list={group} />
        </div>
      ),
    })),
    {
      id: "fuentes",
      title: "Las fuentes",
      content: (
        <div className="flex flex-col">
          <Chapter number="05" title="De dónde sale cada dato" subtitle="Lecturas, modelos, transformaciones y registros tienen alcances diferentes." />
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {Object.values(SOURCES).map((source) => (
              <a
                key={source.id}
                href={source.portal}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 border-t border-rule pt-4 transition-colors hover:border-ink-soft"
              >
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-medium text-ink">{source.agency.split(" · ")[0]}</span>
                  <span className="meta">{CADENCE[source.id] ?? ""}</span>
                </span>
                <span className="text-sm leading-relaxed text-ink-soft">{source.description}</span>
                {source.model ? <span className="meta text-watch">modelo, no dato oficial</span> : null}
              </a>
            ))}
          </div>
        </div>
      ),
    },
    ...chunk(QUESTIONS, QUESTIONS_PER_SLIDE).map((group, index) => ({
      id: `preguntas-${index}`,
      title: `Preguntas frecuentes ${index + 1}`,
      content: (
        <div className="flex flex-col">
          <Chapter number={`06.${index + 1}`} title={index === 0 ? "Lo que más se pregunta" : "Lo que más se pregunta (sigue)"} />
          <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {group.map((item) => (
              <div key={item.question} className="flex flex-col gap-1.5 border-t border-rule pt-4">
                <dt className="text-base font-medium text-ink">{item.question}</dt>
                <dd className="text-sm leading-relaxed text-ink-soft">{item.response}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    })),
    {
      id: "instituciones",
      title: "Instituciones",
      content: (
        <div className="flex flex-col">
          <Chapter number="07" title="Las instituciones" subtitle="Las organizaciones que acompañan este proyecto." />
          <div className="grid gap-6 sm:grid-cols-3">
            {INSTITUTIONS.map((institution) => (
              <figure key={institution.name} className="flex flex-col gap-4 rounded-lg border border-rule bg-panel/60 p-8">
                <div className="flex h-32 items-center justify-center">
                  <Image src={institution.file} alt={institution.name} width={institution.width} height={institution.height} className="max-h-28 w-auto max-w-full object-contain" />
                </div>
                <figcaption className="meta text-center">{institution.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "cierre",
      title: "Cierre",
      glow: true,
      content: (
        <div className="flex flex-col gap-8">
          <span className="readout text-xs text-ink-faint">08</span>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            Empezá por
            <br />
            tu zona.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-ink-soft">
            Buscá una dirección, consultá las condiciones del río y la lluvia, o compartí lo que observás en tu cuadra.
          </p>
          <div className="flex flex-wrap gap-3">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="rounded-md border border-rule px-4 py-2 text-sm text-ink transition-colors hover:border-ink-soft">
                {tool.view}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-rule pt-8 opacity-80">
            {INSTITUTIONS.map((institution) => (
              <Image key={institution.name} src={institution.file} alt={institution.name} width={institution.width} height={institution.height} className="h-10 w-auto object-contain sm:h-12" />
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <TopBar
        home={RESIDENTS_HOME}
        workspace={null}
      />
      <DemoNotice />
      <div className="min-h-0 flex-1">
        <Deck slides={slides} />
      </div>
    </div>
  );
}
