import { mkdir, writeFile } from "node:fs/promises";

const WFS_BASE = "https://alerta.ina.gob.ar/geoserver/ows";
const LAYER = "public2:ultimas_alturas_con_timeseries";
const STATION = "Rosario";
const HISTORY_DAYS = 210;
const MILLIS_PER_DAY = 86_400_000;
const OUT_DIR = "public/data";
const OUT_FILE = "river-history.json";

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
  throw new Error(`INA responded ${response.status}: ${body.slice(0, 200)}`);
}
const feature = JSON.parse(body).features[0];
if (!feature) {
  throw new Error(`INA did not return the station ${STATION}`);
}
const raw = feature.properties.timeseries;
const entries = typeof raw === "string" ? JSON.parse(raw) : raw;
const series = entries
  .map(([date, value]) => ({ date, meters: Number(value) }))
  .filter((reading) => Number.isFinite(reading.meters))
  .sort((a, b) => a.date.localeCompare(b.date));

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  `${OUT_DIR}/${OUT_FILE}`,
  JSON.stringify(
    {
      name: `Altura diaria del Paraná en ${STATION}, serie del INA`,
      station: STATION,
      endpoint,
      requestedDays: HISTORY_DAYS,
      from: series[0]?.date ?? null,
      until: series[series.length - 1]?.date ?? null,
      points: series.length,
      series,
      computedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(`${STATION}: ${series.length} readings ${series[0]?.date.slice(0, 10)} → ${series[series.length - 1]?.date.slice(0, 10)} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
