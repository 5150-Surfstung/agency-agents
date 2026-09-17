-- The presenter's console may read the current room PIN — it renders the
-- always-on join QR/badge, and the QR itself carries ?pin= so a scan lands a
-- phone straight in the room. Presenter key only; attendees and anon get null.
-- (Applied to the live project via MCP on 2026-08-26; kept here as the record.)

create or replace function public.live_room_pin(p_key text)
returns text
language sql
security definer
set search_path = public
as $$
  select pin from live_config where presenter_key = p_key limit 1;
$$;

revoke all on function public.live_room_pin(text) from public;
grant execute on function public.live_room_pin(text) to anon, authenticated;
