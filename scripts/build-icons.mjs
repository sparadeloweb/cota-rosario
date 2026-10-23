import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "src/app/icon.svg";
const OUT_DIR = "public/icons";
const GROUND = "#0b0c0e";
const MASKABLE_SAFE_ZONE = 0.8;
const SIZES = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];

const svg = await readFile(SOURCE);
await mkdir(OUT_DIR, { recursive: true });

for (const { file, size, maskable } of SIZES) {
  const inner = maskable ? Math.round(size * MASKABLE_SAFE_ZONE) : size;
  const mark = await sharp(svg, { density: 1200 }).resize(inner, inner).png().toBuffer();
  const offset = Math.round((size - inner) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background: maskable ? GROUND : { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT_DIR}/${file}`);
}

console.log(`Íconos generados en ${OUT_DIR}: ${SIZES.map((item) => item.file).join(", ")}`);
