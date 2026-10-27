const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function harness() {
  const slots = [],
    saved = [],
    animations = [];
  let cursor = 0,
    index = 0,
    failSave = false;
  const restaurant = (id) => ({
    id,
    name: id,
    image_url: "",
    rating: 4,
    categories: [],
    location: { address1: "Main St" },
    distance: 1,
  });
  const places = ["a", "b", "c"].map(restaurant);
  const react = {
    createElement: (type, props, ...children) => ({
      type,
      props: props || {},
      children,
    }),
    useState(initial) {
      const i = cursor++;
      slots[i] ||= { value: initial };
      return [
        slots[i].value,
        (v) =>
          (slots[i].value = typeof v === "function" ? v(slots[i].value) : v),
      ];
    },
    useRef(initial) {
      return (slots[cursor++] ||= { current: initial });
    },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !deps.every((v, n) => Object.is(v, slots[i].deps[n])))
        slots[i] = { value: fn(), deps };
      return slots[i].value;
    },
  };
  class Value {
    constructor(v) {
      this.value = v;
    }
    setValue(v) {
      this.value = v;
    }
    interpolate() {
      return this;
    }
  }
  const native = {
    View: "View",
    Text: "Text",
    TouchableOpacity: "Button",
    ScrollView: "Scroll",
    ActivityIndicator: "Spinner",
    Modal: "Modal",
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    StyleSheet: { create: (x) => x },
    PanResponder: { create: (x) => ({ panHandlers: x }) },
    Animated: {
      Value,
      View: "AnimatedCard",
      timing: (v, options) => ({
        start: (callback) => animations.push({ v, options, callback }),
      }),
      spring: (v) => ({ start: () => v.setValue(0) }),
    },
  };
  const library = {
    ready: true,
    searchReady: true,
    preferences: { radius: 8047, cuisine: "" },
    save: async (r) => {
      if (failSave) throw Error("offline");
      saved.push(r.id);
    },
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/screens/HomeScreen.tsx", "utf8"),
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
    if (name === "react-native") return native;
    if (name === "react-native-safe-area-context")
      return { SafeAreaView: "Safe" };
    if (name === "@expo/vector-icons/Ionicons") return "Icon";
    if (name === "../hooks/useRestaurants")
      return {
        useRestaurants: () => ({
          currentRestaurant: places[index],
          restaurants: places,
          currentIndex: index,
          total: places.length,
          loading: false,
          nextRestaurant: () => index++,
        }),
      };
    if (name === "../contexts/LibraryContext")
      return { useLibrary: () => library };
    if (name === "../config/demo") return { DEMO_MODE: false };
    if (name === "../theme") return { colors: {}, layout: {} };
    return new Proxy({}, { get: (_, key) => key });
  });
  function find(tree, predicate) {
    if (!tree || typeof tree !== "object") return;
    if (predicate(tree)) return tree;
    for (const child of (tree.children || []).flat(Infinity)) {
      const found = find(child, predicate);
      if (found) return found;
    }
  }
  return {
    saved,
    animations,
    render() {
      cursor = 0;
      return exports.HomeScreen({ navigation: { navigate() {} } });
    },
    find,
    fail() {
      failSave = true;
    },
    async settle() {
      for (let i = 0; i < 6; i++) await Promise.resolve();
    },
  };
}
test("heart saves once and each following native card starts centered even if outgoing transform stays offscreen", async () => {
  const app = harness();
  for (const id of ["a", "b"]) {
    let tree = app.render();
    const card = app.find(tree, (n) => n.type === "AnimatedCard");
    assert.equal(card.props.style[1].transform[0].translateX.value, 0);
    app
      .find(tree, (n) => n.props.accessibilityLabel === "Save restaurant")
      .props.onPress();
    await app.settle();
    const animation = app.animations.at(-1);
    animation.v.setValue(animation.options.toValue);
    animation.callback({ finished: true });
    tree = app.render();
    const next = app.find(tree, (n) => n.type === "AnimatedCard");
    assert.notEqual(next.props.style[1].transform[0].translateX, animation.v);
    assert.equal(next.props.style[1].transform[0].translateX.value, 0);
    assert.equal(app.saved.at(-1), id);
  }
  assert.deepEqual(app.saved, ["a", "b"]);
});
test("failed save restores a dragged card without advancing or starting an exit animation", async () => {
  const app = harness();
  app.fail();
  const tree = app.render();
  const card = app.find(tree, (n) => n.type === "AnimatedCard");
  const position = card.props.style[1].transform[0].translateX;
  card.props.onPanResponderMove(null, { dx: 150 });
  app
    .find(tree, (n) => n.props.accessibilityLabel === "Save restaurant")
    .props.onPress();
  await app.settle();
  assert.equal(position.value, 0);
  assert.equal(app.animations.length, 0);
  assert.deepEqual(app.saved, []);
});

test("full horizontal swipe keeps card ownership and advances after its animation", async () => {
  const app = harness();
  const tree = app.render();
  const card = app.find(tree, (n) => n.type === "AnimatedCard");
  assert.equal(
    card.props.onMoveShouldSetPanResponderCapture(null, { dx: 330, dy: 8 }),
    true,
  );
  assert.equal(
    card.props.onMoveShouldSetPanResponderCapture(null, { dx: 8, dy: 330 }),
    false,
  );
  assert.equal(card.props.onPanResponderTerminationRequest(), false);
  card.props.onPanResponderMove(null, { dx: -330 });
  card.props.onPanResponderRelease(null, { dx: -330 });
  await app.settle();
  const animation = app.animations.at(-1);
  card.props.onPanResponderTerminate();
  assert.equal(animation.v.value, -330);
  animation.callback({ finished: true });
  const next = app.find(app.render(), (n) => n.type === "AnimatedCard");
  assert.equal(next.props.key, "b");
  assert.equal(next.props.style[1].transform[0].translateX.value, 0);
  assert.deepEqual(app.saved, []);
});

test("card drag locks its content scrolling until release and exit animation complete", async () => {
  const app = harness();
  let tree = app.render();
  const card = app.find(tree, (n) => n.type === "AnimatedCard");
  const page = (t) =>
    app.find(t, (n) => n.type === "Scroll" && n.props.directionalLockEnabled);
  assert.equal(page(tree).props.scrollEnabled, true);
  card.props.onPanResponderGrant();
  assert.equal(page(app.render()).props.scrollEnabled, false);
  card.props.onPanResponderRelease(null, { dx: -330 });
  await app.settle();
  assert.equal(page(app.render()).props.scrollEnabled, false);
  app.animations.at(-1).callback({ finished: true });
  assert.equal(page(app.render()).props.scrollEnabled, true);
});

test("Discover keeps branding and controls outside scrolling card content without a duplicate room shortcut", () => {
  const app = harness();
  const tree = app.render();
  const page = tree.children[0];
  assert.equal(page.type, "View");
  assert.equal(page.props.style.flex, 1);
  assert.ok(
    app.find(
      page,
      (n) => n.type === "Text" && n.children[0] === "flavorfinder",
    ),
  );
  assert.equal(
    app.find(
      tree,
      (n) =>
        n.type === "Text" &&
        n.children[0] === "Eat together · Create a voting room",
    ),
    undefined,
  );
  const frame = app.find(
    tree,
    (n) => n.props.testID === "discovery-card-frame",
  );
  assert.equal(frame.props.style.flex, 1);
  frame.props.onLayout({ nativeEvent: { layout: { height: 280 } } });
  const updated = app.render();
  const image = app.find(updated, (n) => n.type === "RestaurantImage");
  assert.equal(image.props.style.height, 106.4);
  assert.ok(
    app.find(updated, (n) => n.props.accessibilityLabel === "Save restaurant"),
  );
});

test("location editing opens above the fixed Discover layout", () => {
  const app = harness();
  let tree = app.render();
  assert.equal(app.find(tree, (n) => n.type === "Modal").props.visible, false);
  app
    .find(
      tree,
      (n) => n.props.accessibilityLabel === "Change discovery location",
    )
    .props.onPress();
  tree = app.render();
  assert.equal(app.find(tree, (n) => n.type === "Modal").props.visible, true);
});
