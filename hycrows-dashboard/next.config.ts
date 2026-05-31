import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16+ default bundler)
  turbopack: {
    // Stellar SDK memiliki beberapa module Node.js-only
    // Turbopack menanganinya secara otomatis dengan resolve aliases
    resolveAlias: {
      fs: { browser: "./src/lib/empty.ts" },
      net: { browser: "./src/lib/empty.ts" },
      tls: { browser: "./src/lib/empty.ts" },
    },
  },

  // Keep webpack config sebagai fallback untuk `npm run build`
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
      };
    }
    return config;
  },
};

export default nextConfig;
