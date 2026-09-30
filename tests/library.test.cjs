const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/services/library.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: exportsObject },
);
const { PersistentLibrary, parseLibrary } = exportsObject;
const restaurant = (id) => ({
  id,
  name: id,
  rating: 4,
  distance: 0,
  location: {},
  categories: [],
});
function storage() {
  const map = new Map();
  return {
    map,
    getItem: async (key) => map.get(key) || null,
    setItem: async (key, data) => {
      map.set(key, data);
    },
  };
}
test("concurrent saves are serialized without dropping restaurants", async () => {
  const store = new PersistentLibrary(storage(), "a");
  await store.load();
  await Promise.all(
    ["one", "two"].map((id) =>
      store.mutate((data) => ({
        ...data,
        favorites: [...data.favorites, restaurant(id)],
      })),
    ),
  );
  assert.equal(store.data.favorites.map((r) => r.id).join(","), "one,two");
});
test("failed writes preserve the last persisted library", async () => {
  const io = storage();
  const store = new PersistentLibrary(io, "a");
  await store.load();
  io.setItem = async () => {
    throw new Error("disk unavailable");
  };
  await assert.rejects(
    store.mutate((data) => ({ ...data, favorites: [restaurant("lost")] })),
  );
  assert.equal(store.data.favorites.length, 0);
});
test("accounts have separate libraries and preferences survive reload", async () => {
  const io = storage();
  const first = new PersistentLibrary(io, "first");
  await first.load();
  await first.mutate((data) => ({
    favorites: [restaurant("one")],
    preferences: { ...data.preferences, radius: 1609, cuisine: "pizza" },
  }));
  const second = new PersistentLibrary(io, "second");
  await second.load();
  assert.equal(second.data.favorites.length, 0);
  const restored = new PersistentLibrary(io, "first");
  await restored.load();
  assert.equal(restored.data.favorites[0].id, "one");
  assert.equal(restored.data.preferences.cuisine, "pizza");
});
test("corrupt storage is not silently overwritten and invalid preferences are normalized", async () => {
  const io = storage();
  io.map.set("a", "broken");
  const store = new PersistentLibrary(io, "a");
  await assert.rejects(store.load());
  await assert.rejects(store.mutate((data) => data));
  assert.equal(io.map.get("a"), "broken");
  const data = parseLibrary(
    JSON.stringify({
      favorites: [],
      preferences: {
        radius: -1,
        rating: 100,
        price: ["invalid"],
        openNow: "false",
      },
    }),
  );
  assert.equal(data.preferences.radius, 8047);
  assert.equal(data.preferences.rating, 0);
  assert.equal(data.preferences.price.length, 0);
  assert.equal(data.preferences.openNow, false);
});
