const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const source = ts.transpileModule(
  fs.readFileSync("src/services/rooms.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function harness() {
  const stored = new Map([
    ["flavorfinder_room_alice", "ABC123"],
    ["flavorfinder_room_bob", "OTHER"],
  ]);
  let identity = "alice";
  let response = {
    data: {
      code: "ABC123",
      deck: ["place1", "place2"],
      myVotes: { place1: true },
      status: "voting",
    },
    error: null,
  };
  const calls = [];
  const storage = {
    getItem: async (key) => stored.get(key) ?? null,
    removeItem: async (key) => stored.delete(key),
  };
  const client = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: identity } } },
      }),
    },
    rpc: (name, args) => {
      calls.push({ name, args });
      return {
        abortSignal: async () =>
          typeof response === "function" ? response() : response,
      };
    },
  };
  function load() {
    const exports = {};
    new Function("exports", "require", source)(exports, (name) => {
      if (name === "@react-native-async-storage/async-storage") return storage;
      if (name === "expo-crypto") return { randomUUID: () => "unused" };
      if (name === "./supabase")
        return { supabase: client, restaurantSession: async () => {} };
      throw new Error(`Unexpected module ${name}`);
    });
    return exports;
  }
  return {
    stored,
    calls,
    load,
    setResponse: (value) => (response = value),
    setIdentity: (value) => (identity = value),
  };
}
test("reopening the app restores the shared deck and only the caller's recorded votes", async () => {
  const app = harness();
  const first = await app.load().restorePreviousRoom();
  const afterRestart = await app.load().restorePreviousRoom();
  assert.deepEqual(afterRestart, first);
  assert.deepEqual(afterRestart.deck, ["place1", "place2"]);
  assert.deepEqual(afterRestart.myVotes, { place1: true });
  assert.deepEqual(
    app.calls.map((call) => call.args),
    [
      { action: "get", room_code: "ABC123" },
      { action: "get", room_code: "ABC123" },
    ],
  );
});
test("a connection failure retains membership and a later retry resumes it", async () => {
  const app = harness();
  app.setResponse({ data: null, error: { message: "Network unavailable" } });
  await assert.rejects(app.load().restorePreviousRoom(), /Network unavailable/);
  assert.equal(app.stored.get("flavorfinder_room_alice"), "ABC123");
  app.setResponse({
    data: { code: "ABC123", myVotes: { place1: false } },
    error: null,
  });
  assert.equal((await app.load().restorePreviousRoom()).myVotes.place1, false);
});
test("expired or removed membership clears its saved code without affecting a changed account", async () => {
  for (const message of ["Room expired or not found", "Join this room first"]) {
    const app = harness();
    app.setResponse(() => {
      app.setIdentity("bob");
      return { data: { error: message }, error: null };
    });
    await assert.rejects(app.load().restorePreviousRoom(), new RegExp(message));
    assert.equal(app.stored.has("flavorfinder_room_alice"), false);
    assert.equal(app.stored.get("flavorfinder_room_bob"), "OTHER");
  }
});
test("no saved room avoids a backend request", async () => {
  const app = harness();
  app.stored.clear();
  assert.equal(await app.load().restorePreviousRoom(), null);
  assert.equal(app.calls.length, 0);
});
