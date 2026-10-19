const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function harness({ storage } = {}) {
  let user = { id: "alice" },
    cursor = 0,
    effects = [];
  const slots = [],
    writes = [];
  const defaults = {
    radius: 8047,
    rating: 0,
    price: [],
    cuisine: "",
    openNow: false,
  };
  const react = {
    useCallback: (fn) => fn,
    createContext: () => ({ Provider: "provider" }),
    createElement: (_type, props) => props.value,
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
    useEffect(effect, deps) {
      const i = cursor++;
      if (!slots[i] || !deps.every((v, n) => Object.is(v, slots[i].deps[n]))) {
        const old = slots[i];
        slots[i] = { deps };
        effects.push(() => {
          old?.cleanup?.();
          slots[i].cleanup = effect();
        });
      }
    },
  };
  class Store {
    constructor(_storage, key) {
      this.key = key;
    }
    async load() {
      return { favorites: [{ id: this.key }], preferences: defaults };
    }
    async mutate(update) {
      writes.push(this.key);
      return update({ favorites: [], preferences: defaults });
    }
  }
  const realLibrary = {};
  new Function(
    "exports",
    ts.transpileModule(fs.readFileSync("src/services/library.ts", "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(realLibrary);
  const output = ts.transpileModule(
    fs.readFileSync("src/contexts/LibraryContext.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports = {};
  new Function("exports", "require", output)(exports, (name) => {
    if (name === "react") return react;
    if (name === "./AuthContext") return { useAuth: () => ({ user }) };
    if (name === "../config/demo") return { DEMO_MODE: false };
    if (name === "../services/library")
      return storage
        ? realLibrary
        : { PersistentLibrary: Store, defaultPreferences: defaults };
    if (name === "../services/libraryStorage")
      return { libraryStorage: () => storage ?? {} };
    if (name === "@react-native-async-storage/async-storage") return {};
    throw Error(name);
  });
  return {
    render() {
      cursor = 0;
      return exports.LibraryProvider({ children: null });
    },
    async flush() {
      const pending = effects;
      effects = [];
      pending.forEach((f) => f());
      for (let i = 0; i < 30; i++) await Promise.resolve();
    },
    setUser: (value) => (user = value),
    writes,
    startEffects() {
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    },
  };
}
test("account switch hides old favorites before effects run and blocks writes to the previous account", async () => {
  const app = harness();
  app.render();
  await app.flush();
  const alice = app.render();
  assert.equal(alice.ready, true);
  assert.match(alice.favorites[0].id, /alice/);
  app.setUser({ id: "bob" });
  const beforeEffects = app.render();
  assert.deepEqual(beforeEffects.favorites, []);
  assert.equal(beforeEffects.ready, false);
  await assert.rejects(beforeEffects.save({ id: "wrong-account" }), /loading/);
  await assert.rejects(alice.save({ id: "stale-callback" }), /loading/);
  assert.equal(app.writes.length, 0);
  await app.flush();
  const bob = app.render();
  assert.equal(bob.ready, true);
  assert.match(bob.favorites[0].id, /bob/);
  await bob.save({ id: "bob-place" });
  assert.deepEqual(app.writes, ["flavorfinder:library:bob"]);
});
test("signing out hides the registered library immediately and loads only guest storage", async () => {
  const app = harness();
  app.render();
  await app.flush();
  app.render();
  app.setUser(null);
  const signingOut = app.render();
  assert.deepEqual(signingOut.favorites, []);
  assert.equal(signingOut.ready, false);
  await app.flush();
  const guest = app.render();
  assert.match(guest.favorites[0].id, /guest/);
});

test("opening Saved preserves discovery preferences and search readiness during hydration", async () => {
  const app = harness();
  assert.equal(app.render().searchReady, false);
  await app.flush();
  let library = app.render();
  assert.equal(library.searchReady, true);
  await library.updatePreferences({ ...library.preferences, cuisine: "tacos" });
  library = app.render();
  library.loadSavedDetails();
  app.render();
  app.startEffects();
  library = app.render();
  assert.equal(library.preferences.cuisine, "tacos");
  assert.equal(library.searchReady, true);
  assert.equal(library.ready, false);
});

test("Saved hydration waits for an in-flight save and preserves it across consecutive reloads", async () => {
  let raw = null,
    release;
  const storage = {
    getItem: async () => raw,
    setItem: async (_key, value) => {
      await new Promise((resolve) => {
        release = resolve;
      });
      raw = value;
    },
  };
  const app = harness({ storage });
  app.render();
  await app.flush();
  let library = app.render();
  const save = library.save({
    id: "new-save",
    name: "Cafe",
    rating: 4,
    distance: 0,
    categories: [],
    location: {},
  });
  await Promise.resolve();
  library.loadSavedDetails();
  app.render();
  await app.flush();
  library = app.render();
  library.reload();
  app.render();
  await app.flush();
  release();
  await save;
  await app.flush();
  library = app.render();
  assert.equal(library.ready, true);
  assert.deepEqual(
    library.favorites.map((r) => r.id),
    ["new-save"],
  );
});
