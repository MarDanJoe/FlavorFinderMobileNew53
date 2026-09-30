const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
function functionHandler(file, identity, { permitted = true, fetcher } = {}) {
  let handler;
  let forwarded = 0;
  const normalize = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync("supabase/functions/places/provider.ts", "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    { exports: normalize, URLSearchParams },
  );
  const cors = { "Access-Control-Allow-Origin": "*" };
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" },
    });
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: (name) =>
        name.includes("provider")
          ? normalize
          : {
              cors,
              json,
              authenticated: async () => {
                if (!identity) throw Error("Unauthorized");
                return {
                  ...identity,
                  admin: {
                    ...identity.admin,
                    rpc: async () => ({ data: permitted, error: null }),
                  },
                };
              },
            },
      Deno: {
        serve: (h) => {
          handler = h;
        },
        env: {
          get: (name) =>
            name === "GOOGLE_PLACES_API_KEY" ? "server-only-secret" : null,
        },
      },
      Request,
      Response,
      URL,
      URLSearchParams,
      AbortSignal,
      Date,
      atob,
      fetch: async (...args) => {
        forwarded++;
        return fetcher
          ? fetcher(...args)
          : Response.json({
              places: [
                {
                  id: "test",
                  displayName: { text: "Cafe" },
                  location: { latitude: 40, longitude: -74 },
                },
              ],
            });
      },
    },
  );
  return { handler, forwarded: () => forwarded };
}
const placesFile = "supabase/functions/places/index.ts";
const url =
  "https://project.supabase.co/functions/v1/places/nearbysearch/json?location=40,-74&radius=1000";
test("hosted Places rejects unauthenticated requests without forwarding billable calls", async () => {
  const f = functionHandler(placesFile, null);
  assert.equal((await f.handler(new Request(url))).status, 401);
  assert.equal(f.forwarded(), 0);
});
test("hosted Places quota is enforced before forwarding calls and validation fails closed", async () => {
  const f = functionHandler(
    placesFile,
    { user: { id: "guest" } },
    { permitted: false },
  );
  assert.equal((await f.handler(new Request(url))).status, 429);
  assert.equal(f.forwarded(), 0);
  assert.equal(
    (await f.handler(new Request(url.replace("40,-74", "91,0")))).status,
    400,
  );
  assert.equal(f.forwarded(), 0);
});
test("hosted Places normalizes live-provider responses and does not reveal upstream secrets", async () => {
  const f = functionHandler(placesFile, { user: { id: "guest" } });
  const response = await f.handler(new Request(url));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).results[0].name, "Cafe");
  assert.equal(f.forwarded(), 1);
  const bad = functionHandler(
    placesFile,
    { user: { id: "guest" } },
    {
      fetcher: async () =>
        Response.json({ error: "server-only-secret" }, { status: 403 }),
    },
  );
  const failure = await bad.handler(new Request(url));
  assert.equal(failure.status, 502);
  assert.equal((await failure.text()).includes("server-only-secret"), false);
});
function token(amr) {
  return `a.${Buffer.from(JSON.stringify({ amr })).toString("base64url")}.c`;
}
test("deletion requires a registered user, confirmation and recent password authentication", async () => {
  let deleted;
  const identity = {
    user: { id: "real-user", is_anonymous: false },
    admin: {
      auth: {
        admin: {
          deleteUser: async (id) => {
            deleted = id;
            return { error: null };
          },
        },
      },
    },
  };
  const f = functionHandler(
    "supabase/functions/delete-account/index.ts",
    identity,
  );
  const request = (amr, body = { confirm: true }) =>
    new Request("https://project.supabase.co/functions/v1/delete-account", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token(amr)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  assert.equal((await f.handler(request([]))).status, 403);
  assert.equal(deleted, undefined);
  assert.equal(
    (
      await f.handler(
        request([{ method: "password", timestamp: Date.now() / 1000 - 600 }]),
      )
    ).status,
    403,
  );
  assert.equal(deleted, undefined);
  assert.equal(
    (
      await f.handler(
        request([{ method: "password", timestamp: Date.now() / 1000 }], {
          confirm: false,
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.handler(
        request([{ method: "password", timestamp: Date.now() / 1000 }]),
      )
    ).status,
    200,
  );
  assert.equal(deleted, "real-user");
  const guest = functionHandler("supabase/functions/delete-account/index.ts", {
    user: { id: "guest", is_anonymous: true },
    admin: identity.admin,
  });
  assert.equal(
    (
      await guest.handler(
        request([{ method: "password", timestamp: Date.now() / 1000 }]),
      )
    ).status,
    403,
  );
});
