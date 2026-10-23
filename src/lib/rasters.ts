export interface RasterBounds {
  west: number;
  east: number;
  north: number;
  south: number;
}

export interface RasterMeta {
  bounds: RasterBounds;
  width: number;
  height: number;
}

const RGBA_CHANNELS = 4;

export function mercator(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

export function loadPixels(src: string, meta: RasterMeta): Promise<Uint8ClampedArray> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = meta.width;
      canvas.height = meta.height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("sin canvas"));
        return;
      }
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, meta.width, meta.height).data);
    };
    image.onerror = () => reject(new Error(`no se pudo leer ${src}`));
    image.src = src;
  });
}

export function rasterOffset(meta: RasterMeta, lat: number, lon: number): number | null {
  const { bounds, width, height } = meta;
  const col = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * width);
  const row = Math.floor(((mercator(bounds.north) - mercator(lat)) / (mercator(bounds.north) - mercator(bounds.south))) * height);
  if (col < 0 || row < 0 || col >= width || row >= height) {
    return null;
  }
  return (row * width + col) * RGBA_CHANNELS;
}
