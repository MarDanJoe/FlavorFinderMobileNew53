-- Accessible for 24 hours; hourly cleanup physically removes expired room data.
create index voting_rooms_expiry_idx on public.voting_rooms(expires_at);
create index voting_rooms_host_created_idx on public.voting_rooms(host_id,created_at);
create index room_members_user_idx on public.room_members(user_id);
create index room_attempts_bucket_idx on public.room_attempts(bucket);
create function public.cleanup_voting_rooms() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare rooms_removed integer; attempts_removed integer;
begin
 delete from public.voting_rooms where expires_at <= now();
 get diagnostics rooms_removed = row_count;
 delete from public.room_attempts where bucket < now() - interval '1 day';
 get diagnostics attempts_removed = row_count;
 return jsonb_build_object('rooms_removed',rooms_removed,'attempts_removed',attempts_removed);
end $$;
revoke all on function public.cleanup_voting_rooms() from public,anon,authenticated;
grant execute on function public.cleanup_voting_rooms() to service_role;

-- Hosted scheduler; the function above is independently tested in PostgreSQL.
create extension if not exists pg_cron;
select cron.schedule('flavorfinder-expired-rooms','17 * * * *',
 $$select public.cleanup_voting_rooms();$$);
