/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    // 为了抑制某个外部包动态引入使用表达式时的警告
    config.module.exprContextCritical = false;
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });
    return config;
  },
};

module.exports = nextConfig;
