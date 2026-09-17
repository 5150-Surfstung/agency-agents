# The Equipped Agent — The Claude Course

A one-hour course that teaches working agents real AI skills, hands each of them
an assistant they build themselves, and recruits for The AGENT Connection™ by
teaching first and pitching last.

Sponsored by Mike Olson with The Agent Connection · built with Surfstung Systems.
Mike Olson, REALTOR® · eXp Realty.

## What's in this package

| File | What it is |
|---|---|
| `course-outline.md` | The facilitator run sheet — slide by slide, with console keys, pre-flight, and the same-day follow-up |
| `fb-post.md` | Facebook group launch kit: three post variants, the comment-keyword capture, the follow-up DM, the required attribution line |
| `landing/index.html` | The course as a scroll experience — published as a Claude artifact, posted to the group |

**The live room itself lives in `projects/equipped-agent-live/`** — a separate
Next.js app (polls, both games, the seed, the leaderboard, lead capture, the
presenter console). See its `HANDOFF.md` for URLs, keys, and what's left to arm.

## The design in one paragraph

The course is the funnel. Seventeen slides in sixty minutes: hook on the
equipped/unequipped split (2025 NAR data), teach where AI actually pays, demo the
Neighborhood Index (11-year MLS farming asset), play a Price Is Right on a real
local closing, demo the grounded per-listing assistant (QR → answer → lead on the
agent's phone in under 60s), let the whole room try to make that assistant guess
at something it doesn't know, demo Track to Keys, then hand every attendee the
seed — one copy-paste that turns their own free Claude account into their own
branded assistant in about four minutes. One honest pitch at minute 54, then a
four-rung ladder where the votes themselves are the leads.

## Operating rules

- Never claim a number that can't be defended on real data. Everything traces to
  the 2025 NAR member data or the eleven-year CHS Regional MLS series behind the
  published Neighborhood Index.
- Demos are live or clearly labeled replays. No faked confirmations — the app is
  built the same way, so the Stump game goes dark rather than guessing and the
  price reveal admits when a real closing isn't loaded.
- Every captured lead gets a response within the hour. Capture without follow-up
  is a dropped lead.
- Teach generously — the prompts are the ad.

## Before it ships

- [ ] Arm the AI engine on the live app (see `equipped-agent-live/HANDOFF.md` — one
      Vercel setting), then run the selftest with `&deep=1` until it's fully green
- [ ] Load a real closing into the Price Is Right slide and a live listing's fact
      sheet into Stump
- [ ] Mike's bio numbers for the host slide count-ups (years inspecting, homes
      inspected, multifamily doors)
- [ ] Fill `[ARTIFACT LINK]`, `[DATE / PLACE]` in `fb-post.md`
- [ ] Check the target group's promo rules before posting links
