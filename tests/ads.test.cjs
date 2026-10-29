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

function bannerFixture({
  mode = "test",
  focused = true,
  ready = true,
  resultsUnit = "results-live",
  platform = "ios",
} = {}) {
  let cursor = 0,
    starts = 0;
  const slots = [];
  const react = {
    createElement: (type, props, ...children) => ({
      type,
      props: props || {},
      children,
    }),
    useState(initial) {
      const i = cursor++;
      slots[i] ??= { value: initial };
      return [slots[i].value, (value) => (slots[i].value = value)];
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!slots[i] || !deps.every((v, n) => Object.is(v, slots[i].deps[n]))) {
        slots[i] = { deps };
        effect();
      }
    },
    useSyncExternalStore: (_subscribe, get) => get(),
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/components/SavedAd.native.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  new Function("exports", "require", source)(exports, (name) => {
    if (name === "react") return react;
    if (name === "react-native")
      return {
        Platform: { OS: platform },
        Text: "Text",
        View: "View",
        TouchableOpacity: "Button",
      };
    if (name === "@react-navigation/native")
      return { useIsFocused: () => focused };
    if (name === "react-native-google-mobile-ads")
      return {
        BannerAd: "Banner",
        BannerAdSize: { BANNER: "size" },
        TestIds: { BANNER: "test-unit" },
      };
    if (name === "../config/ads")
      return {
        adsMode: mode,
        savedBannerUnitId: "saved-live",
        resultsBannerUnitId: resultsUnit,
      };
    if (name === "../services/ads/runtime.native")
      return {
        adsController: {
          subscribe() {},
          getSnapshot: () => ({ ready, revision: 1 }),
          start: async () => {
            starts++;
          },
        },
      };
    if (name === "../theme") return { colors: {} };
    throw Error(name);
  });
  const nodes = (node) =>
    !node || typeof node !== "object"
      ? []
      : [node, ...(node.children ?? []).flat(Infinity).flatMap(nodes)];
  return {
    render(placement) {
      cursor = 0;
      return exports.SavedAd({ placement });
    },
    nodes,
    get starts() {
      return starts;
    },
  };
}
test("Saved and finished-result banners use separate live units and only test inventory in test mode", () => {
  for (const mode of ["live", "test"]) {
    const f = bannerFixture({ mode });
    for (const placement of ["saved", "results"]) {
      const ad = f.nodes(f.render(placement)).find((n) => n.type === "Banner");
      assert.equal(
        ad.props.unitId,
        mode === "test"
          ? "test-unit"
          : placement === "saved"
            ? "saved-live"
            : "results-live",
      );
      assert.equal(ad.props.requestOptions.requestNonPersonalizedAdsOnly, true);
    }
  }
});
test("result banners fail closed for missing live configuration, denied consent, hidden screens and disabled platforms", () => {
  for (const args of [
    { mode: "live", resultsUnit: "" },
    { ready: false },
    { focused: false },
    { mode: "off" },
    { platform: "android" },
  ]) {
    const f = bannerFixture(args);
    assert.equal(f.render("results"), null);
    if (
      args.resultsUnit === "" ||
      args.focused === false ||
      args.mode === "off" ||
      args.platform === "android"
    )
      assert.equal(f.starts, 0);
  }
});
test("a failed banner stays hidden rather than repeatedly requesting ads on rerender", () => {
  const f = bannerFixture();
  f.nodes(f.render("results"))
    .find((n) => n.type === "Banner")
    .props.onAdFailedToLoad();
  assert.equal(f.render("results"), null);
});
