import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ogg-opus-decoder"],
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
        // 这个 type: "raw" 用不了，next 太菜了
        type: "raw",
      },
    },
  },
};

module.exports = nextConfig;
