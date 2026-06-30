import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite isolar o build do dev server (que usa `.next`) definindo
  // NEXT_DIST_DIR — usado em CI/auditorias para não derrubar o `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Cabeçalhos de segurança (defensivos). Sem CSP estrita de propósito, para
  // não quebrar Supabase / Material Symbols / VLibras (vlibras.gov.br).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
