-- Packs table + server-only RLS via header secret.
-- APPLIED to the shared Surfstung project with a real secret in place of
-- __LIVE_DB_SECRET__ (the deployed app sends it as the x-ea-secret header;
-- value lives in the deploy env, never in this repo). To rotate: re-run with
-- a new value and update LIVE_DB_SECRET in the deploy env.

create table if not exists live_packs (
  code text primary key,
  room text not null,
  device_id uuid not null,
  name text not null,
  brokerage text not null default '',
  area text not null default '',
  specialty text not null default '',
  tone text not null default 'warm',
  created_at timestamptz not null default now()
);
create index if not exists live_packs_device on live_packs (room, device_id);
alter table live_packs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['live_state','live_votes','live_leads','live_tool_events','live_presence','live_packs']
  loop
    execute format('drop policy if exists live_server_all on %I', t);
    execute format(
      'create policy live_server_all on %I for all to anon, authenticated
         using (coalesce(current_setting(''request.headers'', true)::json->>''x-ea-secret'','''') = %L)
         with check (coalesce(current_setting(''request.headers'', true)::json->>''x-ea-secret'','''') = %L)',
      t, '__LIVE_DB_SECRET__', '__LIVE_DB_SECRET__'
    );
  end loop;
end $$;
