import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const WMS = "https://infomapa.rosario.gob.ar/wms/ambiente";
const LAYER = "riesgo_vivienda_precipita";
const BBOX = { west: -60.8, east: -60.58, north: -32.83, south: -33.06 };
const WMS_MAX_PX = 2048;
const OUT_DIR = "public/data";
const OVERLAY_FILE = "riesgo-clima.png";
const CATEGORY_FILE = "riesgo-clima-cat.png";
const OUTLINE_FILL_RADIUS_PX = 3;
const COLOR_TOLERANCE = 24;

const CATEGORIES = ["fuera", "muy bajo", "bajo", "medio", "alto"];
const LEGEND_RGB = [null, [255, 255, 255], [245, 255, 0], [255, 150, 50], [255, 0, 0]];
const OUTLINE_RGB = [0, 0, 0];
const CATEGORY_GREY = [0, 51, 102, 153, 204];
const OVERLAY_RGB = [214, 92, 84];
const OVERLAY_ALPHA = [0, 0, 45, 105, 175];

const CHECKPOINTS = [
  { nombre: "Córdoba y Corrientes (centro)", lat: -32.9468, lon: -60.6393 },
  { nombre: "Ludueña, zona 2", lat: -32.9037, lon: -60.7317 },
  { nombre: "Saladillo, zona A", lat: -33.0249, lon: -60.6637 },
];

function mercator(lat) {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

function inverseMercator(value) {
  return ((2 * Math.atan(Math.exp(value)) - Math.PI / 2) * 180) / Math.PI;
}

function closeTo(data, offset, rgb) {
  return Math.abs(data[offset] - rgb[0]) <= COLOR_TOLERANCE && Math.abs(data[offset + 1] - rgb[1]) <= COLOR_TOLERANCE && Math.abs(data[offset + 2] - rgb[2]) <= COLOR_TOLERANCE;
}

function classify(data, channels, index) {
  const offset = index * channels;
  if (channels === 4 && data[offset + 3] === 0) {
    return { category: 0, outline: false };
  }
  if (closeTo(data, offset, OUTLINE_RGB)) {
    return { category: 0, outline: true };
  }
  const category = LEGEND_RGB.findIndex((rgb) => rgb !== null && closeTo(data, offset, rgb));
  return { category: category < 0 ? 0 : category, outline: false };
}

function dominantNeighbour(categories, width, height, col, row) {
  for (let radius = 1; radius <= OUTLINE_FILL_RADIUS_PX; radius += 1) {
    const counts = new Array(CATEGORIES.length).fill(0);
    for (let y = Math.max(0, row - radius); y <= Math.min(height - 1, row + radius); y += 1) {
      for (let x = Math.max(0, col - radius); x <= Math.min(width - 1, col + radius); x += 1) {
        counts[categories[y * width + x]] += 1;
      }
    }
    const best = counts.slice(1).reduce((winner, count, index) => (count > counts[winner] ? index + 1 : winner), 1);
    if (counts[best] > 0) {
      return best;
    }
  }
  return 0;
}

const aspect = (BBOX.east - BBOX.west) / (BBOX.north - BBOX.south);
const sourceHeight = WMS_MAX_PX;
const sourceWidth = Math.floor(sourceHeight * aspect);
const params = new URLSearchParams({
  SERVICE: "WMS",
  VERSION: "1.1.1",
  REQUEST: "GetMap",
  LAYERS: LAYER,
  STYLES: "",
  SRS: "EPSG:4326",
  BBOX: `${BBOX.west},${BBOX.south},${BBOX.east},${BBOX.north}`,
  WIDTH: String(sourceWidth),
  HEIGHT: String(sourceHeight),
  FORMAT: "image/png",
  TRANSPARENT: "true",
});
const endpoint = `${WMS}?${params}`;
const response = await fetch(endpoint);
if (!response.ok || !(response.headers.get("content-type") ?? "").startsWith("image/")) {
  throw new Error(`infomapa devolvió ${response.status} ${response.headers.get("content-type")}`);
}
const { data, info } = await sharp(Buffer.from(await response.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const rawCategories = new Uint8Array(sourceWidth * sourceHeight);
const outline = new Uint8Array(sourceWidth * sourceHeight);
for (let index = 0; index < rawCategories.length; index += 1) {
  const cell = classify(data, info.channels, index);
  rawCategories[index] = cell.category;
  outline[index] = cell.outline ? 1 : 0;
}
const filled = Uint8Array.from(rawCategories);
let outlineCells = 0;
for (let row = 0; row < sourceHeight; row += 1) {
  for (let col = 0; col < sourceWidth; col += 1) {
    const index = row * sourceWidth + col;
    if (outline[index]) {
      outlineCells += 1;
      filled[index] = dominantNeighbour(rawCategories, sourceWidth, sourceHeight, col, row);
    }
  }
}

const height = sourceHeight;
const width = sourceWidth;
const mercNorth = mercator(BBOX.north);
const mercSpan = mercNorth - mercator(BBOX.south);
const sourceRowFor = (row) => {
  const lat = inverseMercator(mercNorth - ((row + 0.5) / height) * mercSpan);
  return Math.min(sourceHeight - 1, Math.max(0, Math.floor(((BBOX.north - lat) / (BBOX.north - BBOX.south)) * sourceHeight)));
};

const categoryPng = Buffer.alloc(width * height);
const overlayPng = Buffer.alloc(width * height * 4);
const counts = new Array(CATEGORIES.length).fill(0);
for (let row = 0; row < height; row += 1) {
  const sourceRow = sourceRowFor(row);
  for (let col = 0; col < width; col += 1) {
    const category = filled[sourceRow * width + col];
    const index = row * width + col;
    counts[category] += 1;
    categoryPng[index] = CATEGORY_GREY[category];
    overlayPng.set([OVERLAY_RGB[0], OVERLAY_RGB[1], OVERLAY_RGB[2], OVERLAY_ALPHA[category]], index * 4);
  }
}

await mkdir(OUT_DIR, { recursive: true });
await sharp(categoryPng, { raw: { width, height, channels: 1 } }).png({ compressionLevel: 9, palette: true, colours: 8, dither: 0 }).toFile(`${OUT_DIR}/${CATEGORY_FILE}`);
await sharp(overlayPng, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9, palette: true, colours: 8, dither: 0 }).toFile(`${OUT_DIR}/${OVERLAY_FILE}`);

const metersPerPixel = ((BBOX.east - BBOX.west) * 111320 * Math.cos((((BBOX.north + BBOX.south) / 2) * Math.PI) / 180)) / width;
const metadata = {
  nombre: "Riesgo de afectación a vivienda y hábitat por precipitaciones torrenciales",
  fuente: "Mapas de Riesgo Climático Rosario 2024 · Municipalidad de Rosario, NAP Global Network y Dirección Nacional de Cambio Climático",
  unidad: "radio censal",
  capa: LAYER,
  endpoint,
  categorias: CATEGORIES,
  categoriaGris: CATEGORY_GREY,
  archivoCategorias: CATEGORY_FILE,
  bounds: BBOX,
  ancho: width,
  alto: height,
  resolucionMetros: Number(metersPerPixel.toFixed(1)),
  celdasPorCategoria: Object.fromEntries(CATEGORIES.map((name, index) => [name, counts[index]])),
  calculado: new Date().toISOString(),
};
await writeFile(`${OUT_DIR}/riesgo-clima.json`, JSON.stringify(metadata, null, 2));

function sampleAt(lat, lon) {
  const col = Math.floor(((lon - BBOX.west) / (BBOX.east - BBOX.west)) * width);
  const row = Math.floor(((mercNorth - mercator(lat)) / mercSpan) * height);
  return CATEGORIES[CATEGORY_GREY.indexOf(categoryPng[row * width + col])];
}

console.log(`${LAYER} ${width}×${height} · ${metersPerPixel.toFixed(1)} m/px · contornos rellenados ${outlineCells}`);
console.log("celdas por categoría:", metadata.celdasPorCategoria);
for (const point of CHECKPOINTS) {
  console.log(`${point.nombre}: ${sampleAt(point.lat, point.lon)}`);
}
