-- The Equipped Agent Live — room state, votes, leads, arcade metering.
-- Single-room product ("big-reveal" slug); every table scoped by room so a
-- second room someday is a data change, not a schema change.
-- Server-only access via the service-role key; RLS locks anon out entirely.

create table if not exists live_state (
  room text primary key,
  step integer not null default 0,
  poll_state text not null default 'closed' check (poll_state in ('closed','open','revealed')),
  updated_at timestamptz not null default now()
);

create table if not exists live_votes (
  room text not null,
  poll_key text not null,
  device_id uuid not null,
  choice integer not null,
  at timestamptz not null default now(),
  primary key (room, poll_key, device_id)
);

create table if not exists live_leads (
  room text not null,
  device_id uuid not null,
  name text not null,
  cell text not null,
  rung text not null default '',
  at timestamptz not null default now(),
  primary key (room, device_id)
);

create table if not exists live_tool_events (
  id bigint generated always as identity primary key,
  room text not null,
  device_id uuid not null,
  tool text not null check (tool in ('listing','sparring')),
  in_tokens integer not null default 0,
  out_tokens integer not null default 0,
  cost_usd numeric(10,6) not null default 0,
  at timestamptz not null default now()
);
create index if not exists live_tool_events_room_device_at on live_tool_events (room, device_id, at);

create table if not exists live_presence (
  room text not null,
  device_id uuid not null,
  at timestamptz not null default now(),
  primary key (room, device_id)
);

alter table live_state enable row level security;
alter table live_votes enable row level security;
alter table live_leads enable row level security;
alter table live_tool_events enable row level security;
alter table live_presence enable row level security;
-- No policies on purpose: only the service role (which bypasses RLS) may touch
-- these tables. The browser never speaks to Supabase directly.
