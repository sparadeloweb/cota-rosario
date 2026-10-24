import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "docs/brand/cota-symbol-color.svg";
const FAVICON_SOURCE = "src/app/icon.svg";
const OUT_DIR = "public/icons";
const MASKABLE_BACKGROUND = "#0B0C0E";
const MASKABLE_SAFE_ZONE = 0.8;
const FAVICON_FILE = "src/app/favicon.ico";
const FAVICON_SIZE = 32;
const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;
const SIZES = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];

const svg = await readFile(SOURCE);
const faviconSvg = await readFile(FAVICON_SOURCE);
await mkdir(OUT_DIR, { recursive: true });

for (const { file, size, maskable } of SIZES) {
  const inner = maskable ? Math.round(size * MASKABLE_SAFE_ZONE) : size;
  const mark = await sharp(svg, { density: 1200 }).resize(inner, inner).png().toBuffer();
  const offset = Math.round((size - inner) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background: maskable ? MASKABLE_BACKGROUND : { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT_DIR}/${file}`);
}

const faviconPng = await sharp(faviconSvg, { density: 1200 }).resize(FAVICON_SIZE, FAVICON_SIZE).png().toBuffer();
const header = Buffer.alloc(ICO_HEADER_BYTES + ICO_ENTRY_BYTES);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(FAVICON_SIZE, 6);
header.writeUInt8(FAVICON_SIZE, 7);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(faviconPng.length, 14);
header.writeUInt32LE(ICO_HEADER_BYTES + ICO_ENTRY_BYTES, 18);
await writeFile(FAVICON_FILE, Buffer.concat([header, faviconPng]));

console.log(`Icons written to ${OUT_DIR} and ${FAVICON_FILE}: ${SIZES.map((item) => item.file).join(", ")}`);
