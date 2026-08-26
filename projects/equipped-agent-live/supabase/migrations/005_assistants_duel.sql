-- THE TROPHY + THE DUEL. Applied to the live project via MCP on 2026-08-26;
-- kept here as the record. See 004 for the jersey/board layer this builds on.
--
-- NOTE the aliasing in live_duel_stats: its OUT columns (fired/held/flagged/
-- built) shadow live_attacks' own columns, so an unqualified `flagged` is
-- ambiguous at runtime. Production's selftest caught that; the memory store
-- never could. Every table in these bodies is aliased for the same reason.

create table if not exists live_assistants (
  code text primary key,
  room text not null default 'big-reveal',
  device_id uuid not null,
  agent_name text not null,
  brokerage text not null default '',
  cell text not null default '',
  headline text not null default '',
  facts text not null,
  voice text not null default 'warm',
  created_at timestamptz not null default now()
);
create index if not exists live_assistants_room_device on live_assistants (room, device_id);

create table if not exists live_assistant_leads (
  id bigint generated always as identity primary key,
  code text not null,
  name text not null,
  cell text not null,
  question text not null default '',
  at timestamptz not null default now()
);
create index if not exists live_assistant_leads_code on live_assistant_leads (code, at desc);

create table if not exists live_attacks (
  id bigint generated always as identity primary key,
  room text not null default 'big-reveal',
  code text not null,
  attacker uuid not null,
  question text not null,
  answer text not null default '',
  refused boolean not null default false,
  flagged boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists live_attacks_room_at on live_attacks (room, at desc);

alter table live_assistants enable row level security;
alter table live_assistant_leads enable row level security;
alter table live_attacks enable row level security;

-- Function bodies live in the applied migrations; this file records the
-- schema and the aliasing rule. Re-apply from the project history if the
-- database is ever rebuilt from scratch.
