process.env.NODE_ENV ||= "production";
require("@expo/env").load(process.cwd());
const { validateRelease } = require("./release-config.cjs");
const errors = validateRelease({
  EAS_PROJECT_ID: require("../app.json").expo.extra?.eas?.projectId,
  ...process.env,
});
const sdk = Number(
  require("../package.json").dependencies.expo.match(/\d+/)?.[0],
);
if (sdk < 57) errors.push("Upgrade to the supported stable Expo SDK");
if (errors.length) {
  console.error(`Release blocked:\n${errors.map((e) => `- ${e}`).join("\n")}`);
  process.exitCode = 1;
} else
  console.log(
    "Release configuration passes. Signed build, live backend tests, device testing and App Store review are still required.",
  );
