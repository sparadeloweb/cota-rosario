import { RAIN_THRESHOLDS } from "@/lib/risk";

export interface Bloque {
  titulo: string;
  parrafos: string[];
}

export interface Herramienta {
  vista: string;
  href: string;
  para: string;
  ofrece: string[];
}

export interface Concepto {
  termino: string;
  explicacion: string;
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

export interface UmbralesRio {
  alerta: number | null;
  evacuacion: number | null;
  aguasBajas: number | null;
}

const metros = (valor: number | null) => (valor === null ? "el nivel que fija el INA" : `${valor.toFixed(2).replace(".", ",")} m`);

export const QUE_ES: Bloque[] = [
  {
    titulo: "Qué es Cota",
    parrafos: [
      "Cota es un panel que responde una sola pregunta para Rosario: ¿hay hoy riesgo de que el agua entre a las casas o corte las calles, y dónde? Para eso junta datos que ya existen y son públicos (la altura del río, la lluvia pronosticada, los mapas oficiales de la Municipalidad) y los cruza en un semáforo de cuatro niveles.",
      "No inventa ningún número. Cada dato que se muestra viene de un organismo que lo publica, con su hora de consulta, y cuando una fuente no responde el bloque queda vacío y avisa, antes que mostrar un dato viejo como si fuera nuevo.",
      "Tampoco es un servicio oficial de alerta: ante una emergencia, la referencia es Defensa Civil (103). Cota sirve para entender la situación y anticiparse, no para reemplazar a quien tiene que dar la orden.",
    ],
  },
];

export const HERRAMIENTAS: Herramienta[] = [
  {
    vista: "Vecinos",
    href: "/",
    para: "Para cualquier persona que quiera saber cómo está hoy la ciudad y cómo está su cuadra.",
    ofrece: [
      "El semáforo del día, con el motivo en una frase: qué factor manda, el río o la lluvia.",
      "El buscador de dirección: escribís tu calle y altura y te dice si estás dentro de una zona inundable oficial, cuál es la zona más cercana y a qué distancia, qué riesgo por lluvias torrenciales le asigna la Municipalidad a tu radio censal, cuánto pesa tu distrito en los anegamientos que atiende Defensa Civil y si tu punto es un bajo del terreno.",
      "El mapa con las zonas oficiales pintadas según el nivel de hoy, la capa de riesgo por lluvias y una capa de puntos bajos que se puede prender y apagar.",
      "La altura del río con sus marcas de alerta y evacuación, la lluvia hora por hora de los próximos dos días y consejos concretos según el nivel.",
      "Reportes de vecinos: con el botón 'Reportar agua en mi cuadra' tocás el mapa donde está el agua, elegís qué ves (calle anegada, agua en viviendas, desagüe tapado, calle cortada) y queda un ícono en el mapa por 24 horas para que otros lo vean y lo confirmen. Sin cuenta ni registro.",
      "El clima actual arriba a la derecha: temperatura, humedad, presión y probabilidad de lluvia en las próximas horas.",
    ],
  },
  {
    vista: "Operaciones",
    href: "/operaciones",
    para: "Para quien tiene que tomar decisiones: Defensa Civil, distritos, prensa, equipos de guardia.",
    ofrece: [
      "Qué hacer ahora: recomendaciones accionables derivadas de los datos (limpiar sumideros antes de tal hora, reforzar guardias en tal distrito, preparar el plan ribereño), cada una con el número que la dispara y ordenadas por urgencia, más un parte de situación en texto listo para copiar y compartir.",
      "Un simulador: dos deslizadores, altura del río y lluvia en dos horas, para preguntarse '¿y si el río llegara a 5 metros?' y ver al instante cómo quedaría el semáforo y cómo se pintaría el mapa. Nada de lo que se mueve ahí toca los datos reales; el botón Restablecer vuelve a ellos.",
      "La red completa del Instituto Nacional del Agua: 357 estaciones con su altura, sus niveles de alerta y evacuación y su tendencia, con filtros y buscador.",
      "El caudal del Paraná, es decir cuánta agua pasa por segundo frente a la ciudad, hoy y en los próximos siete días.",
    ],
  },
  {
    vista: "Predicciones",
    href: "/predicciones",
    para: "Para mirar la semana que viene en vez del momento.",
    ofrece: [
      "Cuántos anegamientos tendría que atender Defensa Civil en los próximos siete días con la lluvia pronosticada, en total, por distrito y día por día, con la probabilidad de que haya al menos uno.",
      "Qué tan rara es la lluvia prevista: si el día más cargado del pronóstico es una lluvia común o una que se ve una vez cada varios años.",
      "A dónde va el río: siguiendo el ritmo de los últimos días, en cuántos días tocaría el nivel de alerta, y qué altura sugiere el caudal pronosticado.",
    ],
  },
];

export function conceptos(umbrales: UmbralesRio): Concepto[] {
  return [
    {
      termino: "Inundación y anegamiento",
      explicacion:
        "No son lo mismo. Inundación es el río que crece y ocupa terreno; en Rosario afecta la costa, las islas y los barrios sobre los arroyos Ludueña y Saladillo. Anegamiento es la calle que se llena de agua porque llovió más rápido de lo que los desagües pueden sacar; puede pasar en el microcentro con el río bajo. Cota mira las dos cosas por separado y se queda con la peor.",
    },
    {
      termino: "Altura del río",
      explicacion: `Se mide en una regla fija en la costa, la escala hidrométrica, y se expresa en metros sobre el cero de esa regla, no sobre el nivel del mar. Para Rosario el Instituto Nacional del Agua (INA) fija un nivel de alerta (${metros(umbrales.alerta)}) y uno de evacuación (${metros(umbrales.evacuacion)}); también un nivel de aguas bajas (${metros(umbrales.aguasBajas)}) por debajo del cual la navegación se complica. La lectura es una por día, publicada al día siguiente.`,
    },
    {
      termino: "Tendencia",
      explicacion: "Si el río está creciendo, bajando o quieto respecto de los días anteriores. La publica el INA junto con la altura. En Predicciones además se calcula el ritmo en centímetros por día y, si sube, en cuántos días llegaría a la alerta si siguiera igual.",
    },
    {
      termino: "Lluvia concentrada",
      explicacion: `Lo que anega no es cuánto llueve en el día sino cuánto cae junto. 40 mm repartidos en doce horas se van por los desagües; 30 mm en dos horas no. Por eso el panel mira la ventana de dos horas más cargada del pronóstico y la compara con tres umbrales: atención a partir de ${RAIN_THRESHOLDS.atencion} mm, alerta a partir de ${RAIN_THRESHOLDS.alerta} mm y crítico a partir de ${RAIN_THRESHOLDS.critico} mm. Esos umbrales son una estimación de este panel, no una norma oficial, y están marcados así.`,
    },
    {
      termino: "Milímetros de lluvia",
      explicacion: "Un milímetro de lluvia es un litro de agua por cada metro cuadrado. 10 mm es una lluvia normal; 50 mm en un día es mucha; más de 100 mm en un día en Rosario pasa una vez cada varios años.",
    },
    {
      termino: "Caudal",
      explicacion: "Cuánta agua pasa por segundo por un punto del río, en metros cúbicos por segundo (m³/s). El Paraná frente a Rosario mueve normalmente entre 12.000 y 20.000 m³/s. No se mide en Rosario: el dato viene de GloFAS, un modelo europeo que calcula el caudal de los grandes ríos del mundo a partir de la lluvia en toda la cuenca, y por eso es una estimación.",
    },
    {
      termino: "Zonas oficiales inundables",
      explicacion: "Son 87 polígonos que la Municipalidad publica como áreas inundables, sobre las cuencas de los arroyos Ludueña (zonas 1, 2 y 3) y Saladillo (zonas A, B, C y D). Que tu cuadra esté fuera no significa que no se anegue nunca: significa que no está en el registro oficial de inundación por arroyo.",
    },
    {
      termino: "Riesgo por lluvias torrenciales",
      explicacion: "Un mapa que la Municipalidad elaboró con la Nación y una red internacional de adaptación climática. Divide la ciudad en radios censales y a cada uno le da una categoría, de muy bajo a alto, según cuánto se vería afectada la vivienda por lluvias extremas: materiales de las casas, densidad, cercanía a basurales y zonas verdes. Cubre toda la ciudad, no sólo los arroyos.",
    },
    {
      termino: "Puntos bajos del terreno",
      explicacion: "Una capa propia: compara la altura de cada punto con la de su entorno de unas tres cuadras y marca los que están más hundidos, donde el agua tiende a juntarse. Se calcula sobre un modelo satelital que mide techos y no calles, así que en las manzanas densas del centro no da lectura y lo dice.",
    },
    {
      termino: "Distrito",
      explicacion: "Rosario se divide en seis distritos administrativos: Centro, Norte, Noroeste, Oeste, Sudoeste y Sur. Defensa Civil publica sus intervenciones por distrito y mes, no por calle; por eso el historial de anegamientos se cuenta por distrito.",
    },
    {
      termino: "Período de retorno",
      explicacion: "Una forma de decir qué tan rara es una lluvia. 'Cada 10 años' no quiere decir que pasa puntualmente cada diez: quiere decir que en un año cualquiera hay un 10 % de probabilidad de que el día más lluvioso llegue a ese valor. Se calcula con 86 años de registro de Rosario.",
    },
    {
      termino: "Probabilidad de al menos uno",
      explicacion: "Cuando el panel dice '2,5 anegamientos esperados, 92 %', el primer número es el promedio que da el modelo y el segundo la chance de que haya por lo menos un caso. Pueden ser cero o pueden ser seis; el promedio resume la apuesta.",
    },
    {
      termino: "Reportes de vecinos",
      explicacion: "Lo que la gente ve en su cuadra, marcado en el mapa con una gota de color. No pasan por ningún filtro humano: son una señal, no un dato oficial. Cada reporte dura 24 horas, otros pueden confirmarlo, y una misma conexión no puede cargar más de unos pocos por hora para evitar abusos.",
    },
    {
      termino: "Radio censal",
      explicacion: "La unidad más chica en que el censo divide la ciudad, de unas pocas manzanas. El mapa de riesgo por lluvias está hecho a esa escala: cuando buscás una dirección, el panel mira en qué radio cae.",
    },
  ];
}

export const SEMAFORO: Concepto[] = [
  { termino: "Sin riesgo", explicacion: "Ni el río ni la lluvia prevista alcanzan un umbral. Buen momento para revisar rejillas." },
  { termino: "Atención", explicacion: "Algo se acerca a un umbral: el río a medio metro de la alerta, o una lluvia concentrada moderada en el pronóstico. Conviene prever." },
  { termino: "Alerta", explicacion: "Se alcanzó el nivel de alerta del INA o el pronóstico trae una lluvia capaz de anegar por sí sola. Hay que actuar en las zonas marcadas." },
  { termino: "Crítico", explicacion: "Nivel de evacuación del río o lluvia extrema en pocas horas. Manda Defensa Civil." },
];

export const PREGUNTAS: Pregunta[] = [
  {
    pregunta: "¿Qué son los tres tipos de color del mapa?",
    respuesta: "Son tres capas distintas y se pueden prender y apagar desde la leyenda de abajo a la izquierda. Los polígonos con contorno son las zonas oficiales de inundación por arroyo, pintadas con el color del nivel de hoy (verde si no hay riesgo). El sombreado rojizo es el mapa municipal de riesgo por lluvias torrenciales: más intenso, más riesgo, y no cambia con el pronóstico. El punteado dorado son los puntos bajos del terreno. Las gotas de color son reportes de vecinos.",
  },
  {
    pregunta: "¿Por qué la altura del río es de ayer?",
    respuesta: "Porque en Rosario el INA publica una lectura por día, tomada a la medianoche y cargada al día siguiente. Otras estaciones de la red son horarias; ésta no. El panel muestra siempre la fecha de la lectura.",
  },
  {
    pregunta: "¿Por qué mi calle se anega y no aparece marcada?",
    respuesta: "Los polígonos oficiales cubren la inundación por arroyo. El anegamiento por lluvia se ve en la capa de riesgo por lluvias torrenciales (que sí cubre toda la ciudad) y en el historial de tu distrito. Si además tu cuadra es un bajo, la capa de puntos bajos lo marca, salvo en el centro denso.",
  },
  {
    pregunta: "¿Por qué el pronóstico de lluvia cambia de un rato a otro?",
    respuesta: "Porque los modelos meteorológicos se corren varias veces por día y cada corrida ajusta. El panel se renueva solo cada cinco minutos y muestra la hora de generación arriba a la derecha. Un pronóstico a siete días es orientativo; a dos días es bastante confiable.",
  },
  {
    pregunta: "¿Qué significa 'sin dato' o 'evaluación parcial'?",
    respuesta: "Que un organismo no respondió en ese momento. El panel evalúa con lo que tiene y lo dice; nunca rellena con un valor viejo ni pone 'sin riesgo' por falta de datos.",
  },
  {
    pregunta: "¿De dónde salen los anegamientos esperados?",
    respuesta: "De cruzar cuántos anegamientos atendió Defensa Civil cada mes con cuánto llovió ese mes, y aplicar esa relación a la lluvia pronosticada. Es una estimación estadística con un error conocido, que está en la documentación de la vista Predicciones.",
  },
  {
    pregunta: "¿Puedo confiar en la altura que sugiere el caudal?",
    respuesta: "Menos que en la tendencia. El caudal viene de un modelo global y su relación con la regla de Rosario es floja; cuando el ajuste es débil el panel lo marca como poco confiable en vez de esconderlo.",
  },
];
