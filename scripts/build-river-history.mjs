import { mkdir, writeFile } from "node:fs/promises";

const WFS_BASE = "https://alerta.ina.gob.ar/geoserver/ows";
const LAYER = "public2:ultimas_alturas_con_timeseries";
const STATION = "Rosario";
const HISTORY_DAYS = 210;
const MILLIS_PER_DAY = 86_400_000;
const OUT_DIR = "public/data";
const OUT_FILE = "rio-historia.json";

function isoDay(offsetDays) {
  return new Date(Date.now() + offsetDays * MILLIS_PER_DAY).toISOString().slice(0, 10);
}

const params = new URLSearchParams({
  service: "WFS",
  version: "1.0.0",
  request: "GetFeature",
  typeName: LAYER,
  outputFormat: "application/json",
  CQL_FILTER: `nombre='${STATION}'`,
  viewParams: `timeStart:${isoDay(-HISTORY_DAYS)};timeEnd:${isoDay(1)};`,
});
const endpoint = `${WFS_BASE}?${params}`;
const started = Date.now();
const response = await fetch(endpoint);
const body = await response.text();
if (!response.ok || body.trimStart().startsWith("<")) {
  throw new Error(`El INA respondió ${response.status}: ${body.slice(0, 200)}`);
}
const feature = JSON.parse(body).features[0];
if (!feature) {
  throw new Error(`El INA no devolvió la estación ${STATION}`);
}
const raw = feature.properties.timeseries;
const entries = typeof raw === "string" ? JSON.parse(raw) : raw;
const serie = entries
  .map(([fecha, valor]) => ({ fecha, metros: Number(valor) }))
  .filter((reading) => Number.isFinite(reading.metros))
  .sort((a, b) => a.fecha.localeCompare(b.fecha));

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  `${OUT_DIR}/${OUT_FILE}`,
  JSON.stringify(
    {
      nombre: `Altura diaria del Paraná en ${STATION}, serie del INA`,
      estacion: STATION,
      endpoint,
      diasPedidos: HISTORY_DAYS,
      desde: serie[0]?.fecha ?? null,
      hasta: serie[serie.length - 1]?.fecha ?? null,
      puntos: serie.length,
      serie,
      calculado: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(`${STATION}: ${serie.length} lecturas ${serie[0]?.fecha.slice(0, 10)} → ${serie[serie.length - 1]?.fecha.slice(0, 10)} en ${((Date.now() - started) / 1000).toFixed(0)} s`);
