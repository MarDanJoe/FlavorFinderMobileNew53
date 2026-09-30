const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");

// Exercise the hook with deterministic location, API responses, and hook scheduling.
function harness(search, permission = "granted") {
  const slots = [];
  const locationTimers = new Map();
  let timerId = 0;
  let cursor = 0,
    effects = [],
    dirty = true,
    output;
  let params = { rating: 0, price: [] };
  const same = (a, b) =>
    a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: initial };
      return [
        slots[i].value,
        (value) => {
          slots[i].value =
            typeof value === "function" ? value(slots[i].value) : value;
          dirty = true;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ||= { current: initial });
    },
    useCallback(callback, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) slots[i] = { value: callback, deps };
      return slots[i].value;
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) {
        const old = slots[i];
        slots[i] = { deps };
        effects.push(() => {
          old?.cleanup?.();
          slots[i].cleanup = effect();
        });
      }
    },
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/hooks/useRestaurants.ts", "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    console,
    clearTimeout: (id) => locationTimers.delete(id),
    setTimeout: (callback, delay) => {
      const id = ++timerId;
      if (delay < 20000) callback();
      else locationTimers.set(id, callback);
      return id;
    },
    require(name) {
      if (name === "../config/demo") return { DEMO_MODE: false };
      if (name === "react") return react;
      if (name === "expo-location")
        return {
          requestForegroundPermissionsAsync: async () =>
            typeof permission === "function"
              ? permission()
              : { status: permission },
          getCurrentPositionAsync: async () => ({
            coords: { latitude: 40, longitude: -74 },
          }),
        };
      if (name === "../services/api") return { searchRestaurants: search };
      if (name === "../config/env")
        return {
          ENV: {
            API: {},
            DEFAULTS: { SEARCH_RADIUS: 5000, RESULTS_LIMIT: 20 },
          },
        };
      throw new Error(name);
    },
  });
  return {
    async flush() {
      for (let i = 0; i < 25; i++) {
        if (dirty) {
          dirty = false;
          cursor = 0;
          output = exports.useRestaurants(params);
          const pending = effects;
          effects = [];
          pending.forEach((effect) => effect());
        }
        await Promise.resolve();
      }
      return output;
    },
    expireLocation() {
      for (const callback of locationTimers.values()) callback();
      locationTimers.clear();
    },
    filters(value) {
      params = value;
      dirty = true;
    },
  };
}
const place = (id, rating = 4, price = 2) => ({
  place_id: id,
  name: id,
  rating,
  price_level: price,
  geometry: { location: { lat: 40, lng: -74 } },
});

test("location denial clears loading without requesting restaurants", async () => {
  let requests = 0;
  const app = harness(async () => {
    requests++;
  }, "denied");
  const result = await app.flush();
  assert.equal(result.loading, false);
  assert.match(result.error, /denied/);
  assert.equal(requests, 0);
});

test("filter changes replace the results and reset the card index", async () => {
  let requests = 0;
  const app = harness(async () => {
    requests++;
    return { results: [place("a", 3), place("b", 5)] };
  });
  let result = await app.flush();
  assert.equal(result.currentRestaurant.id, "a");
  result.nextRestaurant();
  result = await app.flush();
  assert.equal(result.currentRestaurant.id, "b");
  app.filters({ rating: 4.5, price: ["$$"] });
  result = await app.flush();
  assert.equal(result.currentRestaurant.id, "b");
  assert.equal(requests, 2);
  assert.equal(result.error, null);
});

test("pagination skips filtered pages, deduplicates, and advances to the new card", async () => {
  const app = harness(async ({ pageToken }) =>
    pageToken === "next"
      ? { results: [place("a"), place("b")] }
      : { results: [place("a")], nextPageToken: "next" },
  );
  let result = await app.flush();
  result.nextRestaurant();
  result = await app.flush();
  assert.equal(result.currentRestaurant.id, "b");
  result.nextRestaurant();
  result = await app.flush();
  assert.equal(result.currentRestaurant, undefined);
  assert.match(result.error, /all matching/);
});

test("a late response from previous filters cannot overwrite the new results", async () => {
  let resolveOld,
    calls = 0;
  const app = harness(() =>
    ++calls === 1
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve({ results: [place("new", 5)] }),
  );
  await app.flush();
  app.filters({ rating: 4.5, price: [] });
  let result = await app.flush();
  assert.equal(result.currentRestaurant.id, "new");
  resolveOld({ results: [place("old")] });
  result = await app.flush();
  assert.equal(result.currentRestaurant.id, "new");
});

test("undo returns to the previous discovery without a new request", async () => {
  let requests = 0;
  const app = harness(async () => {
    requests++;
    return { results: [place("a"), place("b")] };
  });
  let result = await app.flush();
  result.nextRestaurant();
  result = await app.flush();
  assert.equal(result.currentRestaurant.id, "b");
  result.previousRestaurant();
  result = await app.flush();
  assert.equal(result.currentRestaurant.id, "a");
  assert.equal(requests, 1);
});

test("cuisine and open-now changes reach the actual search request", async () => {
  const received = [];
  const app = harness(async (params) => {
    received.push(params);
    return { results: [place("a")] };
  });
  await app.flush();
  app.filters({
    rating: 0,
    price: [],
    radius: 1609,
    cuisine: "tacos",
    openNow: true,
  });
  await app.flush();
  assert.equal(received.at(-1).keyword, "tacos");
  assert.equal(received.at(-1).openNow, true);
  assert.equal(received.at(-1).radius, 1609);
});

test("a first page excluded by rating still reaches matching later pages", async () => {
  const app = harness(async ({ pageToken }) =>
    pageToken
      ? { results: [place("match", 5)] }
      : { results: [place("excluded", 2)], nextPageToken: "later" },
  );
  app.filters({ rating: 4, price: [] });
  const result = await app.flush();
  assert.equal(result.currentRestaurant.id, "match");
  assert.equal(result.error, null);
});

test("unanswered location permission times out and manual city search still loads", async () => {
  let requests = 0;
  const app = harness(
    async () => {
      requests++;
      return { results: [place("manual-city")] };
    },
    () => new Promise(() => {}),
  );
  assert.equal((await app.flush()).loading, true);
  app.expireLocation();
  let result = await app.flush();
  assert.equal(result.loading, false);
  assert.match(result.error, /Choose a city/);
  assert.equal(requests, 0);
  app.filters({
    rating: 0,
    price: [],
    searchLocation: { latitude: 40, longitude: -74 },
  });
  result = await app.flush();
  assert.equal(result.currentRestaurant.id, "manual-city");
  assert.equal(result.error, null);
  assert.equal(requests, 1);
});
