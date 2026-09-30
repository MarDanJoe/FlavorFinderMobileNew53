const { validateRelease } = require("./scripts/release-config.cjs");
module.exports = ({ config }) => {
  if (["production", "preview"].includes(process.env.EAS_BUILD_PROFILE)) {
    const errors = validateRelease({
      EAS_PROJECT_ID: config.extra?.eas?.projectId,
      ...process.env,
    });
    if (errors.length)
      throw new Error(
        `Release configuration is incomplete:\n${errors.join("\n")}`,
      );
  }
  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier:
        process.env.IOS_BUNDLE_IDENTIFIER || "com.flavorfinder.development",
    },
    extra: {
      ...config.extra,
      ...(process.env.EAS_PROJECT_ID
        ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
        : {}),
    },
  };
};
