const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { validateRelease } = require("../scripts/release-config.cjs");
function load(path) {
  const out = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports: out, Promise, Array, JSON, Number, Error, URLSearchParams },
  );
  return out;
}
const { secureSessionStorage } = load("src/services/secureSessionStorage.ts");
function keychain() {
  const data = new Map();
  let failing = false;
  return {
    data,
    fail: () => {
      failing = true;
    },
    recover: () => {
      failing = false;
    },
    getItemAsync: async (k) => data.get(k) ?? null,
    setItemAsync: async (k, v) => {
      if (failing && k.endsWith(".1")) throw new Error("Disk full");
      assert.ok(Buffer.byteLength(v) <= 2048);
      data.set(k, v);
    },
    deleteItemAsync: async (k) => {
      data.delete(k);
    },
  };
}
test("large native sessions round-trip without exceeding small keychain items", async () => {
  const k = keychain();
  const store = secureSessionStorage(k, () => "one");
  const session = JSON.stringify({
    token: "abc".repeat(3000),
    username: "🍔".repeat(500),
  });
  await store.setItem("session", session);
  assert.equal(await store.getItem("session"), session);
  await store.removeItem("session");
  assert.equal(await store.getItem("session"), null);
  assert.equal(k.data.size, 0);
});
test("failed session replacement leaves the previous session intact", async () => {
  const k = keychain();
  let i = 0;
  const store = secureSessionStorage(k, () => `id-${++i}`);
  await store.setItem("session", "previous");
  k.fail();
  await assert.rejects(store.setItem("session", "x".repeat(1000)), /Disk full/);
  assert.equal(await store.getItem("session"), "previous");
  assert.equal(k.data.size, 2);
});
test("concurrent session writes are serialized and obsolete secrets are removed", async () => {
  const k = keychain();
  let i = 0;
  const store = secureSessionStorage(k, () => `id-${++i}`);
  await Promise.all([
    store.setItem("session", "first"),
    store.setItem("session", "second"),
  ]);
  assert.equal(await store.getItem("session"), "second");
  assert.equal(k.data.size, 2);
});
test("incomplete keychain sessions cannot be mistaken for authenticated sessions", async () => {
  const k = keychain();
  const store = secureSessionStorage(k, () => "one");
  await store.setItem("session", "x".repeat(600));
  k.data.delete("session.one.1");
  await assert.rejects(store.getItem("session"), /Incomplete/);
});
const config = () => ({
  EXPO_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
  EXPO_PUBLIC_PRIVACY_URL: "https://flavorfinder.app/privacy",
  EXPO_PUBLIC_TERMS_URL: "https://flavorfinder.app/terms",
  EXPO_PUBLIC_SUPPORT_URL: "https://flavorfinder.app/support",
  IOS_BUNDLE_IDENTIFIER: "com.owner.flavorfinder",
  EAS_PROJECT_ID: "12345678-1234-1234-1234-123456789012",
});
test("release guard rejects preview mode, localhost, missing configuration and server keys", () => {
  assert.ok(validateRelease({}).length >= 7);
  assert.equal(validateRelease(config()).length, 0);
  assert.ok(
    validateRelease({ ...config(), EXPO_PUBLIC_DEMO_MODE: "true" }).some((e) =>
      e.includes("Demo"),
    ),
  );
  assert.ok(
    validateRelease({
      ...config(),
      EXPO_PUBLIC_PLACES_API_URL: "http://localhost:8082/places",
    }).length,
  );
  assert.ok(
    validateRelease({
      ...config(),
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_123",
    }).length,
  );
  const secretJwt = `a.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.b`;
  assert.ok(
    validateRelease({
      ...config(),
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secretJwt,
    }).some((e) => e.includes("Only an anon")),
  );
});
const provider = load("supabase/functions/places/provider.ts");
test("Places New adapter validates coordinates and restricts photo resources", () => {
  assert.throws(
    () =>
      provider.searchRequest(new URLSearchParams("location=91,0&radius=100")),
    /Invalid/,
  );
  assert.throws(
    () => provider.searchRequest(new URLSearchParams("location=,0&radius=100")),
    /Invalid/,
  );
  assert.throws(
    () =>
      provider.photoResource(
        new URLSearchParams("photoreference=https://evil.test/secret"),
      ),
    /Invalid/,
  );
  assert.throws(
    () =>
      provider.photoResource(
        new URLSearchParams(
          "photoreference=places/id/photos/ref&maxwidth=9000",
        ),
      ),
    /Invalid/,
  );
  const request = provider.searchRequest(
    new URLSearchParams(
      "location=40,-74&radius=1000&keyword=tacos&opennow=true",
    ),
  );
  assert.equal(request.endpoint, "places:searchText");
  assert.equal(request.body.openNow, true);
  assert.equal(request.body.textQuery, "tacos restaurants");
  assert.equal(
    provider.photoResource(
      new URLSearchParams("photoreference=places/id/photos/ref"),
    ),
    "places/id/photos/ref/media?maxWidthPx=400",
  );
});
test("Places New adapter preserves author and source links and requests reviews only for details", () => {
  const value = provider.normalizePlace({
    id: "place",
    displayName: { text: "Tacos" },
    location: { latitude: 40, longitude: -74 },
    priceLevel: "PRICE_LEVEL_MODERATE",
    photos: [
      {
        name: "places/place/photos/image",
        googleMapsUri: "https://maps.google.com/photo",
        authorAttributions: [
          {
            displayName: "Photographer",
            uri: "https://maps.google.com/author",
          },
        ],
      },
    ],
    reviews: [
      {
        authorAttribution: {
          displayName: "Reviewer",
          photoUri: "https://avatar.test/pic",
        },
        googleMapsUri: "https://maps.google.com/review",
        text: { text: "Great" },
      },
    ],
  });
  assert.equal(value.price_level, 2);
  assert.equal(
    value.photos[0].author_attributions[0].sourceUri,
    "https://maps.google.com/photo",
  );
  assert.equal(value.reviews[0].author_photo, "https://avatar.test/pic");
  assert.equal(
    provider
      .detailMask(new URLSearchParams("fields=name,rating"))
      .includes("reviews"),
    false,
  );
  assert.equal(
    provider
      .detailMask(new URLSearchParams("fields=name,reviews"))
      .includes("reviews"),
    true,
  );
});

test("Places credits survive authorless photos and France review visit dates", () => {
  const value = provider.normalizePlace({
    id: "place",
    attributions: [
      { provider: "Data provider", providerUri: "https://provider.test" },
    ],
    photos: [
      {
        name: "places/place/photos/image",
        googleMapsUri: "https://maps.google.com/photo",
        authorAttributions: [],
      },
    ],
    reviews: [
      {
        visitDate: { year: 2026, month: 9 },
        googleMapsUri: "https://maps.google.com/review",
      },
    ],
  });
  assert.equal(value.photos[0].source_uri, "https://maps.google.com/photo");
  assert.equal(value.photos[0].author_attributions.length, 0);
  assert.equal(value.provider_attributions[0].provider, "Data provider");
  assert.deepEqual(value.reviews[0].visit_date, { year: 2026, month: 9 });
  assert.ok(
    provider.detailMask(new URLSearchParams()).includes("attributions"),
  );
});
