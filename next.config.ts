import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Wannan ne zai fitar da folder din "out" wanda Cloudflare ke bukata
  images: {
    unoptimized: true, // Wannan yana hana kowace matsala ta hotuna a Cloudflare
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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