const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
test("runoffs retain members, restrict the deck to leaders, and reject stale or unauthorized actions", async () => {
  const db = new PGlite();
  const host = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const friend = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const outsider = "cccccccc-cccc-cccc-cccc-cccccccccccc";
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;
      insert into auth.users values('${host}'),('${friend}'),('${outsider}');`);
    await db.exec(
      fs.readFileSync("supabase/migrations/202609300002_rooms.sql", "utf8"),
    );
    await db.exec(
      fs.readFileSync(
        "supabase/migrations/202610270001_room_runoffs.sql",
        "utf8",
      ),
    );
    const as = (id) =>
      db.exec(`set role authenticated; set request.jwt.claim.sub='${id}';`);
    const call = async (action, extra = {}) =>
      (
        await db.query(
          "select public.room_action($1,'AABBCCDDEEFF',$2,$3::text[],$4,$5,$6) as room",
          [
            action,
            extra.nickname ?? null,
            extra.ids ?? null,
            extra.place ?? null,
            extra.liked ?? null,
            extra.round ?? null,
          ],
        )
      ).rows[0].room;
    await as(host);
    await call("create", { nickname: "Host", ids: ["a", "b", "c"] });
    await as(friend);
    await call("join", { nickname: "Friend" });
    await as(host);
    await call("start");
    await assert.rejects(call("runoff", { round: 1 }), /finished tied/);
    for (const id of [host, friend]) {
      await as(id);
      for (const place of ["a", "b", "c"])
        await call("vote", { place, liked: place !== "c" });
    }
    let r = await call("get");
    assert.equal(r.tied, true);
    const winner = r.winner;
    assert.equal((await call("get")).winner, winner);
    await assert.rejects(call("runoff", { round: 1 }), /Only the host/);
    await as(outsider);
    await assert.rejects(call("runoff", { round: 1 }), /Join this room/);
    await as(host);
    r = await call("runoff", { round: 1 });
    assert.equal(r.round, 2);
    assert.equal(r.status, "voting");
    assert.deepEqual(r.deck, ["a", "b"]);
    assert.deepEqual(r.myVotes, {});
    assert.equal(r.members.length, 2);
    assert.ok(r.members.every((m) => m.voted === 0));
    assert.equal(r.winner, null);
    assert.equal(r.scores, undefined);
    await assert.rejects(call("runoff", { round: 1 }), /round changed/);
    await assert.rejects(
      call("vote", { place: "a", liked: true, round: 1 }),
      /round changed/,
    );
    await assert.rejects(
      call("vote", { place: "a", liked: true }),
      /round changed/,
    );
    await assert.rejects(
      call("vote", { place: "c", liked: true, round: 2 }),
      /Invalid/,
    );
    for (const id of [host, friend]) {
      await as(id);
      for (const place of ["a", "b"])
        await call("vote", { place, liked: true, round: 2 });
    }
    await as(host);
    r = await call("runoff", { round: 2 });
    assert.equal(r.round, 3); // Another tie can have another runoff.
    for (const id of [host, friend]) {
      await as(id);
      for (const place of ["a", "b"])
        await call("vote", { place, liked: place === "a", round: 3 });
    }
    r = await call("get");
    assert.equal(r.winner, "a");
    assert.equal(r.tied, false);
    await as(host);
    await assert.rejects(call("runoff", { round: 3 }), /finished tied/);
    // New numeric codes coexist with already-issued twelve-character invites.
    const createShort = async (code) =>
      db.query(
        "select public.room_action('create',$1,'Host',array['a','b']) as room",
        [code],
      );
    assert.equal((await createShort("001234")).rows[0].room.code, "001234");
    await assert.rejects(createShort("12345"), /6-digit/);
    await assert.rejects(createShort("ABCDEF"), /6-digit/);
    await assert.rejects(createShort("001234"), /duplicate key/);
    await assert.rejects(
      db.query("select * from public.room_votes"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
