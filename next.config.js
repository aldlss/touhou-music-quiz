/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["ogg-opus-decoder"],
  turbopack: {
    rules: {
      "*.md": {
        type: "raw",
      },
    },
  },
};

module.exports = nextConfig;
