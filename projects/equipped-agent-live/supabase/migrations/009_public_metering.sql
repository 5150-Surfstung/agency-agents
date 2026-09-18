-- PUBLIC METERING, RECOVERED INTO THE REPO.
--
-- This shipped straight to the database during the session that found the bug
-- it fixes, and the SQL never landed here. Written out now from the deployed
-- definitions so the schema can be rebuilt from the repository alone.
--
-- The bug: every metering call gated on live_check_key() and raised 'bad_key'
-- for anyone without a presenter key. The room key is an AUTH TOKEN, not a
-- partition — so the instrument on the public invite returned 500 to every
-- visitor who was not Mike. The selftest missed it for a year of session-time
-- because the selftest passed a valid presenter key, which tested the prompt
-- and never the route.
--
-- So these three are keyless. What keeps them safe is not a secret, it is the
-- bounds: a per-device flood ceiling, a clamp on every number that goes in,
-- and a room string that partitions counters without authorising anything.

create or replace function public.live_meter_log(
  p_room text, p_device uuid, p_tool text,
  p_in integer, p_out integer, p_cost numeric
) returns void language plpgsql security definer set search_path to 'public' as $$
declare r text := coalesce(nullif(p_room, ''), 'public'); n bigint;
begin
  select count(*) into n from live_tool_events
   where room = r and device_id = p_device and at >= now() - interval '24 hours';
  if n >= 300 then raise exception 'device_flood'; end if;
  insert into live_tool_events (room, device_id, tool, in_tokens, out_tokens, cost_usd)
  values (
    r, p_device, p_tool,
    greatest(0, least(coalesce(p_in, 0), 1000000)),
    greatest(0, least(coalesce(p_out, 0), 1000000)),
    greatest(0, least(coalesce(p_cost, 0), 0.05))
  );
end $$;

create or replace function public.live_meter_count(
  p_room text, p_device uuid, p_seconds integer
) returns bigint language plpgsql security definer set search_path to 'public' as $$
declare n bigint;
begin
  select count(*) into n from live_tool_events
   where room = coalesce(nullif(p_room, ''), 'public')
     and device_id = p_device
     and at >= now() - make_interval(secs => greatest(1, least(p_seconds, 2592000)));
  return n;
end $$;

create or replace function public.live_meter_spend(p_room text)
returns numeric language plpgsql security definer set search_path to 'public' as $$
declare s numeric;
begin
  select coalesce(sum(cost_usd), 0) into s from live_tool_events
   where room = coalesce(nullif(p_room, ''), 'public');
  return s;
end $$;

grant execute on function public.live_meter_log(text, uuid, text, integer, integer, numeric) to anon, authenticated;
grant execute on function public.live_meter_count(text, uuid, integer) to anon, authenticated;
grant execute on function public.live_meter_spend(text) to anon, authenticated;
