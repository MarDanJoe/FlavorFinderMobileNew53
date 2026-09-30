// Explicit live integration check: creates guest sessions and short-lived QA rooms.
// Run manually with node --env-file=.env.local scripts/verify-live-rooms.cjs.
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("node:crypto");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const url = process.env.EXPO_PUBLIC_SUPABASE_URL,
  key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw Error("Public Supabase configuration required");
const clients = Array.from({ length: 3 }, () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
const checks = [];
async function call(client, action, code, extra = {}) {
  const { data, error } = await client.rpc("room_action", {
    action,
    room_code: code,
    ...extra,
  });
  if (error) throw Error(error.message);
  if (data?.error) throw Error(data.error);
  return data;
}
const code = () => randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
(async () => {
  try {
    for (const client of clients) {
      const { error } = await client.auth.signInAnonymously();
      if (error) throw error;
    }
    const [host, friend, outsider] = clients;
    const {
      data: { session },
    } = await host.auth.getSession();
    const response = await fetch(
      url +
        "/functions/v1/places/nearbysearch/json?location=40.7128,-74.006&radius=1609",
      {
        headers: {
          Authorization: "Bearer " + session.access_token,
          apikey: key,
        },
      },
    );
    assert.equal(response.status, 200);
    const places = await response.json();
    const ids = places.results.slice(0, 2).map((p) => p.place_id);
    assert.equal(ids.length, 2);
    checks.push("Live Google restaurant deck loaded");
    const room = code();
    await call(host, "create", room, { nickname: "QA Host", ids });
    await assert.rejects(call(outsider, "get", room), /Join/);
    for (const table of [
      "voting_rooms",
      "room_members",
      "room_votes",
      "room_attempts",
    ]) {
      const { error } = await outsider.from(table).select("*");
      assert.ok(error);
    }
    checks.push("Outsider and direct-table access rejected");
    await call(friend, "join", room, { nickname: "QA Friend" });
    await assert.rejects(call(friend, "start", room), /host/);
    await call(host, "start", room);
    await assert.rejects(
      call(outsider, "join", room, { nickname: "QA Late" }),
      /started/,
    );
    await call(host, "vote", room, { place: ids[0], liked: true });
    await call(host, "vote", room, { place: ids[0], liked: false });
    let snapshot = await call(friend, "get", room);
    assert.deepEqual(snapshot.myVotes, {});
    assert.equal(snapshot.scores, undefined);
    assert.equal((await call(host, "get", room)).myVotes[ids[0]], true);
    checks.push("Votes private, retry cannot overwrite, late join rejected");
    await call(friend, "vote", room, { place: ids[0], liked: false });
    await Promise.all([
      call(host, "vote", room, { place: ids[1], liked: false }),
      call(friend, "vote", room, { place: ids[1], liked: true }),
    ]);
    const [a, b] = await Promise.all([
      call(host, "get", room),
      call(friend, "get", room),
    ]);
    assert.equal(a.status, "finished");
    assert.equal(a.tied, true);
    assert.equal(a.winner, b.winner);
    assert.deepEqual(a.scores, b.scores);
    assert.ok(ids.includes(a.winner));
    await call(friend, "leave", room);
    assert.equal((await call(host, "get", room)).winner, a.winner);
    checks.push("Concurrent completion yields one stable shared tie winner");
    const empty = code();
    await call(host, "create", empty, { nickname: "QA Host", ids });
    await call(friend, "join", empty, { nickname: "QA Friend" });
    await call(host, "start", empty);
    for (const id of ids) {
      await call(host, "vote", empty, { place: id, liked: false });
      await call(friend, "vote", empty, { place: id, liked: false });
    }
    assert.equal((await call(host, "get", empty)).winner, null);
    checks.push("All-pass result has no unwanted winner");
    const early = code();
    await call(host, "create", early, { nickname: "QA Host", ids });
    await call(friend, "join", early, { nickname: "QA Friend" });
    await call(outsider, "join", early, { nickname: "QA Other" });
    await call(host, "start", early);
    await call(outsider, "vote", early, { place: ids[1], liked: true });
    await call(outsider, "leave", early);
    await call(host, "vote", early, { place: ids[0], liked: true });
    snapshot = await call(host, "finish", early);
    assert.equal(snapshot.winner, ids[0]);
    assert.equal(snapshot.scores[ids[1]], undefined);
    checks.push("Early finish excludes votes from departed members");
    const cancel = code();
    await call(host, "create", cancel, { nickname: "QA Host", ids });
    await call(friend, "join", cancel, { nickname: "QA Friend" });
    await call(host, "leave", cancel);
    assert.equal((await call(friend, "get", cancel)).status, "cancelled");
    checks.push("Host departure closes the room");
    const result = { checkedAt: new Date().toISOString(), passed: checks };
    fs.mkdirSync("verification", { recursive: true });
    fs.writeFileSync(
      "verification/live-rooms-results.json",
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(JSON.stringify(result, null, 2));
  } finally {
    for (const client of clients) await client.auth.signOut();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
