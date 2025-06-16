/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    // 为了抑制某个外部包动态引入使用表达式时的警告
    config.module.exprContextCritical = false;
    config.module.rules.push({
      test: /\.md$/,
      type: "asset/source",
    });

    // 找到所有CSS规则
    const rules = config.module.rules.find(
      (rule) => typeof rule.oneOf === "object",
    );

    if (rules) {
      // 修改CSS规则，排除带有?raw ?url的文件
      rules.oneOf.forEach((rule) => {
        if (rule.test && rule.test.toString().includes(".css")) {
          if (!rule.resourceQuery) {
            // 添加排除规则
            rule.resourceQuery = { not: [/raw/, /url/] };
          }
        }
      });
    }

    config.module.rules.push({
      resourceQuery: /url/,
      type: "asset",
    });
    config.module.rules.push({
      resourceQuery: /raw/,
      type: "asset/source",
    });
    return config;
  },
};

module.exports = nextConfig;
