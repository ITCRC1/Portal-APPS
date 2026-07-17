import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Subida de documentos: el default de 1 MB no alcanza (el reglamento pesa ~1.7 MB).
    serverActions: { bodySizeLimit: "20mb" },
    // proxy.ts corre en todas las rutas y bufferea el body; su límite (10 MB) también aplica.
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
