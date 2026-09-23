# Cota · riesgo hídrico de Rosario

Panel que cruza tres fuentes públicas en un solo nivel de riesgo explicable, con cada número enlazado a su origen y hora de consulta.

| Fuente | Qué aporta |
|---|---|
| INA · GeoServer WFS público | Altura del Paraná en Rosario, tendencia y los niveles oficiales de alerta (5,00 m) y evacuación (5,25 m), más la red completa de 357 estaciones |
| Open-Meteo | Precipitación horaria pronosticada; el modelo mira la ventana de 2 h más cargada de las próximas 48 |
| Municipalidad de Rosario | Polígonos oficiales de áreas inundables: 67 en la cuenca del Ludueña y 20 en la del Saladillo |
| Mapzen Terrain Tiles | Modelo propio de puntos bajos para el resto de la ciudad. No es dato oficial y está marcado como tal |

Dos vistas: `/` para vecinos (¿hay riesgo hoy, y dónde?) y `/operaciones` (red completa, caudal GloFAS, simulador de escenarios). `/api/estado` devuelve el cruce en JSON: 200 completo, 206 si una fuente no respondió, 503 si ninguna.

## Correr

```bash
npm install
npm run build:data     # polígonos municipales y capa de terreno → public/data
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
- El modelo de terreno mide cuánto más bajo está cada punto que su entorno de 321 m: encuentra pozos locales (macrocentro), no llanuras de inundación. Por eso marca la zona 1 del Ludueña a 1,94 m bajo su entorno y deja en cero el valle del Saladillo, que es bajo pero plano.
- Cada fuente falla por separado: si un organismo no responde, el bloque queda vacío con la hora de la falla. Nunca un 500 ni un falso "sin riesgo".

Cota no es un servicio oficial de alerta. Ante una emergencia, Defensa Civil 103.
