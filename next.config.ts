import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./src/lib/navigation";
import { securityHeaders } from "./src/lib/securityHeaders";

const BUILD_ID = process.env.COTA_BUILD_ID ?? String(Date.now());

const nextConfig: NextConfig = {
  output: "standalone",
  env: { NEXT_PUBLIC_COTA_BUILD: BUILD_ID },
  async redirects() {
    return [...LEGACY_REDIRECTS];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders(process.env.NODE_ENV !== "production") },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/sw-strategy.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
