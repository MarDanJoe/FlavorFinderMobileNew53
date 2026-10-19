const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function controller(deps) {
  const exports = {};
  new Function(
    "exports",
    ts.transpileModule(
      fs.readFileSync("src/services/ads/controller.ts", "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
  )(exports);
  return exports.createAdsController(deps);
}
function fixture(
  info = { canRequestAds: true, privacyOptionsRequirementStatus: "REQUIRED" },
) {
  const calls = [];
  const deps = {
    gatherConsent: async () => {
      calls.push("consent");
      return info;
    },
    showPrivacyOptionsForm: async () => {
      calls.push("privacy");
      return info;
    },
    configure: async () => calls.push("configure"),
    initialize: async () => calls.push("initialize"),
  };
  return { calls, deps };
}
test("advertising waits for consent and configures before a single SDK initialization", async () => {
  const f = fixture(),
    c = controller(f.deps);
  assert.equal(c.getSnapshot().ready, false);
  await Promise.all([c.start(), c.start()]);
  assert.deepEqual(f.calls, ["consent", "configure", "initialize"]);
  assert.equal(c.getSnapshot().ready, true);
  await c.start();
  assert.equal(f.calls.length, 3);
});
test("denied consent or failed consent never initializes ads and does not throw into the app", async () => {
  for (const fail of [false, true]) {
    const f = fixture({
      canRequestAds: false,
      privacyOptionsRequirementStatus: "REQUIRED",
    });
    if (fail)
      f.deps.gatherConsent = async () => {
        throw Error("network");
      };
    const c = controller(f.deps);
    await c.start();
    assert.equal(c.getSnapshot().ready, false);
    assert.ok(!f.calls.includes("initialize"));
  }
});
test("changing ad privacy choices removes ready ads and honors revoked permission without reinitializing", async () => {
  const f = fixture(),
    c = controller(f.deps);
  await c.start();
  let finish;
  f.deps.showPrivacyOptionsForm = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const pending = c.privacy();
  assert.equal(c.getSnapshot().ready, false);
  finish({ canRequestAds: false, privacyOptionsRequirementStatus: "REQUIRED" });
  await pending;
  assert.equal(c.getSnapshot().ready, false);
  assert.equal(f.calls.filter((v) => v === "initialize").length, 1);
});
test("development and default signed configurations cannot accidentally use live advertising", () => {
  const source = ts.transpileModule(
    fs.readFileSync("src/config/ads.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  function mode(env, dev, demo = false) {
    const exports = {};
    new Function("exports", "require", "process", "__DEV__", source)(
      exports,
      (n) =>
        n === "./demo"
          ? { DEMO_MODE: demo }
          : { savedBannerUnitId: "live-unit" },
      { env },
      dev,
    );
    return exports.adsMode;
  }
  assert.equal(mode({}, false), "test");
  assert.equal(mode({ EXPO_PUBLIC_ADS_MODE: "live" }, true), "test");
  assert.equal(mode({ EXPO_PUBLIC_ADS_MODE: "live" }, false), "live");
  assert.equal(mode({ EXPO_PUBLIC_ADS_MODE: "off" }, false), "off");
  assert.equal(mode({ EXPO_PUBLIC_ADS_MODE: "live" }, false, true), "off");
});
