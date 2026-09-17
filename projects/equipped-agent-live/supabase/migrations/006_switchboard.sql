-- THE SWITCHBOARD. Until now every question to a deployed assistant was a
-- one-shot: no memory, no transcript, nobody watching. That is not how a real
-- front desk works. This makes a conversation a THREAD, and lets a human take
-- the wheel mid-sentence — the presenter for any thread in the room, the
-- attendee for the threads on the assistant they built.
--
-- The rules the schema enforces:
--   · operator = '' means the AI has the wheel. Non-empty means a human does,
--     and /api/ask refuses to auto-answer until it is released.
--   · a thread id is a client-minted uuid. Holding it IS the capability to
--     read that thread — the same unguessable-token model the assistant codes
--     already use. Nothing about a thread identifies a person.
--   · reading or writing ACROSS threads needs a key, and a non-presenter key
--     only reaches threads on assistants that device actually built.
--
-- Threat model, stated plainly and unchanged from 005: the anon key is public,
-- so the visitor-side functions are reachable by anyone who has a thread id.
-- Forging a message into your own thread is the same class of mischief as
-- forging a lead, and carries the same answer: it is a class demo, the console
-- shows every message with its role, and nothing here is a system of record.

create table if not exists live_threads (
  id uuid primary key,
  code text not null,
  visitor_label text not null default '',
  -- '' = the AI answers. A name = that human has the wheel.
  operator text not null default '',
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now()
);
create index if not exists live_threads_code_last on live_threads (code, last_at desc);

create table if not exists live_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null,
  -- visitor | assistant | agent | system
  role text not null,
  body text not null,
  refused boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists live_messages_thread on live_messages (thread_id, id);

alter table live_threads enable row level security;
alter table live_messages enable row level security;

-- ---------------------------------------------------------------- visitor side

create or replace function live_thread_open(p_thread uuid, p_code text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from live_assistants a where a.code = upper(p_code)) then
    raise exception 'no_assistant';
  end if;
  insert into live_threads (id, code) values (p_thread, upper(p_code))
    on conflict (id) do nothing;
end $$;

create or replace function live_thread_append(
  p_thread uuid, p_code text, p_role text, p_body text, p_refused boolean default false
) returns bigint language plpgsql security definer set search_path to 'public' as $$
declare v_id bigint;
begin
  -- Only the two roles a visitor's browser legitimately produces. A human
  -- taking over writes through live_thread_say, which demands a key.
  if p_role not in ('visitor', 'assistant') then raise exception 'bad_role'; end if;
  perform live_thread_open(p_thread, p_code);
  insert into live_messages (thread_id, role, body, refused)
    values (p_thread, p_role, left(p_body, 4000), coalesce(p_refused, false))
    returning id into v_id;
  update live_threads t set last_at = now() where t.id = p_thread;
  return v_id;
end $$;

-- The visitor's poll AND the model's history come through here. Ascending by
-- id so "everything after what I've seen" and "the whole conversation" are the
-- same query. Returns the operator so the page can say who is talking.
create or replace function live_thread_poll(p_thread uuid, p_after bigint default 0)
returns table (id bigint, role text, body text, refused boolean, at timestamptz, operator text)
language plpgsql security definer set search_path to 'public' as $$
begin
  return query
    select m.id, m.role, m.body, m.refused, m.at, t.operator
      from live_messages m join live_threads t on t.id = m.thread_id
     where m.thread_id = p_thread and m.id > coalesce(p_after, 0)
     order by m.id asc limit 60;
end $$;

-- Whether a human has the wheel, for a thread with no new messages yet.
create or replace function live_thread_state(p_thread uuid)
returns table (operator text, msgs bigint)
language plpgsql security definer set search_path to 'public' as $$
begin
  return query
    select t.operator, (select count(*) from live_messages m where m.thread_id = t.id)
      from live_threads t where t.id = p_thread;
end $$;

create or replace function live_thread_label(p_thread uuid, p_label text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update live_threads t set visitor_label = left(coalesce(p_label,''), 60) where t.id = p_thread;
end $$;

-- ---------------------------------------------------------------- operator side

-- Presenter sees the whole room; anyone else sees only threads on assistants
-- their own device built. One predicate, used by every function below.
create or replace function live_thread_owns(p_key text, p_device uuid, p_thread uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  if live_check_key(p_key) = 'presenter' then return true; end if;
  return exists (
    select 1 from live_threads t join live_assistants a on a.code = t.code
     where t.id = p_thread and a.device_id = p_device
  );
end $$;

create or replace function live_thread_list(p_key text, p_device uuid, p_all boolean default false)
returns table (
  id uuid, code text, agent_name text, headline text, visitor_label text,
  operator text, msgs bigint, last_role text, last_body text,
  last_at timestamptz, waiting boolean
) language plpgsql security definer set search_path to 'public' as $$
declare v_role text;
begin
  v_role := live_check_key(p_key);
  if v_role is null then raise exception 'bad_key'; end if;
  -- Only the console may ask for every thread in the room.
  if p_all and v_role <> 'presenter' then raise exception 'not_presenter'; end if;
  return query
    select t.id, t.code, a.agent_name, a.headline, t.visitor_label, t.operator,
           (select count(*) from live_messages m where m.thread_id = t.id),
           (select m2.role from live_messages m2 where m2.thread_id = t.id order by m2.id desc limit 1),
           (select left(m3.body, 140) from live_messages m3 where m3.thread_id = t.id order by m3.id desc limit 1),
           t.last_at,
           -- A human holds the wheel and the visitor spoke last: somebody is
           -- sitting there watching a cursor blink. That is the red dot.
           (t.operator <> '' and
            (select m4.role from live_messages m4 where m4.thread_id = t.id order by m4.id desc limit 1) = 'visitor')
      from live_threads t join live_assistants a on a.code = t.code
     where a.room = 'big-reveal'
       and (p_all or a.device_id = p_device)
       and exists (select 1 from live_messages m5 where m5.thread_id = t.id)
     order by t.last_at desc limit 40;
end $$;

create or replace function live_thread_read(p_key text, p_device uuid, p_thread uuid)
returns table (id bigint, role text, body text, refused boolean, at timestamptz)
language plpgsql security definer set search_path to 'public' as $$
begin
  if not live_thread_owns(p_key, p_device, p_thread) then raise exception 'not_yours'; end if;
  return query
    select m.id, m.role, m.body, m.refused, m.at
      from live_messages m where m.thread_id = p_thread order by m.id asc limit 200;
end $$;

-- BREAK IN. The first time a human speaks, the thread records who, and the
-- visitor gets a system line so the handoff is never a silent impersonation.
create or replace function live_thread_say(p_key text, p_device uuid, p_thread uuid, p_who text, p_body text)
returns bigint language plpgsql security definer set search_path to 'public' as $$
declare v_id bigint; v_was text;
begin
  if not live_thread_owns(p_key, p_device, p_thread) then raise exception 'not_yours'; end if;
  select t.operator into v_was from live_threads t where t.id = p_thread;
  if v_was is null then raise exception 'no_thread'; end if;
  if v_was = '' then
    insert into live_messages (thread_id, role, body)
      values (p_thread, 'system', left(coalesce(nullif(p_who,''), 'The agent'), 60) || ' joined the chat.');
    update live_threads t set operator = left(coalesce(nullif(p_who,''), 'The agent'), 60), taken_at = now()
      where t.id = p_thread;
  end if;
  insert into live_messages (thread_id, role, body)
    values (p_thread, 'agent', left(p_body, 4000)) returning id into v_id;
  update live_threads t set last_at = now() where t.id = p_thread;
  return v_id;
end $$;

-- Hand it back. The AI resumes on the visitor's next message.
create or replace function live_thread_release(p_key text, p_device uuid, p_thread uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_was text;
begin
  if not live_thread_owns(p_key, p_device, p_thread) then raise exception 'not_yours'; end if;
  select t.operator into v_was from live_threads t where t.id = p_thread;
  if coalesce(v_was,'') = '' then return; end if;
  insert into live_messages (thread_id, role, body)
    values (p_thread, 'system', v_was || ' handed the conversation back to the assistant.');
  update live_threads t set operator = '', taken_at = null, last_at = now() where t.id = p_thread;
end $$;

-- The console's HUD counters. Aliased throughout — see the note in 005.
create or replace function live_thread_stats(p_key text)
returns table (threads bigint, waiting bigint, taken bigint, msgs bigint)
language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) <> 'presenter' then raise exception 'not_presenter'; end if;
  return query
    select (select count(*) from live_threads t1 join live_assistants a1 on a1.code = t1.code where a1.room='big-reveal'),
           (select count(*) from live_threads t2 join live_assistants a2 on a2.code = t2.code
             where a2.room='big-reveal' and t2.operator <> ''
               and (select m.role from live_messages m where m.thread_id = t2.id order by m.id desc limit 1) = 'visitor'),
           (select count(*) from live_threads t3 join live_assistants a3 on a3.code = t3.code
             where a3.room='big-reveal' and t3.operator <> ''),
           (select count(*) from live_messages m2 join live_threads t4 on t4.id = m2.thread_id
              join live_assistants a4 on a4.code = t4.code where a4.room='big-reveal');
end $$;
