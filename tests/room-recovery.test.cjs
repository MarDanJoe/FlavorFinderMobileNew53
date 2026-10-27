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
  let dispatchIdentity;
  let readIdentity;
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
    getItem: async (key) => {
      const value = stored.get(key) ?? null;
      if (readIdentity) identity = readIdentity;
      return value;
    },
    removeItem: async (key) => stored.delete(key),
  };
  const client = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: identity }, access_token: identity } },
      }),
    },
    rpc: (name, args) => {
      const call = { name, args };
      calls.push(call);
      return {
        setHeader(name, value) {
          if (name === "Authorization")
            call.token = value.replace("Bearer ", "");
          return this;
        },
        abortSignal: async () => {
          if (dispatchIdentity) identity = dispatchIdentity;
          call.executedAs = call.token ?? identity;
          return typeof response === "function" ? response() : response;
        },
      };
    },
  };
  function load() {
    const exports = {};
    new Function("exports", "require", source)(exports, (name) => {
      if (name === "@react-native-async-storage/async-storage") return storage;
      if (name === "expo-crypto")
        return { randomUUID: () => "00000000-0001-4000-8000-000000000000" };
      if (name === "./supabase")
        return { supabase: client, restaurantSession: async () => identity };
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
    switchAtDispatch: (value) => (dispatchIdentity = value),
    switchAfterRead: (value) => (readIdentity = value),
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

test("a delayed vote keeps the captured caller token when the active account changes", async () => {
  const app = harness();
  app.switchAtDispatch("bob");
  await app
    .load()
    .roomAction("vote", "ABC123", { place: "place1", liked: true });
  assert.equal(app.calls[0].executedAs, "alice");
});

test("restoring a room keeps its storage owner token across a delayed local read", async () => {
  const app = harness();
  app.switchAfterRead("bob");
  await app.load().restorePreviousRoom();
  assert.equal(app.calls[0].executedAs, "alice");
  assert.equal(app.stored.get("flavorfinder_room_bob"), "OTHER");
});

test("new room codes contain six digits and preserve leading zeroes", () => {
  assert.equal(harness().load().newRoomCode(), "000001");
});

test("a short-code collision retries creation with the same captured identity", async () => {
  const app = harness();
  let attempts = 0;
  app.setResponse(() =>
    ++attempts < 2
      ? { data: null, error: { code: "23505", message: "duplicate key" } }
      : { data: { code: "000001" }, error: null },
  );
  assert.equal(
    (
      await app
        .load()
        .roomAction("create", "123456", { nickname: "Host", ids: ["a", "b"] })
    ).code,
    "000001",
  );
  assert.equal(app.calls.length, 2);
  assert.equal(app.calls[1].args.room_code, "000001");
  assert.ok(app.calls.every((call) => call.executedAs === "alice"));
});

test("collision retries stop rather than loop indefinitely", async () => {
  const app = harness();
  app.setResponse({
    data: null,
    error: { code: "23505", message: "duplicate key" },
  });
  await assert.rejects(
    app.load().roomAction("create", "123456"),
    /duplicate key/,
  );
  assert.equal(app.calls.length, 4);
});
