const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function moduleAt(path, modules, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function("exports", "require", "process", "fetch", source)(
    exports,
    (name) => {
      if (name in modules) return modules[name];
      throw Error(name);
    },
    globals.process ?? process,
    globals.fetch ?? fetch,
  );
  return exports;
}
test("loading saved IDs at startup makes no provider calls; opening Saved explicitly resolves details", async () => {
  const calls = [];
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  const raw = JSON.stringify({ place_ids: ids, preferences: { rating: 0 } });
  const mod = moduleAt("src/services/libraryStorage.ts", {
    "./supabase": { supabase: null },
    "./library": { defaultPreferences: {} },
    "./api": {
      getRestaurantById: async (id) => {
        calls.push(id);
        return { id, name: id };
      },
    },
    "@react-native-async-storage/async-storage": {
      getItem: async () => raw,
      setItem: async () => {},
    },
  });
  const startup = JSON.parse(await mod.libraryStorage().getItem("guest"));
  assert.deepEqual(calls, []);
  assert.deepEqual(
    startup.favorites.map((r) => r.id),
    ids,
  );
  const opened = JSON.parse(
    await mod.libraryStorage(undefined, true).getItem("guest"),
  );
  assert.deepEqual(calls, ids.slice(0, 3));
  const more = JSON.parse(
    await mod
      .libraryStorage(undefined, true, 6, opened.favorites)
      .getItem("guest"),
  );
  assert.deepEqual(calls, ids.slice(0, 6));
  assert.equal(more.favorites[6].name, "Saved restaurant · tap for details");
  assert.equal(opened.favorites[0].name, "a");
});
test("simultaneous place detail consumers share one request; later calls and failed retries are fresh", async () => {
  const calls = [];
  let release;
  const data = {
    status: "OK",
    result: {
      name: "A",
      rating: 4,
      geometry: { location: { lat: 40, lng: -80 } },
    },
  };
  let fail = false;
  const mod = moduleAt("src/services/api.ts", {
    "./supabase": {
      placesFetch: (path) => {
        calls.push(path);
        return new Promise((resolve, reject) => {
          release = () => (fail ? reject(Error("network")) : resolve(data));
        });
      },
    },
    "../config/demo": { DEMO_MODE: false },
    "../config/demoData": {},
    "../config/env": {
      ENV: { API: { BASE_URL: "https://example.invalid/places" } },
    },
  });
  const a = mod.getRestaurantById("a", true),
    b = mod.getRestaurantById("a", true);
  assert.equal(calls.length, 1);
  release();
  assert.equal((await a).name, "A");
  await b;
  fail = true;
  const c = mod.getRestaurantById("a", true);
  assert.equal(calls.length, 2);
  release();
  await assert.rejects(c, /network/);
  fail = false;
  const d = mod.getRestaurantById("a", true);
  assert.equal(calls.length, 3);
  release();
  await d;
  assert.ok(calls.every((path) => !path.includes("reviews")));
});

test("daily cap error explains exhaustion and reset without retrying a billable request", async () => {
  let calls = 0;
  const mod = moduleAt(
    "src/services/supabase.ts",
    {
      "./secureSessionStorage": {},
      "expo-crypto": {},
      "react-native-url-polyfill/auto": {},
      "@supabase/supabase-js": {},
      "expo-secure-store": {},
      "@react-native-async-storage/async-storage": {},
      "react-native": { Platform: { OS: "web" } },
    },
    {
      process: { env: {} },
      fetch: async () => {
        calls++;
        return {
          status: 429,
          ok: false,
          json: async () => ({
            error_message:
              "Daily discovery limit reached. Please try again later.",
          }),
        };
      },
    },
  );
  await assert.rejects(
    mod.placesFetch("nearbysearch/json"),
    /shared discovery limit.*Try again after/,
  );
  assert.equal(calls, 1);
});

test("partial Saved failures preserve IDs and successful rows without automatic retries", async () => {
  const calls = [];
  const mod = moduleAt("src/services/libraryStorage.ts", {
    "./supabase": { supabase: null },
    "./library": { defaultPreferences: {} },
    "./api": {
      getRestaurantById: async (id) => {
        calls.push(id);
        if (id === "b") throw Error("Daily limit");
        return { id, name: id };
      },
    },
    "@react-native-async-storage/async-storage": {
      getItem: async () =>
        JSON.stringify({ place_ids: ["a", "b", "c", "d"], preferences: {} }),
      setItem: async () => {},
    },
  });
  const loaded = JSON.parse(
    await mod.libraryStorage(undefined, true).getItem("guest"),
  );
  assert.deepEqual(calls, ["a", "b", "c"]);
  assert.deepEqual(
    loaded.favorites.map((r) => r.id),
    ["a", "b", "c", "d"],
  );
  assert.equal(loaded.favorites[1].saved_details_unavailable, true);
  assert.equal(loaded.favorites[0].name, "a");
  await mod
    .libraryStorage(undefined, true, 3, loaded.favorites)
    .getItem("guest");
  assert.deepEqual(calls, ["a", "b", "c", "b"]);
});

test("city lookup rejects invalid provider coordinates instead of searching a wrong area", async () => {
  let location;
  const mod = moduleAt("src/services/api.ts", {
    "./supabase": {
      placesFetch: async () => ({
        result: { location, formattedAddress: "City" },
      }),
    },
    "../config/demo": { DEMO_MODE: false },
    "../config/demoData": {},
    "../config/env": {
      ENV: { API: { BASE_URL: "https://example.invalid/places" } },
    },
  });
  for (location of [
    { latitude: "40", longitude: -74 },
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: NaN },
    { latitude: 0 },
  ]) {
    await assert.rejects(
      mod.findSearchLocation("City"),
      /location|coordinates/i,
    );
  }
  location = { latitude: 0, longitude: 0 };
  assert.deepEqual(await mod.findSearchLocation("City"), {
    latitude: 0,
    longitude: 0,
    label: "City",
  });
});

test("restaurant details reject malformed geometry and expose a controlled error", async () => {
  const mod = moduleAt("src/services/api.ts", {
    "./supabase": {
      placesFetch: async () => ({
        status: "OK",
        result: {
          name: "Cafe",
          geometry: { location: { lat: 40, lng: "bad" } },
        },
      }),
    },
    "../config/demo": { DEMO_MODE: false },
    "../config/demoData": {},
    "../config/env": {
      ENV: { API: { BASE_URL: "https://example.invalid/places" } },
    },
  });
  await assert.rejects(mod.getRestaurantById("a"), /coordinates/i);
});
