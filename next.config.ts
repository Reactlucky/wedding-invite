import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/nikah", destination: "/", permanent: false },
      { source: "/train", destination: "/", permanent: false },
      { source: "/v2/nikah", destination: "/", permanent: false },
      { source: "/editor", destination: "/", permanent: false },
    ];
  },
  cacheComponents: true,
  // keep the dev badge out of exported MP4 frames
  devIndicators: false,
  partialPrefetching: true,
  // Headless Chrome is only used server-side by the MP4 exporter.
  serverExternalPackages: ["puppeteer-core"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
