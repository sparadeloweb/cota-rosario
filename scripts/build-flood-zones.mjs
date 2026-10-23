import { writeFile } from "node:fs/promises";

const SOURCE = "https://datosabiertos.rosario.gob.ar/sites/default/files/uploaded_resources/zonas_inundables_saladillo_json.csv";
const TARGET = "public/data/flood-zones.json";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const response = await fetch(SOURCE);
if (!response.ok) {
  throw new Error(`The flood zones download returned ${response.status}`);
}
const rows = parseCsv(await response.text());
const [header, ...body] = rows;
const columns = header.map((name) => name.trim().toUpperCase());
const features = [];

for (const row of body) {
  const record = Object.fromEntries(columns.map((name, index) => [name, (row[index] ?? "").trim()]));
  if (!record.GEOJSON) {
    continue;
  }
  const parsed = JSON.parse(record.GEOJSON);
  if (!parsed.geometry) {
    continue;
  }
  features.push({
    type: "Feature",
    properties: { zone: record.ZONA, sector: record.SECTOR },
    geometry: parsed.geometry,
  });
}

const collection = {
  type: "FeatureCollection",
  metadata: {
    name: "Áreas inundables — cuencas del Ludueña (zonas 1-3) y del Saladillo (zonas A-D)",
    source: "Municipalidad de Rosario · Secretaría de Planeamiento",
    portal: "https://datosabiertos.rosario.gob.ar",
    download: SOURCE,
    capturedAt: new Date().toISOString(),
    features: features.length,
  },
  features,
};

await writeFile(TARGET, JSON.stringify(collection));
const zones = [...new Set(features.map((feature) => feature.properties.zone))].sort();
console.log(`${features.length} polygons · zones: ${zones.join(", ")} · ${TARGET}`);
