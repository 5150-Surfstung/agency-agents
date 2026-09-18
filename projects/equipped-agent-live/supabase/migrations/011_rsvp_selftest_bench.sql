-- THE BOOKING PROVES ITSELF — WITHOUT EVER COUNTING AS A GUEST.
--
-- The booking is the only thing on the public invite a visitor can press, and
-- until now the selftest did not touch it. That is the same shape of gap that
-- let the metering instrument return 500 to every stranger for weeks: the
-- steps all passed, and none of them ran the route a visitor actually runs.
--
-- Covering it means the selftest has to write a real reservation, which walks
-- straight into the rule this whole project is built on: never claim a number
-- that cannot be defended. live_rsvp_count() feeds the seat count on the page.
-- A selftest booking that landed in it would make the invite overstate the
-- room by one, every time the test ran. A test that inflates a public number
-- is worse than no test.
--
-- So the selftest gets its own reference prefix and the public number benches
-- it — the same move as the blank initials that keep the selftest player off
-- THE BOARD. The prefix cannot collide with a real reference, because those
-- are minted as EA-XXXXXX and validated against that shape before they are
-- ever written.

-- THE NUMBER. Real people only.
create or replace function public.live_rsvp_count()
returns bigint language plpgsql security definer set search_path to 'public' as $$
declare n bigint;
begin
  select count(*) into n from live_rsvps where ref not like 'SELFTEST-%';
  return n;
end $$;

-- THE WALL already hides these, because show_name defaults to false and the
-- selftest never consents. Saying it out loud anyway: a name on a public page
-- should be impossible to get wrong by accident.
create or replace function public.live_rsvp_wall()
returns table(who text, brokerage text, bringing boolean)
language plpgsql security definer set search_path to 'public' as $$
begin
  return query
    select
      split_part(trim(r.name), ' ', 1) as who,
      r.brokerage,
      (length(trim(r.bringing)) > 0) as bringing
    from live_rsvps r
    where r.show_name is true
      and length(trim(r.name)) > 0
      and r.ref not like 'SELFTEST-%'
    order by r.at desc
    limit 60;
end $$;

-- CLEANUP. Anon may call this, and that is safe by construction rather than
-- by trust: it refuses any reference that is not a selftest reference, so
-- there is no argument you can pass it that deletes somebody's seat. A
-- narrow definer function beats a broad one plus a promise to be careful.
create or replace function public.live_rsvp_selftest_clear(p_ref text)
returns bigint language plpgsql security definer set search_path to 'public' as $$
declare n bigint;
begin
  if p_ref is null or p_ref not like 'SELFTEST-%' then
    raise exception 'refusing to delete a real reservation';
  end if;
  delete from live_rsvps where ref = p_ref;
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on function public.live_rsvp_count() to anon, authenticated;
grant execute on function public.live_rsvp_wall() to anon, authenticated;
grant execute on function public.live_rsvp_selftest_clear(text) to anon, authenticated;
