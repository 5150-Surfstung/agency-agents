-- THE OPEN FLOOR. "Brag or confess" was two minutes of Mike working the room
-- with nothing on the screen and nothing to take away. This makes it the first
-- moment Val does something FOR a specific person in the room, by name of
-- their own story.
--
-- The shape of it:
--   · an attendee types a brag or a confession on their phone, anonymously
--   · it lands on the presenter console — and NOWHERE ELSE
--   · Mike reads it out, picks one, and sends it to Val
--   · Val answers on the big screen: what they did well, then the one thing
--     she adds on top of it
--
-- NOTHING REACHES THE PROJECTOR WITHOUT THE PRESENTER TAPPING IT. That is the
-- whole security model of this table and it is deliberate: a free-text box
-- pointed at a wall in front of forty colleagues is a real risk, and gating it
-- behind one human tap costs nothing. `shown_at` is null until Mike sends it,
-- and the big screen only ever reads the one row he has sent.
--
-- Threat model, same as everywhere else here: the anon key is public, so a
-- determined attendee could post a second entry or a long one. Both are bounded
-- (length is truncated, the console shows every entry with its time) and
-- neither reaches the room without a human deciding it should.

create table if not exists live_brags (
  id bigint generated always as identity primary key,
  room text not null default 'big-reveal',
  device_id uuid not null,
  -- 'brag' | 'confess'
  kind text not null,
  body text not null,
  -- Val's answer, written back when the presenter sends it.
  reply text not null default '',
  -- null until a human puts it on the projector.
  shown_at timestamptz,
  at timestamptz not null default now()
);
create index if not exists live_brags_room_at on live_brags (room, at desc);
create index if not exists live_brags_shown on live_brags (room, shown_at desc);

alter table live_brags enable row level security;

-- ---- the phone writes ------------------------------------------------

create or replace function public.live_brag_add(p_key text, p_device uuid, p_kind text, p_body text)
returns bigint language plpgsql security definer set search_path to 'public' as $$
declare v_id bigint;
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  if p_kind not in ('brag', 'confess') then raise exception 'bad_kind'; end if;
  if length(coalesce(trim(p_body), '')) < 4 then raise exception 'too_short'; end if;
  insert into live_brags (device_id, kind, body)
    values (p_device, p_kind, left(trim(p_body), 400))
    returning id into v_id;
  return v_id;
end $$;

-- ---- the console reads -----------------------------------------------

create or replace function public.live_brag_list(p_key text, p_limit integer default 40)
returns table(id bigint, kind text, body text, reply text, shown boolean, at timestamptz)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is distinct from 'presenter' then raise exception 'not_presenter'; end if;
  return query
    select b.id, b.kind, b.body, b.reply, (b.shown_at is not null), b.at
    from live_brags b
    where b.room = 'big-reveal'
    order by b.at desc
    limit greatest(1, least(coalesce(p_limit, 40), 200));
end $$;

-- ---- the presenter sends one to the wall ------------------------------

create or replace function public.live_brag_answer(p_key text, p_id bigint, p_reply text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is distinct from 'presenter' then raise exception 'not_presenter'; end if;
  -- Only one thing is on the projector at a time.
  update live_brags set shown_at = null where room = 'big-reveal' and shown_at is not null;
  update live_brags set reply = left(coalesce(p_reply, ''), 2000), shown_at = now()
    where id = p_id and room = 'big-reveal';
end $$;

-- ---- what the big screen and the phones may see -----------------------
-- Exactly one row, and only ever one a human has sent.

create or replace function public.live_brag_current(p_key text)
returns table(id bigint, kind text, body text, reply text)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  return query
    select b.id, b.kind, b.body, b.reply
    from live_brags b
    where b.room = 'big-reveal' and b.shown_at is not null
    order by b.shown_at desc
    limit 1;
end $$;

create or replace function public.live_brag_clear(p_key text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is distinct from 'presenter' then raise exception 'not_presenter'; end if;
  update live_brags set shown_at = null where room = 'big-reveal' and shown_at is not null;
end $$;

do $$ declare fn text;
begin
  foreach fn in array array[
    'live_brag_add(text,uuid,text,text)','live_brag_list(text,integer)',
    'live_brag_answer(text,bigint,text)','live_brag_current(text)','live_brag_clear(text)'
  ] loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('grant execute on function public.%s to anon, authenticated', fn);
  end loop;
end $$;
