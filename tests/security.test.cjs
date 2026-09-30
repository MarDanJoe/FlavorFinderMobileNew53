const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const crypto = require("node:crypto");
const { validate } = require("../server/places.cjs");
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/services/passwords.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  {
    exports: exportsObject,
    require: (name) =>
      name === "expo-crypto"
        ? {
            getRandomBytesAsync: async (size) =>
              new Uint8Array(crypto.randomBytes(size)),
          }
        : require(name),
  },
);

test("password storage uses distinct salts and verifies the correct password", async () => {
  const a = await exportsObject.hashPassword("unique-password-123");
  const b = await exportsObject.hashPassword("unique-password-123");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.equal(
    await exportsObject.verifyPassword("unique-password-123", a),
    true,
  );
  assert.equal(await exportsObject.verifyPassword("wrong-password", a), false);
  assert.equal(JSON.stringify(a).includes("unique-password-123"), false);
});

test("malformed password digests are rejected", async () => {
  assert.equal(
    await exportsObject.verifyPassword("anything", {
      salt: "bad",
      hash: "bad",
      iterations: 1,
    }),
    false,
  );
});

test("Places proxy restricts endpoint, location, radius and fields", () => {
  const url = (route) => new URL(route, "http://localhost");
  assert.throws(() => validate(url("/places/arbitrary")), /Unknown/);
  assert.throws(
    () =>
      validate(url("/places/nearbysearch/json?location=100,20&radius=5000")),
    /location/,
  );
  assert.throws(
    () =>
      validate(url("/places/nearbysearch/json?location=40,-74&radius=100000")),
    /distance/,
  );
  assert.throws(
    () => validate(url("/places/details/json?place_id=test&fields=unknown")),
    /field/,
  );
  const valid = validate(
    url(
      "/places/nearbysearch/json?location=40,-74&radius=5000&keyword=tacos&opennow=true&key=attacker",
    ),
  );
  assert.equal(valid.hostname, "maps.googleapis.com");
  assert.equal(valid.searchParams.get("key"), null);
  assert.equal(valid.searchParams.get("keyword"), "tacos");
  assert.equal(valid.searchParams.get("opennow"), "true");
});

test("Places proxy validates photo sizes and does not accept arbitrary target URLs", () => {
  assert.throws(
    () =>
      validate(
        new URL(
          "http://localhost/places/photo?photoreference=test&maxwidth=999999",
        ),
      ),
    /size/,
  );
  const photo = validate(
    new URL(
      "http://localhost/places/photo?photoreference=test&maxwidth=400&url=https://evil.example",
    ),
  );
  assert.equal(photo.hostname, "maps.googleapis.com");
  assert.equal(photo.searchParams.has("url"), false);
});
