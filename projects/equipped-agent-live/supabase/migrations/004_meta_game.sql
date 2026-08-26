-- The meta-game: jerseys (initials+emoji per device), THE BOARD (points
-- derived from real artifacts — no client-callable "add points" exists),
-- presenter-written podium awards, and the machine's locked price guess.
-- (Applied to the live project via MCP on 2026-08-26; kept here as the record.)

create table if not exists live_players (
  room text not null,
  device_id uuid not null,
  initials text not null default '',
  emoji text not null default '',
  updated_at timestamptz not null default now(),
  primary key (room, device_id)
);

create table if not exists live_awards (
  id bigint generated always as identity primary key,
  room text not null,
  device_id uuid not null,
  points integer not null,
  reason text not null default '',
  at timestamptz not null default now()
);
create index if not exists live_awards_room_device on live_awards (room, device_id);

create table if not exists live_ai_guess (
  room text not null,
  poll_key text not null,
  guess_k integer not null,
  reasoning text not null default '',
  at timestamptz not null default now(),
  primary key (room, poll_key)
);

alter table live_players enable row level security;
alter table live_awards enable row level security;
alter table live_ai_guess enable row level security;

-- ---- jerseys ----------------------------------------------------------

create or replace function public.live_profile_set(p_key text, p_device uuid, p_initials text, p_emoji text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  insert into live_players (room, device_id, initials, emoji, updated_at)
    values ('big-reveal', p_device,
            upper(regexp_replace(coalesce(p_initials,''), '[^a-zA-Z]', '', 'g'))::varchar(3),
            left(coalesce(p_emoji,''), 8), now())
    on conflict (room, device_id) do update
      set initials = excluded.initials, emoji = excluded.emoji, updated_at = now();
end $$;

create or replace function public.live_profile_get(p_key text, p_device uuid)
returns table(initials text, emoji text)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  return query select p.initials, p.emoji from live_players p
    where p.room = 'big-reveal' and p.device_id = p_device;
end $$;

-- ---- presenter-only writes -------------------------------------------

create or replace function public.live_award_add(p_key text, p_device uuid, p_points integer, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is distinct from 'presenter' then raise exception 'not_presenter'; end if;
  insert into live_awards (room, device_id, points, reason)
    values ('big-reveal', p_device, p_points, left(coalesce(p_reason,''), 80));
end $$;

create or replace function public.live_ai_guess_set(p_key text, p_poll text, p_guess integer, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is distinct from 'presenter' then raise exception 'not_presenter'; end if;
  insert into live_ai_guess (room, poll_key, guess_k, reasoning, at)
    values ('big-reveal', p_poll, p_guess, left(coalesce(p_reason,''), 300), now())
    on conflict (room, poll_key) do update
      set guess_k = excluded.guess_k, reasoning = excluded.reasoning, at = now();
end $$;

create or replace function public.live_price_entries(p_key text, p_poll text)
returns table(device_id uuid, choice integer)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is distinct from 'presenter' then raise exception 'not_presenter'; end if;
  return query select v.device_id, v.choice from live_votes v
    where v.room = 'big-reveal' and v.poll_key = p_poll;
end $$;

-- ---- reads for everyone in the room ----------------------------------

create or replace function public.live_ai_guess_get(p_key text, p_poll text)
returns table(guess_k integer, reasoning text)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  return query select g.guess_k, g.reasoning from live_ai_guess g
    where g.room = 'big-reveal' and g.poll_key = p_poll;
end $$;

-- THE BOARD. Points are DERIVED from real game artifacts, never stored as a
-- mutable counter: 10/poll voted (only polls the server names), 15/stump
-- question (first 3), best ring round x10, plus presenter-written awards.
-- A forged direct call can only lie to its own caller — the projector always
-- asks with the presenter key and the deck's real poll list.
create or replace function public.live_standings(p_key text, p_polls text[])
returns table(device_id uuid, initials text, emoji text, points integer)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  return query
  select p.device_id, p.initials, p.emoji,
    ( coalesce(v.n, 0) * 10
    + least(coalesce(s.n, 0), 3) * 15
    + coalesce(r.best, 0) * 10
    + coalesce(a.pts, 0) )::integer as points
  from live_players p
  left join (select w.device_id, count(distinct w.poll_key)::int as n from live_votes w
             where w.room = 'big-reveal' and w.poll_key = any(p_polls) group by w.device_id) v
    on v.device_id = p.device_id
  left join (select t.device_id, count(*)::int as n from live_stump t
             where t.room = 'big-reveal' group by t.device_id) s
    on s.device_id = p.device_id
  left join (select c.device_id, max(c.best) as best from live_scores c
             where c.room = 'big-reveal' group by c.device_id) r
    on r.device_id = p.device_id
  left join (select d.device_id, sum(d.points)::int as pts from live_awards d
             where d.room = 'big-reveal' group by d.device_id) a
    on a.device_id = p.device_id
  where p.room = 'big-reveal' and p.initials <> ''
  order by points desc, p.updated_at asc
  limit 60;
end $$;

-- Stump feed now carries the asker's jersey for projector attribution.
drop function if exists public.live_stump_list(text, integer);
create or replace function public.live_stump_list(p_key text, p_limit integer)
returns table(id bigint, question text, answer text, refused boolean, at timestamptz, initials text, emoji text)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  return query select s.id, s.question, s.answer, s.refused, s.at,
      coalesce(p.initials, ''), coalesce(p.emoji, '')
    from live_stump s
    left join live_players p on p.room = s.room and p.device_id = s.device_id
    where s.room = 'big-reveal' order by s.at desc limit greatest(1, least(p_limit, 50));
end $$;

-- The house score: how many honest refusals the room has witnessed.
create or replace function public.live_stump_stats(p_key text)
returns table(asked integer, refused integer)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  return query select count(*)::int, count(*) filter (where s.refused)::int
    from live_stump s where s.room = 'big-reveal';
end $$;

do $$ declare fn text;
begin
  foreach fn in array array[
    'live_profile_set(text,uuid,text,text)','live_profile_get(text,uuid)',
    'live_award_add(text,uuid,integer,text)','live_ai_guess_set(text,text,integer,text)',
    'live_price_entries(text,text)','live_ai_guess_get(text,text)',
    'live_standings(text,text[])','live_stump_list(text,integer)','live_stump_stats(text)'
  ] loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('grant execute on function public.%s to anon, authenticated', fn);
  end loop;
end $$;

-- One award per (device, reason): replaying a reveal in rehearsal cannot
-- double-pay a podium. Duplicate awards land as silent no-ops.
create unique index if not exists live_awards_once on live_awards (room, device_id, reason);

create or replace function public.live_award_add(p_key text, p_device uuid, p_points integer, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is distinct from 'presenter' then raise exception 'not_presenter'; end if;
  insert into live_awards (room, device_id, points, reason)
    values ('big-reveal', p_device, p_points, left(coalesce(p_reason,''), 80))
    on conflict (room, device_id, reason) do nothing;
end $$;
