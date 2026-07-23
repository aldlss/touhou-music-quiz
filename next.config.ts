import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["ogg-opus-decoder"],
  reactCompiler: true,
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

export default withNextIntl(nextConfig);
