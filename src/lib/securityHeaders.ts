export const MAP_TILE_ORIGIN = "https://tile.openstreetmap.org";
export const GEOCODER_ORIGIN = "https://nominatim.openstreetmap.org";
export const SUGGESTION_ORIGIN = "https://photon.komoot.io";
const HSTS_MAX_AGE_SECONDS = 31_536_000;

export interface HeaderEntry {
  key: string;
  value: string;
}

export function contentSecurityPolicy(isDevelopment: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${MAP_TILE_ORIGIN}`,
    "font-src 'self'",
    `connect-src 'self' ${GEOCODER_ORIGIN} ${SUGGESTION_ORIGIN}${isDevelopment ? " ws: wss:" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

export function securityHeaders(isDevelopment: boolean): HeaderEntry[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(isDevelopment) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(isDevelopment ? [] : [{ key: "Strict-Transport-Security", value: `max-age=${HSTS_MAX_AGE_SECONDS}` }]),
  ];
}
