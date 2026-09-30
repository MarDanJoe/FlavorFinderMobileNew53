const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const alice = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  bob = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  guest = "cccccccc-cccc-cccc-cccc-cccccccccccc";
test("actual PostgreSQL migration enforces isolation, optimistic writes, deletion cascade and shared quotas", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
      create table auth.users(id uuid primary key, is_anonymous boolean not null default false);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
      insert into auth.users values ('${alice}',false),('${bob}',false),('${guest}',true);`);
    await db.exec(
      fs.readFileSync("supabase/migrations/202609300001_launch.sql", "utf8"),
    );
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub='${alice}';`,
    );
    const save = (ids, revision) =>
      db.query(
        "select public.save_library($1::text[], $2::jsonb, $3::bigint) as revision",
        [ids, JSON.stringify({ radius: 8047 }), revision],
      );
    assert.equal((await save(["place-a"], 0)).rows[0].revision, 1);
    await assert.rejects(save(["overwrite"], 0), /another device/);
    assert.equal(
      (await db.query("select place_ids from public.libraries")).rows[0]
        .place_ids[0],
      "place-a",
    );
    await assert.rejects(
      db.query("insert into public.libraries(user_id) values($1)", [bob]),
      /permission denied/,
    );
    await db.exec(`set request.jwt.claim.sub='${bob}';`);
    assert.equal(
      (await db.query("select * from public.libraries")).rows.length,
      0,
    );
    assert.equal((await save(["place-b"], 0)).rows[0].revision, 1);
    await db.exec(`set request.jwt.claim.sub='${guest}';`);
    await assert.rejects(save(["guest"], 0), /registered account/);
    await assert.rejects(
      db.query("select public.take_restaurant_quota($1,2)", [guest]),
      /permission denied/,
    );
    await db.exec("reset role;");
    assert.equal(
      (
        await db.query("select public.take_restaurant_quota($1,2) as allowed", [
          alice,
        ])
      ).rows[0].allowed,
      true,
    );
    assert.equal(
      (
        await db.query("select public.take_restaurant_quota($1,2) as allowed", [
          bob,
        ])
      ).rows[0].allowed,
      true,
    );
    assert.equal(
      (
        await db.query("select public.take_restaurant_quota($1,2) as allowed", [
          guest,
        ])
      ).rows[0].allowed,
      false,
    );
    await db.query("delete from auth.users where id=$1", [alice]);
    assert.equal(
      (
        await db.query("select * from public.libraries where user_id=$1", [
          alice,
        ])
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
