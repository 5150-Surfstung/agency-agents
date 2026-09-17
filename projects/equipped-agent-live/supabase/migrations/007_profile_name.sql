-- A JERSEY HOLDS A NAME, NOT THREE CAPITALS.
--
-- Attendees used to type three initials. They now name their assistant — the
-- thing they are about to build — and that name rides every vote, guess, shot
-- fired in the duel and row on THE BOARD. Thirty seconds after walking in they
-- have stopped thinking of it as "an AI" and started thinking of it as theirs,
-- which is worth more at minute fifty-five than any closing slide.
--
-- The column is still called `initials` end to end. Renaming it would touch
-- every RPC, route and screen in the app to buy nothing; the name is what it
-- holds, and this comment is the note that says so.
--
-- Applied to the project on 2026-09-17 as `profile_holds_a_name_not_initials`;
-- written to a file after the fact so the repo and the database agree.

create or replace function public.live_profile_set(p_key text, p_device uuid, p_initials text, p_emoji text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if live_check_key(p_key) is null then raise exception 'bad_key'; end if;
  insert into live_players (room, device_id, initials, emoji, updated_at)
    values ('big-reveal', p_device,
            -- letters, digits, spaces, apostrophes and hyphens; spaces
            -- collapsed; fourteen characters, which is as much as a board row
            -- can hold without the points falling off the end.
            left(regexp_replace(
              regexp_replace(coalesce(p_initials, ''), '[^a-zA-Z0-9 ''\-]', '', 'g'),
              '\s+', ' ', 'g'
            ), 14),
            left(coalesce(p_emoji, ''), 8), now())
    on conflict (room, device_id) do update
      set initials = excluded.initials, emoji = excluded.emoji, updated_at = now();
end $$;
