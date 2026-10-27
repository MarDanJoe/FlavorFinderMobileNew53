-- Preserve existing six-argument callers through the optional round argument.
-- Existing clients may finish round one; stale clients cannot vote in a runoff.
begin;
alter table public.voting_rooms drop constraint voting_rooms_code_check;
alter table public.voting_rooms add constraint voting_rooms_code_check check (code ~ '^([0-9]{6}|[A-F0-9]{12})$');
alter table public.voting_rooms add column round integer not null default 1 check (round > 0);
drop function public.room_action(text,text,text,text[],text,boolean);
create function public.room_action(action text, room_code text, nickname text default null, ids text[] default null, place text default null, liked boolean default null, expected_round integer default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid(); r public.voting_rooms; member public.room_members;
 stamp timestamptz; attempts integer; member_count integer; complete_count integer;
 high_score integer; leaders text[]; result jsonb;
begin
 if uid is null then raise exception 'Sign in to connect to a room'; end if;
 room_code := upper(trim(room_code));
 if room_code is null or room_code !~ '^([0-9]{6}|[A-F0-9]{12})$' then raise exception 'Enter a valid 6-digit room code'; end if;
 if action not in ('create','join','get','start','vote','finish','leave','runoff') or action is null then raise exception 'Unknown room action'; end if;
 if action in ('create','join') then
  if nickname is null or length(trim(nickname)) not between 1 and 24 then raise exception 'Choose a name with 1–24 characters'; end if;
  stamp := date_trunc('minute',now());
  insert into public.room_attempts values(uid,stamp,1) on conflict(user_id,bucket) do update set attempts=public.room_attempts.attempts+1 returning room_attempts.attempts into attempts;
  if attempts > 10 then return jsonb_build_object('error','Too many attempts. Try again in a minute.'); end if;
 end if;
 if action='create' then
  if ids is null or cardinality(ids) not between 2 and 20 or exists(select 1 from unnest(ids) x where x is null or length(x)>256 or x !~ '^[A-Za-z0-9_-]+$') or (select count(distinct x) from unnest(ids) x) <> cardinality(ids) then raise exception 'Choose 2–20 different restaurants'; end if;
  -- Serialize creations by this user to enforce the daily limit under concurrency.
  perform 1 from auth.users where id=uid for update;
  if (select count(*) from public.voting_rooms where host_id=uid and created_at>now()-interval '1 day') >= 5 then raise exception 'You can host five rooms per day'; end if;
  insert into public.voting_rooms(code,host_id,deck) values(room_code,uid,ids);
  insert into public.room_members values(room_code,uid,trim(nickname),true);
 end if;
 select * into r from public.voting_rooms where code=room_code for update;
 if not found or r.expires_at <= now() then return jsonb_build_object('error','Room unavailable or expired. Ask your host for a new code'); end if;
 select * into member from public.room_members where code=room_code and user_id=uid;
 if action='join' then
  if r.status <> 'waiting' and (member.user_id is null or not member.active) then return jsonb_build_object('error','Voting has started. Join the next room'); end if;
  if member.user_id is null or not member.active then
   if (select count(*) from public.room_members where code=room_code and active) >= 10 then return jsonb_build_object('error','This room already has ten people'); end if;
  end if;
  insert into public.room_members values(room_code,uid,trim(nickname),true) on conflict(code,user_id) do update set nickname=excluded.nickname,active=true;
  select * into member from public.room_members where code=room_code and user_id=uid;
 end if;
 if member.user_id is null or not member.active then raise exception 'Join this room to see it'; end if;
 if action in ('start','finish','runoff') and r.host_id <> uid then raise exception 'Only the host can do that'; end if;
 -- The locked room serializes round transitions and rejects delayed votes/retries.
 if action in ('vote','finish','runoff') and
    ((expected_round is not null and expected_round <> r.round) or (r.round > 1 and expected_round is null)) then
  raise exception 'The voting round changed. Refresh your room before continuing';
 end if;
 if action='runoff' then
  if r.status <> 'finished' or not r.tied then raise exception 'A runoff requires a finished tied round'; end if;
  if (select count(*) from public.room_members where code=room_code and active)<2 then raise exception 'Invite at least one friend before starting'; end if;
  select max(value::integer) into high_score from jsonb_each_text(r.scores);
  select array_agg(id order by ord) into leaders from unnest(r.deck) with ordinality d(id,ord)
   where (r.scores->>id)::integer=high_score;
  if coalesce(cardinality(leaders),0)<2 then raise exception 'No tied restaurants available'; end if;
  delete from public.room_votes where code=room_code;
  update public.voting_rooms set deck=leaders,status='voting',scores=null,winner=null,tied=false,round=round+1 where code=room_code;
  select * into r from public.voting_rooms where code=room_code;
 end if;
 if action='start' then
  if r.status<>'waiting' then raise exception 'This room has already started'; end if;
  if (select count(*) from public.room_members where code=room_code and active)<2 then raise exception 'Invite at least one friend before starting'; end if;
  update public.voting_rooms set status='voting' where code=room_code;
  r.status := 'voting';
 end if;
 if action='vote' then
  if r.status<>'voting' then raise exception 'Voting is closed'; end if;
  if place is null or not(place=any(r.deck)) or liked is null then raise exception 'Invalid restaurant vote'; end if;
  -- First vote wins. Retries are safe, and votes cannot be rewritten after submission.
  insert into public.room_votes values(room_code,uid,place,liked) on conflict do nothing;
 end if;
 if action='leave' then
  if r.status in ('finished','cancelled') then return jsonb_build_object('left',true); end if;
  update public.room_members set active=false where code=room_code and user_id=uid;
  if r.host_id=uid and r.status in ('waiting','voting') then update public.voting_rooms set status='cancelled' where code=room_code; end if;
  return jsonb_build_object('left',true);
 end if;
 if action='finish' and r.status <> 'voting' then raise exception 'Start voting first'; end if;
 select count(*) into member_count from public.room_members where code=room_code and active;
 select count(*) into complete_count from public.room_members m where m.code=room_code and m.active and (select count(*) from public.room_votes v where v.code=m.code and v.user_id=m.user_id)=cardinality(r.deck);
 if r.status='voting' and (action='finish' or (member_count>=2 and complete_count=member_count)) then
  if not exists(select 1 from public.room_votes v join public.room_members m using(code,user_id) where v.code=room_code and m.active) then raise exception 'Wait for at least one vote before finishing'; end if;
  select max(score) into high_score from (select count(*)::integer score from public.room_votes v join public.room_members m using(code,user_id) where v.code=room_code and m.active and v.liked group by place_id) scores;
  select array_agg(place_id order by place_id) into leaders from (select place_id,count(*) score from public.room_votes v join public.room_members m using(code,user_id) where v.code=room_code and m.active and v.liked group by place_id) scores where score=high_score;
  update public.voting_rooms set status='finished',scores=coalesce((select jsonb_object_agg(place_id,score) from (select v.place_id,count(*) filter(where v.liked) score from public.room_votes v join public.room_members m using(code,user_id) where v.code=room_code and m.active group by v.place_id) s),'{}'::jsonb),winner=case when cardinality(leaders)>0 then leaders[1+floor(random()*cardinality(leaders))::integer] else null end,tied=coalesce(cardinality(leaders)>1,false) where code=room_code;
 end if;
 select * into r from public.voting_rooms where code=room_code;
 result := jsonb_build_object('round',r.round,'code',r.code,'deck',r.deck,'status',r.status,'isHost',r.host_id=uid,'winner',r.winner,'tied',r.tied,'expiresAt',r.expires_at,
 'members',coalesce((select jsonb_agg(jsonb_build_object('name',m.nickname,'isHost',m.user_id=r.host_id,'voted',(select count(*) from public.room_votes v where v.code=m.code and v.user_id=m.user_id)) order by m.nickname,m.user_id) from public.room_members m where m.code=room_code and m.active),'[]'::jsonb),
 'myVotes',coalesce((select jsonb_object_agg(place_id,v.liked) from public.room_votes v where v.code=room_code and v.user_id=uid),'{}'::jsonb));
 if r.status='finished' then
  result := result || jsonb_build_object('scores',r.scores);
 end if;
 return result;
end $$;
revoke all on function public.room_action(text,text,text,text[],text,boolean,integer) from public;
grant execute on function public.room_action(text,text,text,text[],text,boolean,integer) to authenticated;

notify pgrst, 'reload schema';
commit;
