# Cota · riesgo hídrico de Rosario

Panel que cruza tres fuentes públicas en un solo nivel de riesgo explicable, con cada número enlazado a su origen y hora de consulta.

| Fuente | Qué aporta |
|---|---|
| INA · GeoServer WFS público | Altura del Paraná en Rosario, tendencia y los niveles oficiales de alerta (5,00 m) y evacuación (5,25 m), más la red completa de 357 estaciones |
| Open-Meteo | Precipitación horaria pronosticada; el modelo mira la ventana de 2 h más cargada de las próximas 48 |
| Municipalidad de Rosario | Polígonos oficiales de áreas inundables: 67 en la cuenca del Ludueña y 20 en la del Saladillo |
| Municipalidad de Rosario · InfoMapa | Mapa de Riesgo Climático 2024, capa "afectación a vivienda y hábitat por precipitaciones torrenciales" por radio censal, en cuatro categorías; cubre toda la ciudad |
| Municipalidad de Rosario · Defensa Civil | Anegamientos transitorios atendidos por distrito y mes (2021 a enero de 2024), cruzados con la lluvia mensual del archivo histórico de Open-Meteo |
| Mapzen Terrain Tiles | Modelo propio de puntos bajos para el resto de la ciudad. No es dato oficial y está marcado como tal |

Tres vistas: `/` para vecinos (¿hay riesgo hoy, y dónde?), `/operaciones` (red completa, caudal GloFAS, simulador de escenarios) y `/predicciones` (modelos a 7 días). `/api/estado` y `/api/predicciones` devuelven todo en JSON: 200 completo, 206 si una fuente no respondió, 503 si ninguna.

## Predicciones

Tres modelos ajustados en `npm run build:data` (`scripts/build-modelos.mjs`) y evaluados en cada pedido con el pronóstico del momento. Cada uno publica su ajuste y su error en la página y en `public/data/modelos.json`.

- **Anegamientos**: regresión de Poisson de las intervenciones mensuales de Defensa Civil contra la lluvia horaria de ERA5 del mismo mes. Se prueban tres conjuntos de variables (total, pico de 2 h, ambos) y se elige por validación cruzada dejando un mes afuera, descartando cualquier ajuste con coeficiente negativo. Se aplica a los 7 días de pronóstico y se reparte por distrito según la participación histórica.
- **Lluvia extrema**: Gumbel por momentos sobre el máximo diario de cada año desde 1940; devuelve el período de retorno del día más cargado del pronóstico y los cuantiles de 2 a 100 años. ERA5 suaviza las tormentas convectivas, así que los extremos reales de estación son algo mayores.
- **Río**: recta de mínimos cuadrados sobre los últimos 14 días del INA (ritmo y días hasta alerta/evacuación) y curva altura–caudal `h = a + b·ln(Q)` ajustada sobre 210 días de INA contra GloFAS, aplicada al caudal pronosticado a 7 días. Bandas de ±2σ.

El GeoServer del INA tarda proporcionalmente a los días pedidos (14 días ≈ 3 s, 60 ≈ 22 s, 210 ≈ 55 s) y a veces cae con `Cannot get a connection, pool error`. Por eso la serie larga se guarda como instantánea (`scripts/build-river-history.mjs` → `public/data/rio-historia.json`), en cada pedido se fusiona con los últimos 14 días en vivo, y cuando la instantánea queda más de 3 días atrás el servidor la renueva en segundo plano sin bloquear la vista.

## Qué tan al día está cada dato

| Dato | Cadencia | Cómo se actualiza |
|---|---|---|
| Altura del Paraná en Rosario (INA) | Una lectura diaria, publicada con hasta un día de demora | En vivo, caché de 5 min |
| Red de 357 estaciones (INA) | Horaria en la mayoría | En vivo, caché de 5 min |
| Pronóstico de lluvia (Open-Meteo) | Corridas horarias | En vivo, caché de 5 min |
| Caudal GloFAS | Diario | En vivo, caché de 5 min |
| Lluvia histórica (ERA5 vía Open-Meteo) | Llega hasta el día actual | Se reajusta con `build:data` |
| Intervenciones de Defensa Civil | Publicadas hasta enero de 2024; el municipio no cargó más | Se reajusta con `build:data` cuando publiquen |
| Áreas inundables, riesgo climático 2024, distritos, barrios | Capas estáticas | `build:data` |

Toda vista abierta se renueva sola cada 5 minutos y al volver a la pestaña; el header muestra la hora de generación.

## Correr

```bash
npm install
npm run build:data     # polígonos, terreno, riesgo climático, Defensa Civil, distritos y barrios → public/data
npm run build
npm start -- -p 3200
```

## Exponerlo con Cloudflare

```bash
npm run tunnel
```

Imprime una URL `*.trycloudflare.com`. Usa `cloudflared.yml` con un `ingress` explícito: en cloudflared 2026.9 el atajo `--url` registra el túnel pero no enruta los pedidos y responde 404 él mismo.

## Datos y sus trampas

- GloFAS en las coordenadas del centro devuelve 0,03 m³/s: esa celda no tiene cauce. Se consulta la celda del canal (-32,975 / -60,675), que devuelve el caudal real (~17.000 m³/s).
- 265 estaciones del INA publican `nivel_de_alerta: 0` como relleno. Los umbrales sólo se comparan cuando son mayores a cero.
- El archivo municipal se llama "Saladillo" pero tres cuartos de sus polígonos son del Ludueña.
- El modelo de terreno mide cuánto más bajo está cada punto que la **mediana** de su entorno de 321 m. Se usa la mediana y no la media porque SRTM es un modelo de superficie: mide techos, y con la media una calle plana del microcentro leía 3 m "por debajo" de las torres de al lado. Encuentra pozos locales, no llanuras de inundación: por eso deja en cero el valle del Saladillo, que es bajo pero plano.
- El mapa de riesgo climático no está en el portal de datos abiertos: vive en el WMS de InfoMapa (`/wms/ambiente`), que no permite `GetFeatureInfo` ni WFS y limita `GetMap` a 2048 px. Se rasteriza a 2048 px (≈11 m/px), se rellenan los contornos negros con la categoría vecina dominante y se reproyecta fila por fila a Mercator para consultarlo por dirección.
- Las intervenciones de Defensa Civil vienen por distrito, no por cuadra, y mezclan densidad de población y de reclamos con el terreno. El archivo 2021 usa otro formato (punto y coma, meses con nombre), al 2022 le falta diciembre y el de 2024 sólo trae enero; el panel compara sobre el último año completo.
- El mismo servidor tiene `/wms/infraestructura` con conductos, sumideros y drenajes a cielo abierto, y la IDE provincial (`aswe.santafe.gov.ar/idesf/wms`) publica curvas de nivel y líneas de riesgo históricas, pero ninguna de esas capas tiene datos dentro de Rosario.
- Cada fuente falla por separado: si un organismo no responde, el bloque queda vacío con la hora de la falla. Nunca un 500 ni un falso "sin riesgo".

Cota no es un servicio oficial de alerta. Ante una emergencia, Defensa Civil 103.
