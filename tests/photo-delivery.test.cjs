const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function harness({
  direct = true,
  session = async () => "private-token",
} = {}) {
  const slots = [],
    calls = [];
  let cursor = 0,
    cleanup,
    effect,
    tree;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (value) => {
          slots[i] = value;
        },
      ];
    },
    useEffect(fn) {
      effect = fn;
    },
  };
  const exports = {};
  new Function(
    "exports",
    "require",
    "process",
    "fetch",
    ts.transpileModule(
      fs.readFileSync("src/components/RestaurantImage.tsx", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.React,
          esModuleInterop: true,
        },
      },
    ).outputText,
  )(
    exports,
    (name) => {
      if (name === "react") return react;
      if (name === "react-native")
        return {
          Platform: { OS: "ios" },
          Image: "Image",
          View: "View",
          Text: "Text",
        };
      if (name === "../services/supabase")
        return { supabase: {}, restaurantSession: session };
      if (name === "../config/env")
        return { ENV: { API: { BASE_URL: "https://app.test/places" } } };
      if (name === "../theme") return { colors: {} };
      if (name === "@expo/vector-icons/Ionicons") return "Icon";
      throw Error(name);
    },
    {
      env: {
        EXPO_PUBLIC_DIRECT_PHOTOS: direct ? "true" : "false",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
      },
    },
    async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          photoUri: "https://lh3.googleusercontent.com/photo",
        }),
      };
    },
  );
  const props = {
    uri: "https://app.test/places/photo?maxwidth=400&photoreference=places/a/photos/b",
    thumbnail: true,
  };
  function render() {
    cursor = 0;
    tree = exports.RestaurantImage(props);
    return tree;
  }
  return {
    calls,
    slots,
    render,
    start() {
      render();
      cleanup = effect();
    },
    stop() {
      cleanup?.();
    },
    async flush() {
      for (let i = 0; i < 20; i++) await Promise.resolve();
      render();
    },
  };
}
test("direct delivery requests one 200px thumbnail and hands CDN no app credentials", async () => {
  const h = harness();
  h.start();
  await h.flush();
  assert.equal(h.calls.length, 1);
  const url = new URL(h.calls[0].url);
  assert.equal(url.searchParams.get("maxwidth"), "200");
  assert.equal(url.searchParams.get("delivery"), "url");
  assert.equal(
    h.calls[0].options.headers.Authorization,
    "Bearer private-token",
  );
  assert.deepEqual(h.slots[1], {
    uri: "https://lh3.googleusercontent.com/photo",
  });
});
test("photo URL mode remains opt-in and old native delivery still works", async () => {
  const h = harness({ direct: false });
  h.start();
  await h.flush();
  assert.equal(h.calls.length, 0);
  assert.match(h.slots[1].uri, /maxwidth=200/);
  assert.equal(h.slots[1].headers.Authorization, "Bearer private-token");
});
test("an image removed during session lookup does not start a paid photo request", async () => {
  let release;
  const h = harness({
    session: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  h.start();
  h.stop();
  release("token");
  await h.flush();
  assert.equal(h.calls.length, 0);
  assert.equal(h.slots[1], null);
});
