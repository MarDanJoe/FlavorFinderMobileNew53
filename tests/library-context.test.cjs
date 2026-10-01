const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function harness() {
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
      return { PersistentLibrary: Store, defaultPreferences: defaults };
    if (name === "../services/libraryStorage")
      return { libraryStorage: () => ({}) };
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
      for (let i = 0; i < 5; i++) await Promise.resolve();
    },
    setUser: (value) => (user = value),
    writes,
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
