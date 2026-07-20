import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Subida de documentos: el default de 1 MB no alcanza (el reglamento pesa ~1.7 MB).
    serverActions: { bodySizeLimit: "20mb" },
    // proxy.ts corre en todas las rutas y bufferea el body; su límite (10 MB) también aplica.
    proxyClientMaxBodySize: "20mb",
  },
  // Cabeceras de seguridad para todas las respuestas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Evita clickjacking (que embeban el portal en un iframe ajeno).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Fuerza HTTPS en el navegador (Railway sirve por TLS).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
};

export default nextConfig;
