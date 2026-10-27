const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function harness(file, seeded = []) {
  let cursor = 0,
    tree,
    pan;
  const slots = seeded.map((value) => ({ value })),
    actions = [],
    navigationCalls = [],
    searches = [];
  const defaults = {
    radius: 8047,
    rating: 0,
    cuisine: "",
    price: [],
    openNow: false,
  };
  const react = {
    createElement: (type, props, ...children) => ({
      type,
      props: props || {},
      children,
    }),
    useState(initial) {
      const i = cursor++;
      slots[i] ||= {
        value: typeof initial === "function" ? initial() : initial,
      };
      return [
        slots[i].value,
        (v) =>
          (slots[i].value = typeof v === "function" ? v(slots[i].value) : v),
      ];
    },
    useRef(initial) {
      return (slots[cursor++] ||= { current: initial });
    },
    useEffect: () => {},
    useCallback: (fn) => fn,
  };
  class Value {
    constructor(v) {
      this.value = v;
    }
    setValue(v) {
      this.value = v;
    }
  }
  const native = {
    ActivityIndicator: "ActivityIndicator",
    Modal: "Modal",
    ScrollView: "ScrollView",
    Text: "Text",
    TouchableOpacity: "Button",
    View: "View",
    TextInput: "TextInput",
    Switch: "Switch",
    StyleSheet: { create: (v) => v },
    AppState: { currentState: "active" },
    Share: { share: async () => {} },
    Animated: {
      Value,
      View: "Card",
      spring: (p) => ({ start: () => p.setValue(0) }),
    },
    PanResponder: {
      create: (handlers) => {
        pan = handlers;
        return { panHandlers: handlers };
      },
    },
  };
  const navigation = {
    navigate: (...args) => navigationCalls.push(["navigate", ...args]),
    replace: (...args) => navigationCalls.push(["replace", ...args]),
    goBack: () => navigationCalls.push(["back"]),
  };
  const libraryExports = {};
  new Function(
    "exports",
    ts.transpileModule(fs.readFileSync("src/services/library.ts", "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(libraryExports);
  const modules = {
    react,
    "react-native": native,
    "react-native-safe-area-context": { SafeAreaView: "Safe" },
    "@react-navigation/native": { useIsFocused: () => true },
    "../theme": { colors: {}, layout: {} },
    "../services/library": { ...libraryExports, defaultPreferences: defaults },
    "../contexts/LibraryContext": {
      ...libraryExports,
      defaultPreferences: defaults,
    },
    "@expo/vector-icons/Ionicons": "Icon",
    "../components/FilterSheet": { FilterSheet: "Filters" },
    "../components/LocationPicker": { LocationPicker: "Location" },
    "../hooks/useRestaurants": {
      useRestaurants: (p) => {
        searches.push(p);
        return {
          restaurants: [
            { id: "a", name: "A" },
            { id: "b", name: "B" },
          ],
          loading: false,
          error: null,
        };
      },
    },
    "../components/RestaurantImage": { RestaurantImage: "Image" },
    "../components/GoogleAttribution": { GoogleAttribution: "Attribution" },
    "../services/supabase": { supabase: null },
    "../config/demo": { DEMO_MODE: false },
    "../services/api": {},
    "../services/rooms": {
      roomAction: async (...args) => {
        actions.push(args);
        return { ...slots[0].value, myVotes: { a: args[2]?.liked } };
      },
      newRoomCode: () => "ABC",
      rememberRoom: async () => {},
    },
  };
  const exports = {};
  new Function(
    "exports",
    "require",
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText,
  )(exports, (n) => {
    if (n in modules) return modules[n];
    throw Error(n);
  });
  function nodes(node) {
    if (arguments.length === 0) node = tree;
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap((n) => nodes(n));
    return [node, ...node.children.flatMap((n) => nodes(n))];
  }
  function text(n) {
    if (Array.isArray(n)) return n.map(text).join("");
    if (!n || typeof n !== "object") return n ?? "";
    return text(n.children);
  }
  return {
    exports,
    slots,
    actions,
    navigationCalls,
    searches,
    navigation,
    get pan() {
      return pan;
    },
    render(props = {}) {
      cursor = 0;
      return (tree = (exports.default ?? exports.FilterSheet)({
        navigation,
        ...props,
      }));
    },
    nodes,
    button(label) {
      return nodes().find((n) => n.type === "Button" && text(n) === label);
    },
    renderPreview(props) {
      cursor = 0;
      return (tree = exports.RoomDeckPreview({ navigation, ...props }));
    },
  };
}
test("voting owns horizontal gestures, locks scrolling, submits one vote and stays in the room", async () => {
  const room = {
    code: "ABC",
    status: "voting",
    deck: ["a", "b"],
    myVotes: {},
    members: [],
    isHost: true,
  };
  const card = {
    id: "a",
    name: "A",
    rating: 4,
    location: { address1: "Main" },
  };
  const h = harness("src/screens/RoomsScreen.tsx", [
    room,
    "",
    "",
    false,
    false,
    "",
    "",
    card,
  ]);
  h.render();
  assert.equal(
    h.pan.onMoveShouldSetPanResponderCapture(null, { dx: 20, dy: 2 }),
    true,
  );
  assert.equal(
    h.pan.onMoveShouldSetPanResponderCapture(null, { dx: 2, dy: 20 }),
    false,
  );
  h.pan.onPanResponderGrant();
  h.render();
  assert.equal(
    h.nodes().find((n) => n.type === "ScrollView").props.scrollEnabled,
    false,
  );
  assert.equal(h.pan.onPanResponderTerminationRequest(), false);
  h.pan.onPanResponderRelease(null, { dx: 120, dy: 0 });
  h.pan.onPanResponderRelease(null, { dx: 120, dy: 0 });
  await new Promise((resolve) => setImmediate(resolve));
  h.render();
  assert.deepEqual(h.actions, [["vote", "ABC", { place: "a", liked: true }]]);
  assert.equal(
    h.nodes().find((n) => n.type === "ScrollView").props.scrollEnabled,
    true,
  );
  assert.deepEqual(h.navigationCalls, []);
});
test("cancelled or vertical voting drags do not cast a vote", () => {
  const h = harness("src/screens/RoomsScreen.tsx", [
    { status: "voting", deck: ["a"], myVotes: {}, members: [] },
    "",
    "",
    false,
    false,
    "",
    "",
    { id: "a", name: "A", rating: 4, location: { address1: "" } },
  ]);
  h.render();
  h.pan.onPanResponderGrant();
  h.pan.onPanResponderTerminate();
  h.render();
  assert.equal(
    h.nodes().find((n) => n.type === "ScrollView").props.scrollEnabled,
    true,
  );
  assert.deepEqual(h.actions, []);
});
test("room setup starts independent, waits for explicit search, and confirms its own filters and area", () => {
  const h = harness("src/screens/RoomSetupScreen.tsx");
  h.render();
  assert.equal(h.searches.length, 0);
  assert.equal(
    h.nodes().find((n) => n.type === "Filters").props.value.cuisine,
    "",
  );
  h.nodes()
    .find((n) => n.type === "Filters")
    .props.onApply({
      radius: 16093,
      rating: 4,
      cuisine: "pizza",
      sort: "rating",
      price: ["$$"],
      openNow: true,
    });
  h.render();
  h.nodes()
    .find((n) => n.type === "Location")
    .props.onSelect({ latitude: 40, longitude: -80, label: "Group town" });
  h.render();
  h.button("Find restaurants for this room").props.onPress();
  h.render();
  const preview = h.nodes().find((n) => n.type === h.exports.RoomDeckPreview);
  assert.equal(preview.props.search.preferences.cuisine, "pizza");
  h.renderPreview({ search: preview.props.search });
  assert.deepEqual(h.searches[0], {
    radius: 16093,
    rating: 4,
    cuisine: "pizza",
    sort: "rating",
    price: ["$$"],
    openNow: true,
    searchLocation: { latitude: 40, longitude: -80, label: "Group town" },
  });
  h.button("Use this deck & continue").props.onPress();
  assert.deepEqual(h.navigationCalls[0].slice(0, 2), ["replace", "Room"]);
  assert.deepEqual(h.navigationCalls[0][2].deck, ["a", "b"]);
  assert.match(
    h.navigationCalls[0][2].searchSummary,
    /Group town.*10 miles.*pizza.*Highest rated/,
  );
});

test("left swipe casts pass and missing cards cannot claim a voting drag", async () => {
  const room = {
    code: "ABC",
    status: "voting",
    deck: ["a"],
    myVotes: {},
    members: [],
  };
  const h = harness("src/screens/RoomsScreen.tsx", [
    room,
    "",
    "",
    false,
    false,
    "",
    "",
    { id: "a", name: "A", rating: 4, location: { address1: "" } },
  ]);
  h.render();
  h.pan.onPanResponderRelease(null, { dx: -120, dy: 0 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(h.actions, [["vote", "ABC", { place: "a", liked: false }]]);
  h.slots[7].value = null;
  h.render();
  assert.equal(
    h.pan.onMoveShouldSetPanResponder(null, { dx: 120, dy: 0 }),
    false,
  );
});

test("room filter sheet offers cuisine and applies it with the other room settings", () => {
  const h = harness("src/components/FilterSheet.tsx");
  let applied;
  const props = {
    visible: true,
    value: {
      radius: 16093,
      rating: 4,
      cuisine: "",
      price: ["$$"],
      openNow: true,
    },
    onClose() {},
    onApply: (p) => {
      applied = p;
    },
  };
  h.render(props);
  assert.equal(h.button("All flavors").props.accessibilityState.selected, true);
  h.button("Japanese").props.onPress();
  h.render(props);
  assert.equal(h.button("Japanese").props.accessibilityState.selected, true);
  h.button("Find my flavor").props.onPress();
  assert.deepEqual(applied, { ...props.value, cuisine: "japanese" });
});

test("host can cancel before creating a room or return to change the search", () => {
  const h = harness("src/screens/RoomsScreen.tsx");
  h.render({ route: { params: { deck: ["a", "b"] } } });
  h.button("Back · Cancel room setup").props.onPress();
  assert.deepEqual(h.navigationCalls, [["back"]]);
  assert.deepEqual(h.actions, []);
  h.button("Change area or filters").props.onPress();
  assert.deepEqual(h.navigationCalls[1], ["replace", "RoomSetup"]);
});
