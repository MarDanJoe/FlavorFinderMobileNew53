const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
test("restaurant details enables Call for normalized phone and opens a clean tel URL", async () => {
  let cursor = 0;
  const slots = [],
    effects = [],
    opened = [];
  const r = {
    id: "a",
    name: "Restaurant",
    phone: "(412) 555-0123",
    rating: 4,
    categories: [],
    location: { address1: "Main" },
    coordinates: { latitude: 40, longitude: -80 },
    distance: 1,
  };
  const react = {
    createElement: (type, props, ...children) => ({
      type,
      props: props || {},
      children,
    }),
    useState(initial) {
      const i = cursor++;
      slots[i] ||= { value: initial };
      return [slots[i].value, (v) => (slots[i].value = v)];
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i]) {
        slots[i] = { deps };
        effects.push(fn);
      }
    },
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/screens/RestaurantDetailScreen.tsx", "utf8"),
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
        View: "View",
        Text: "Text",
        ScrollView: "Scroll",
        TouchableOpacity: "Button",
        StyleSheet: { create: (x) => x },
        Linking: { openURL: async (u) => opened.push(u) },
      };
    if (name === "../services/api") return { getRestaurantById: async () => r };
    if (name === "../contexts/LibraryContext")
      return { useLibrary: () => ({ favorites: [] }) };
    if (name === "../config/demo") return { DEMO_MODE: false };
    if (name === "../theme") return { colors: {}, layout: {} };
    return new Proxy({}, { get: (_, k) => k });
  });
  const render = () => {
    cursor = 0;
    return exports.RestaurantDetailScreen({
      route: { params: { id: "a" } },
      navigation: {},
    });
  };
  function find(t) {
    if (!t || typeof t !== "object") return;
    if (t.props?.accessibilityLabel === "Call") return t;
    for (const child of (t.children || []).flat(Infinity)) {
      const found = find(child);
      if (found) return found;
    }
  }
  render();
  effects.forEach((fn) => fn());
  for (let i = 0; i < 8; i++) await Promise.resolve();
  const call = find(render());
  assert.equal(call.props.disabled, false);
  await call.props.onPress();
  assert.deepEqual(opened, ["tel:4125550123"]);
});
