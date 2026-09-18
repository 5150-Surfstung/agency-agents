-- WHERE AN AGENT'S LEADS LAND, IN WRITING.
--
-- The assistant answers a stranger at eleven at night; the agent is asleep.
-- A text was the only way it could reach them, and a text needs Twilio: an
-- account, a number, a per-message fee, and a deployment holding all three.
-- Email needs a sender domain and nothing else, so it becomes the channel an
-- agent can actually be given on day one and the text stays as the upgrade.
alter table public.live_assistants add column if not exists owner_email text not null default '';

create or replace function public.live_assistant_owner_email(p_code text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v text;
begin
  select owner_email into v from live_assistants where code = upper(trim(p_code));
  return coalesce(v, '');
end $$;

-- Set on the owner's own assistant, by the device that made it — the same
-- ownership test the cell already uses. No key involved, and nobody can point
-- somebody else's leads at their own inbox.
create or replace function public.live_assistant_set_owner_email(
  p_code text, p_device uuid, p_email text
) returns boolean language plpgsql security definer set search_path to 'public' as $$
declare ok boolean;
begin
  update live_assistants
     set owner_email = left(trim(coalesce(p_email, '')), 160)
   where code = upper(trim(p_code))
     and device_id = p_device
  returning true into ok;
  return coalesce(ok, false);
end $$;

grant execute on function public.live_assistant_owner_email(text) to anon, authenticated;
grant execute on function public.live_assistant_set_owner_email(text, uuid, text) to anon, authenticated;
