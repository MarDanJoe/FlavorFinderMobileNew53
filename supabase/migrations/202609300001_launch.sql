-- Persist only Google place IDs and user preferences, never provider content.
create table public.libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  place_ids text[] not null default '{}',
  preferences jsonb not null default '{}',
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  check (cardinality(place_ids) <= 100)
);
alter table public.libraries enable row level security;
revoke all on public.libraries from anon, authenticated;
grant select on public.libraries to authenticated;
create policy "Read own library" on public.libraries for select to authenticated using (auth.uid() = user_id);
-- All writes go through an atomic version check; no client can overwrite another device silently.
create function public.save_library(ids text[], prefs jsonb, expected_revision bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare result bigint;
begin
  if auth.uid() is null or not exists (select 1 from auth.users where id = auth.uid() and is_anonymous = false) then
    raise exception 'A registered account is required';
  end if;
  if ids is null or prefs is null or jsonb_typeof(prefs) <> 'object' then raise exception 'Invalid library'; end if;
  if cardinality(ids) > 100 or octet_length(prefs::text) > 4096 then raise exception 'Library too large'; end if;
  if exists (select 1 from unnest(ids) as place_id where place_id is null or length(place_id) > 256 or place_id !~ '^[A-Za-z0-9_-]+$') then raise exception 'Invalid place ID'; end if;
  if expected_revision = 0 then
    insert into public.libraries(user_id) values(auth.uid()) on conflict do nothing;
  end if;
  update public.libraries set place_ids = ids, preferences = prefs, revision = revision + 1, updated_at = now()
  where user_id = auth.uid() and revision = expected_revision returning revision into result;
  if result is null then raise exception 'Library changed on another device. Reload and try again.'; end if;
  return result;
end $$;
revoke all on function public.save_library(text[], jsonb, bigint) from public;
grant execute on function public.save_library(text[], jsonb, bigint) to authenticated;

-- Atomic quotas shared by all Edge Function instances, including a global day limit.
create table public.request_buckets (bucket text primary key, count integer not null, expires_at timestamptz not null);
alter table public.request_buckets enable row level security;
create function public.take_restaurant_quota(subject uuid, daily_limit integer default 100)
returns boolean language plpgsql security definer set search_path = '' as $$
declare minute_count integer; day_count integer;
begin
  delete from public.request_buckets where expires_at < now();
  insert into public.request_buckets values ('day:' || to_char(now() at time zone 'UTC', 'YYYYMMDD'), 1, (date_trunc('day', now() at time zone 'UTC') at time zone 'UTC') + interval '1 day')
  on conflict(bucket) do update set count = public.request_buckets.count + 1 returning count into day_count;
  insert into public.request_buckets values ('minute:' || subject::text || ':' || to_char(now() at time zone 'UTC', 'YYYYMMDDHH24MI'), 1, now() + interval '2 minutes')
  on conflict(bucket) do update set count = public.request_buckets.count + 1 returning count into minute_count;
  return day_count <= daily_limit and minute_count <= 60;
end $$;
revoke all on function public.take_restaurant_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.take_restaurant_quota(uuid, integer) to service_role;
