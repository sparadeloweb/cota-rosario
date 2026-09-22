import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const ZOOM = 13;
const TILE = 256;
const BBOX = { west: -60.8, east: -60.58, north: -32.83, south: -33.06 };
const TILES_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
const LAND_MIN_M = 5;
const LAND_MAX_M = 80;
const WINDOW_RADIUS_PX = 20;
const LOWNESS_MAX_M = 3;
const OVERLAY_RGB = [214, 160, 74];
const OUT_DIR = "public/data";
const CONCURRENCY = 6;

const ROSARIO_CENTER = { lat: -32.9468, lon: -60.6393 };

function lonToX(lon) {
  return Math.floor(((lon + 180) / 360) * 2 ** ZOOM);
}

function latToY(lat) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** ZOOM);
}

function xToLon(x) {
  return (x / 2 ** ZOOM) * 360 - 180;
}

function yToLat(y) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** ZOOM;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

async function fetchTile(x, y) {
  const response = await fetch(`${TILES_URL}/${ZOOM}/${x}/${y}.png`);
  if (!response.ok) {
    throw new Error(`Tile ${ZOOM}/${x}/${y} devolvió ${response.status}`);
  }
  const { data, info } = await sharp(Buffer.from(await response.arrayBuffer())).raw().toBuffer({ resolveWithObject: true });
  const elevations = new Float32Array(TILE * TILE);
  for (let index = 0; index < TILE * TILE; index += 1) {
    const offset = index * info.channels;
    elevations[index] = data[offset] * 256 + data[offset + 1] + data[offset + 2] / 256 - 32768;
  }
  return elevations;
}

async function mapLimited(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await worker(items[index], index);
      }
    }),
  );
  return results;
}

function buildSummedAreaTables(values, valid, width, height) {
  const sum = new Float64Array((width + 1) * (height + 1));
  const count = new Uint32Array((width + 1) * (height + 1));
  const stride = width + 1;
  for (let row = 1; row <= height; row += 1) {
    for (let col = 1; col <= width; col += 1) {
      const index = (row - 1) * width + (col - 1);
      const here = index;
      const value = valid[here] ? values[here] : 0;
      const presence = valid[here] ? 1 : 0;
      sum[row * stride + col] = value + sum[(row - 1) * stride + col] + sum[row * stride + col - 1] - sum[(row - 1) * stride + col - 1];
      count[row * stride + col] = presence + count[(row - 1) * stride + col] + count[row * stride + col - 1] - count[(row - 1) * stride + col - 1];
    }
  }
  return { sum, count, stride };
}

function windowMean(tables, col, row, radius, width, height) {
  const { sum, count, stride } = tables;
  const left = Math.max(0, col - radius);
  const right = Math.min(width - 1, col + radius);
  const top = Math.max(0, row - radius);
  const bottom = Math.min(height - 1, row + radius);
  const total = sum[(bottom + 1) * stride + right + 1] - sum[top * stride + right + 1] - sum[(bottom + 1) * stride + left] + sum[top * stride + left];
  const cells = count[(bottom + 1) * stride + right + 1] - count[top * stride + right + 1] - count[(bottom + 1) * stride + left] + count[top * stride + left];
  return cells === 0 ? null : total / cells;
}

const x0 = lonToX(BBOX.west);
const x1 = lonToX(BBOX.east);
const y0 = latToY(BBOX.north);
const y1 = latToY(BBOX.south);
const cols = x1 - x0 + 1;
const rows = y1 - y0 + 1;
const width = cols * TILE;
const height = rows * TILE;

console.log(`z${ZOOM} · tiles x ${x0}…${x1} y ${y0}…${y1} → ${cols}×${rows} = ${cols * rows} tiles · mosaico ${width}×${height}`);

const coords = [];
for (let ty = 0; ty < rows; ty += 1) {
  for (let tx = 0; tx < cols; tx += 1) {
    coords.push({ tx, ty });
  }
}

const elevation = new Float32Array(width * height);
const tiles = await mapLimited(coords, CONCURRENCY, ({ tx, ty }) => fetchTile(x0 + tx, y0 + ty));
tiles.forEach((tile, index) => {
  const { tx, ty } = coords[index];
  for (let row = 0; row < TILE; row += 1) {
    elevation.set(tile.subarray(row * TILE, row * TILE + TILE), (ty * TILE + row) * width + tx * TILE);
  }
});

const valid = new Uint8Array(width * height);
let landCells = 0;
for (let index = 0; index < elevation.length; index += 1) {
  if (elevation[index] >= LAND_MIN_M && elevation[index] <= LAND_MAX_M) {
    valid[index] = 1;
    landCells += 1;
  }
}

const tables = buildSummedAreaTables(elevation, valid, width, height);
const lowness = new Float32Array(width * height);
const rgba = Buffer.alloc(width * height * 4);
let flagged = 0;
for (let row = 0; row < height; row += 1) {
  for (let col = 0; col < width; col += 1) {
    const index = row * width + col;
    if (!valid[index]) {
      continue;
    }
    const mean = windowMean(tables, col, row, WINDOW_RADIUS_PX, width, height);
    if (mean === null) {
      continue;
    }
    const value = Math.max(0, mean - elevation[index]);
    lowness[index] = value;
    const alpha = Math.round(Math.min(1, value / LOWNESS_MAX_M) * 255);
    if (value >= 1) {
      flagged += 1;
    }
    const offset = index * 4;
    rgba[offset] = OVERLAY_RGB[0];
    rgba[offset + 1] = OVERLAY_RGB[1];
    rgba[offset + 2] = OVERLAY_RGB[2];
    rgba[offset + 3] = alpha;
  }
}

const bounds = { west: xToLon(x0), east: xToLon(x1 + 1), north: yToLat(y0), south: yToLat(y1 + 1) };

function sampleAt(lat, lon) {
  const col = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * width);
  const mercator = (value) => Math.log(Math.tan(Math.PI / 4 + (value * Math.PI) / 360));
  const row = Math.floor(((mercator(bounds.north) - mercator(lat)) / (mercator(bounds.north) - mercator(bounds.south))) * height);
  const index = row * width + col;
  return { elevacion: elevation[index], hundimiento: lowness[index] };
}

const metersPerPixel = (40075016.686 * Math.cos((ROSARIO_CENTER.lat * Math.PI) / 180)) / (TILE * 2 ** ZOOM);

await mkdir(OUT_DIR, { recursive: true });
await sharp(rgba, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9, palette: true, colours: 128, dither: 0 }).toFile(`${OUT_DIR}/terreno.png`);

const metadata = {
  nombre: "Puntos bajos del terreno — modelo de elevación",
  metodo: `Diferencia entre la elevación de cada punto y la media de su entorno de ${Math.round(WINDOW_RADIUS_PX * metersPerPixel)} m. Sólo sobre tierra (${LAND_MIN_M}–${LAND_MAX_M} m); el agua queda enmascarada.`,
  fuente: "Mapzen Terrain Tiles en AWS (SRTM, GMTED2010, ETOPO1)",
  endpoint: TILES_URL,
  zoom: ZOOM,
  resolucionMetros: Number(metersPerPixel.toFixed(1)),
  ventanaMetros: Math.round(WINDOW_RADIUS_PX * metersPerPixel),
  escalaMaximaMetros: LOWNESS_MAX_M,
  bounds,
  ancho: width,
  alto: height,
  celdasTierra: landCells,
  celdasHundidas1m: flagged,
  calculado: new Date().toISOString(),
};
await writeFile(`${OUT_DIR}/terreno.json`, JSON.stringify(metadata, null, 2));

console.log(`tierra ${landCells} celdas · ≥1 m por debajo del entorno: ${flagged} (${((flagged / landCells) * 100).toFixed(1)} %) · ${metersPerPixel.toFixed(1)} m/px`);
console.log("centro:", sampleAt(ROSARIO_CENTER.lat, ROSARIO_CENTER.lon));
for (const [zona, lat, lon] of [["1", -32.9074, -60.7449], ["2", -32.9037, -60.7317], ["3", -32.902, -60.7359], ["A", -33.0249, -60.6637], ["B", -33.025, -60.668], ["C", -33.0208, -60.6629], ["D", -33.0219, -60.6573]]) {
  const sample = sampleAt(lat, lon);
  console.log(`zona ${zona}: ${sample.elevacion.toFixed(1)} m · ${sample.hundimiento.toFixed(2)} m bajo su entorno`);
}
