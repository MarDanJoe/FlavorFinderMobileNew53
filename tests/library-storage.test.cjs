const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function harness() {
  let identity = "alice";
  const calls = [];
  const client = {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            user: { id: identity },
            access_token: `${identity}-token`,
          },
        },
        error: null,
      }),
    },
    rpc(name, args) {
      identity = "bob";
      return {
        setHeader(header, value) {
          calls.push({ name, args, header, value });
          return Promise.resolve({ data: 1, error: null });
        },
      };
    },
  };
  const exports = {};
  const output = ts.transpileModule(
    fs.readFileSync("src/services/libraryStorage.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  new Function("exports", "require", output)(exports, (name) => {
    if (name === "./supabase") return { supabase: client };
    if (name === "./library") return { defaultPreferences: {} };
    if (name === "./api") return { getRestaurantById: async () => ({}) };
    if (name === "@react-native-async-storage/async-storage") return {};
    throw Error(name);
  });
  return {
    store: exports.libraryStorage("alice"),
    calls,
    setIdentity: (id) => (identity = id),
  };
}
const raw = JSON.stringify({
  favorites: [{ id: "alice-place" }],
  preferences: {},
});
test("a delayed cloud save keeps the owning account token when the current sign-in changes", async () => {
  const app = harness();
  await app.store.setItem("alice-library", raw);
  assert.equal(app.calls[0].header, "Authorization");
  assert.equal(app.calls[0].value, "Bearer alice-token");
  assert.deepEqual(app.calls[0].args.ids, ["alice-place"]);
});
test("queued saves from an old account fail before sending a write under the new account", async () => {
  const app = harness();
  app.setIdentity("bob");
  await assert.rejects(
    app.store.setItem("alice-library", raw),
    /account changed/,
  );
  assert.equal(app.calls.length, 0);
});
