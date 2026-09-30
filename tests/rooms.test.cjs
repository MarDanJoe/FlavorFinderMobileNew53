const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const host = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  friend = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  outsider = "cccccccc-cccc-cccc-cccc-cccccccccccc";
test("room RPC enforces private membership, frozen decks, idempotent votes and one shared tie result", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
   insert into auth.users values('${host}'),('${friend}'),('${outsider}');`);
    await db.exec(
      fs.readFileSync("supabase/migrations/202609300002_rooms.sql", "utf8"),
    );
    await db.exec(
      fs
        .readFileSync(
          "supabase/migrations/202609300003_room_cleanup.sql",
          "utf8",
        )
        .split("-- Hosted scheduler;")[0],
    );
    const as = async (id) =>
      db.exec(`set role authenticated; set request.jwt.claim.sub='${id}';`);
    const call = async (action, code = "AABBCCDDEEFF", extra = {}) =>
      (
        await db.query(
          "select public.room_action($1,$2,$3,$4::text[],$5,$6) as room",
          [
            action,
            code,
            extra.nickname ?? null,
            extra.ids ?? null,
            extra.place ?? null,
            extra.liked ?? null,
          ],
        )
      ).rows[0].room;
    await as(host);
    await assert.rejects(
      call("create", "000000000000", { nickname: "Host", ids: ["a", "a"] }),
      /different restaurants/,
    );
    let r = await call("create", undefined, {
      nickname: "Host",
      ids: ["a", "b"],
    });
    assert.deepEqual(r.deck, ["a", "b"]);
    await assert.rejects(call("start"), /one friend/);
    await assert.rejects(
      db.query("select * from public.room_votes"),
      /permission denied/,
    );
    await as(outsider);
    await assert.rejects(call("get"), /Join this room/);
    await assert.rejects(call("finish"), /Join this room/);
    await as(friend);
    await call("join", undefined, { nickname: "Friend" });
    await assert.rejects(call("start"), /Only the host/);
    await as(host);
    await call("start");
    await assert.rejects(
      call("vote", undefined, { place: "unknown", liked: true }),
      /Invalid/,
    );
    await call("vote", undefined, { place: "a", liked: true });
    await call("vote", undefined, { place: "a", liked: false });
    await call("vote", undefined, { place: "b", liked: false });
    await as(outsider);
    assert.match(
      (await call("join", undefined, { nickname: "Late" })).error,
      /started/,
    );
    await as(friend);
    r = await call("get");
    assert.deepEqual(r.myVotes, {});
    assert.equal(r.scores, undefined);
    assert.equal(r.members.find((x) => x.name === "Host").voted, 2);
    await call("vote", undefined, { place: "a", liked: false });
    r = await call("vote", undefined, { place: "b", liked: true });
    assert.equal(r.status, "finished");
    assert.equal(r.tied, true);
    assert.ok(["a", "b"].includes(r.winner));
    assert.deepEqual(r.scores, { a: 1, b: 1 });
    const winner = r.winner;
    await call("leave");
    r = await call("get");
    assert.equal(r.winner, winner);
    assert.deepEqual(r.scores, { a: 1, b: 1 });
    await as(host);
    assert.equal((await call("get")).winner, winner);
    await assert.rejects(
      call("vote", undefined, { place: "a", liked: false }),
      /closed/,
    );
    await db.exec("reset role");
    await db.query("delete from auth.users where id=$1", [friend]);
    await as(host);
    assert.deepEqual((await call("get")).scores, { a: 1, b: 1 });
    // All passes yield no unwanted winner; early finish excludes departed members.
    await call("create", "112233445566", { nickname: "Host", ids: ["a", "b"] });
    await as(outsider);
    await call("join", "112233445566", { nickname: "Other" });
    await as(host);
    await call("start", "112233445566");
    await assert.rejects(call("finish", "112233445566"), /at least one vote/);
    await as(outsider);
    await call("vote", "112233445566", { place: "a", liked: true });
    await call("leave", "112233445566");
    await as(host);
    await call("vote", "112233445566", { place: "a", liked: false });
    r = await call("finish", "112233445566");
    assert.equal(r.winner, null);
    assert.equal(r.tied, false);
    // Invalid join attempts are retained and rate limited rather than rolled back.
    await as(outsider);
    let limited;
    for (let i = 0; i < 12; i++)
      limited = await call("join", "999999999999", { nickname: "Other" });
    assert.match(limited.error, /Too many/);
    await as(host);
    await call("create", "123456ABCDEF", { nickname: "Host", ids: ["a", "b"] });
    await call("leave", "123456ABCDEF");
    await assert.rejects(call("get", "123456ABCDEF"), /Join/);
    await db.exec("reset role");
    await db.exec(
      `update public.voting_rooms set expires_at=now()-interval '1 hour' where code='AABBCCDDEEFF'`,
    );
    await as(host);
    assert.match((await call("get")).error, /expired/);
    await assert.rejects(
      db.query("select public.cleanup_voting_rooms()"),
      /permission denied/,
    );
    await db.exec("reset role");
    const cleaned = (
      await db.query("select public.cleanup_voting_rooms() as result")
    ).rows[0].result;
    assert.equal(cleaned.rooms_removed, 1);
    assert.equal(
      (
        await db.query(
          "select * from public.room_votes where code='AABBCCDDEEFF'",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select * from public.room_members where code='AABBCCDDEEFF'",
        )
      ).rows.length,
      0,
    );
    assert.ok(
      (
        await db.query(
          "select * from public.voting_rooms where code='112233445566'",
        )
      ).rows.length,
    );
    // Capacity and creation limits protect a real shared room rather than UI-only checks.
    await db.exec("reset role");
    const guests = Array.from(
      { length: 10 },
      (_, i) => `dddddddd-dddd-dddd-dddd-${String(i + 1).padStart(12, "0")}`,
    );
    for (const id of guests)
      await db.query("insert into auth.users values ($1)", [id]);
    await as(host);
    await call("create", "555555555555", { nickname: "Host", ids: ["a", "b"] });
    for (const id of guests.slice(0, 9)) {
      await as(id);
      await call("join", "555555555555", { nickname: "Friend" });
    }
    await as(guests[9]);
    assert.match(
      (await call("join", "555555555555", { nickname: "Extra" })).error,
      /ten people/,
    );
    await as(host);
    assert.equal((await call("get", "555555555555")).members.length, 10);
    await call("create", "666666666666", { nickname: "Host", ids: ["a", "b"] });
    await call("create", "777777777777", { nickname: "Host", ids: ["a", "b"] });
    await assert.rejects(
      call("create", "888888888888", { nickname: "Host", ids: ["a", "b"] }),
      /five rooms/,
    );
  } finally {
    await db.close();
  }
});
