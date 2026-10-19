const admob = require("./src/config/admob.json");
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
    plugins: [
      ...(config.plugins || []),
      [
        "react-native-google-mobile-ads",
        {
          iosAppId: admob.iosAppId,
          androidAppId: "ca-app-pub-3940256099942544~3347511713",
          delayAppMeasurementInit: true,
          skAdNetworkItems: ["cstr6suwn9.skadnetwork"],
        },
      ],
    ],
    ios: {
      ...config.ios,
      bundleIdentifier:
        process.env.IOS_BUNDLE_IDENTIFIER || "com.mardanjoe.flavorfinder",
    },
    extra: {
      ...config.extra,
      ...(process.env.EAS_PROJECT_ID
        ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
        : {}),
    },
  };
};
