module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const sourceMapRule = webpackConfig.module.rules.find(
        (r) => r.enforce === 'pre'
      );

      if (sourceMapRule) {
        const existing = sourceMapRule.exclude;
        sourceMapRule.exclude = [
          ...(Array.isArray(existing) ? existing : [existing]),
          /[/\\]node_modules[/\\]@antv[/\\]/,
          /[/\\]node_modules[/\\]@mediapipe[/\\]/,
        ].filter(Boolean);
      }

      return webpackConfig;
    },
  },
};
