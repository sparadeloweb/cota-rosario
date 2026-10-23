import { RAIN_THRESHOLDS } from "@/lib/risk";
export interface TextBlock { title: string; paragraphs: string[] }
export interface Tool { view: string; href: string; purpose: string; offers: string[] }
export interface Concept { term: string; explanation: string }
export interface Question { question: string; response: string }
export interface RiverThresholds { alert: number | null; evacuation: number | null; lowWater: number | null }
const meters = (value: number | null) => value === null ? "consultar el umbral publicado por el INA" : `${value.toFixed(2)} m`;

export const WHAT_IT_IS: TextBlock[] = [{ title: "Qué es Cota", paragraphs: [
  "Cota reúne la información del río, la lluvia y el territorio de Rosario para entender cómo evolucionan las condiciones hídricas de la ciudad.",
  "En un mismo mapa podés consultar zonas inundables, buscar una dirección y ver reportes de vecinos. Cada lectura y pronóstico muestra su fuente y su fecha.",
  "Las vistas de Operaciones y Predicciones permiten seguir indicadores, comparar escenarios y analizar los próximos siete días.",
]}];

export const TOOLS: Tool[] = [
  { view: "Vecinos", href: "/", purpose: "Consultá el río, la lluvia y los mapas de tu zona.", offers: [
    "Señal orientativa del río y la lluvia, con explicación de los umbrales y del estado de cada fuente.",
    "Buscar una dirección y consultar zonas inundables, cartografía climática de 2024, relieve e historial del distrito.",
    "Activar capas por separado: sus colores describen datos distintos. Estar fuera de un polígono no descarta anegamiento.",
    "Compartir lo que observás en tu cuadra. Los reportes se muestran durante 24 horas y otros vecinos pueden confirmarlos.",
  ]},
  { view: "Operaciones", href: "/operaciones", purpose: "Un panel por secciones: resumen, río, lluvia, pronóstico, reportes y simulador.", offers: [
    "Recomendaciones acompañadas por el dato que las motiva y un parte de situación listo para compartir.",
    "Simulador de altura y lluvia: los controles cambian el escenario del mapa y Restablecer vuelve a la consulta.",
    "Red devuelta por el INA, con fechas, búsqueda y filtros. La cantidad de estaciones puede variar.",
    "Estaciones de la cadena del Paraná y su margen a alerta en metros; los indicadores de red excluyen lecturas de más de 48 horas.",
  ]},
  { view: "Pronóstico (dentro de Operaciones)", href: "/operaciones/pronostico", purpose: "Consultá la lluvia prevista y las tendencias de la próxima semana.", offers: [
    "Escenarios de anegamientos por día y distrito, construidos a partir de un modelo mensual y la participación histórica de cada zona.",
    "Lluvia pronosticada y referencia de extremos históricos. Los períodos de retorno dependen del ajuste y del archivo usado.",
    "Extrapolación del río si continúa el ritmo, y ajuste altura–caudal con GloFAS. Las bandas no son intervalos predictivos calibrados.",
  ]},
];

export const PROCESS: Concept[] = [
  { term: "1 · Definir el problema", explanation: "Decidir qué pregunta queremos responder, para quién y qué resultado permitiría revisar la idea." },
  { term: "2 · Plantear la idea a la IA", explanation: "Describir el caso, las restricciones y una primera pantalla. Pedir alternativas, revisar las propuestas y decidir qué implementar." },
  { term: "3 · Relevar fuentes", explanation: "Buscar lecturas, archivos, mapas y modelos. Registrar origen, fecha, unidad, resolución, acceso y limitaciones; priorizar fuentes oficiales donde existan." },
  { term: "4 · Cruzar información", explanation: "Alinear fechas, ubicación y escala. Una altura de estación, una celda de caudal y un total por distrito representan cosas diferentes." },
  { term: "5 · Calcular y explicar", explanation: "Aplicar fórmulas con unidades explícitas, conservar los datos faltantes y mostrar qué números vienen de la fuente y cuáles calcula Cota." },
  { term: "6 · Mejorar la interfaz", explanation: "Ordenar las vistas según su público, separar capas fijas y señales de la consulta, e incorporar fechas y estados comprensibles." },
  { term: "7 · Agregar funciones e iterar", explanation: "Incorporar reportes vecinales, simulaciones y predicciones. Mejorar el producto a partir del uso, los resultados y nuevas fuentes." },
];

export function concepts(thresholds: RiverThresholds): Concept[] { return [
  { term: "Altura y caudal", explanation: `La altura está en metros respecto al cero de una escala local; el caudal está en m³/s. No son intercambiables. Alerta en Rosario: ${meters(thresholds.alert)}. GloFAS estima caudal mediante un modelo global.` },
  { term: "Lluvia concentrada", explanation: `Cota compara el mayor acumulado en dos horas con umbrales orientativos de ${RAIN_THRESHOLDS.watch}, ${RAIN_THRESHOLDS.alert} y ${RAIN_THRESHOLDS.critical} mm para señalar atención, alerta o nivel crítico.` },
  { term: "Milímetros de lluvia", explanation: "Un milímetro representa un litro por metro cuadrado. La duración, el drenaje y las condiciones locales influyen en el anegamiento; el total de lluvia no alcanza para describir cada cuadra." },
  { term: "Mapas del territorio", explanation: "Las zonas inundables y el mapa climático de 2024 describen el territorio. Se consultan por separado de las condiciones del día: sus categorías no cambian al actualizar el pronóstico." },
  { term: "Relieve", explanation: "La capa propia compara la elevación con la mediana del entorno. El modelo tiene resolución limitada y puede incluir edificios: no mide el nivel de una calle ni la profundidad del agua." },
  { term: "Distrito", explanation: "El registro de Defensa Civil incorporado está agregado por distrito y mes, desde enero de 2021 hasta enero de 2024. No permite atribuir casos a una calle ni asegura la cobertura de todos los eventos." },
  { term: "Escenarios de anegamiento", explanation: "Un modelo relaciona lluvia y registros mensuales de Defensa Civil. La proyección semanal y su distribución por distrito son orientativas; la validación corresponde a la escala mensual." },
  { term: "Período de retorno", explanation: "Resume la rareza de un máximo anual dentro de una distribución ajustada. No fija cuándo ocurrirá otra tormenta. Depende del período, del reanálisis y de los supuestos del modelo." },
  { term: "Evaluación incompleta", explanation: "Aparece si falta un factor necesario o sus umbrales. Si existe una señal elevada en el factor disponible se conserva, acompañada por la indicación de evaluación parcial." },
  { term: "Reportes de vecinos", explanation: "Permiten ubicar observaciones recientes en el mapa. Cada reporte indica su tipo, antigüedad y confirmaciones. Las confirmaciones son aportes de la comunidad, no una verificación oficial." },
  { term: "Consulta y medición", explanation: "La hora de consulta indica cuándo Cota pidió los datos. La fecha de una medición indica cuándo se observó el fenómeno. Una consulta nueva puede devolver información antigua y por eso se revisan ambas." },
  { term: "Estado de las fuentes", explanation: "Cada vista indica qué fuentes pudo consultar y para qué período hay datos. Cuando falta información, el panel lo muestra como una evaluación parcial." },
]; }

export const TRAFFIC_LIGHT: Concept[] = [
  { term: "Sin señales elevadas", explanation: "El río y la lluvia están por debajo de los umbrales de referencia. Las observaciones de cada zona complementan esta lectura general." },
  { term: "Atención", explanation: "Un factor alcanza un umbral orientativo de revisión." },
  { term: "Alerta", explanation: "La altura supera el umbral publicado por el INA o la lluvia alcanza el umbral orientativo de alerta de Cota." },
  { term: "Crítico", explanation: "La altura supera el umbral de evacuación publicado por el INA o la lluvia alcanza el mayor umbral orientativo. Consultá las comunicaciones oficiales." },
];

export const QUESTIONS: Question[] = [
  { question: "¿Cómo se actualiza?", response: "Cota consulta las fuentes al abrir una vista y se actualiza cada cinco minutos mientras la pestaña está visible. El botón Actualizar permite pedir una nueva consulta. La fecha de cada lectura indica cuándo se midió o se pronosticó el dato." },
  { question: "¿Por qué hay un bloque sin datos?", response: "La fuente pudo fallar, responder con valores ausentes, devolver un dato fuera de vigencia o no cubrir el período solicitado. El detalle de la fuente permite revisar el motivo." },
  { question: "¿Qué significa no tener reportes?", response: "Que no hay aportes registrados en la ventana consultada. No permite concluir que no haya agua. Si falla el almacenamiento mostramos la consulta como no disponible." },
  { question: "¿Quién emite las alertas oficiales?", response: "Los avisos y protocolos oficiales corresponden a los organismos responsables. Cota permite consultar la información y comparar escenarios. Ante una emergencia, comunicate con Defensa Civil al 103." },
];
