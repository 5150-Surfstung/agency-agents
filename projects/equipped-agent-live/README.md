# The Equipped Agent — Live

The standalone live-room app for The Equipped Agent hour. Separate from the Agent Connection site, built to run *with* it: the deck frames the Track to Keys / AI-assistant / neighborhood-systems demos, the closing poll feeds leads straight to the presenter's console, and the whole thing speaks the Big REveal visual language.

One URL does everything:

| Route | Who | What |
|---|---|---|
| `/` | attendees | join with the room PIN (the QR pre-fills it) |
| `/room` | attendees | poll voting → reveals → the AI tool arcade → the ladder |
| `/present/<LIVE_PRESENTER_KEY>` | presenter | the projector deck + console: keyboard-driven slides, live tallies, leads drawer, QR overlay |

**Presenter keys:** `→ / ←` slides · `space` opens then reveals a poll · `L` leads drawer · `Q` join-QR overlay. Presenter cues render small at the bottom of the projector view — attendees never receive them (the state API sends public slide fields only).

## The hour, encoded

`src/lib/deck.ts` is the run sheet: 13 slides, 3 polls (`time` icebreaker → `build` mid-check → `ladder` close), arcade unlocked from the arcade slide onward. Every stat traces to 2025 NAR member data or the published Stonoview Neighborhood Index.

## The arcade

Two working AI tools on attendees' phones (`claude-haiku-4-5`, per the tier-split routing rule — the room is volume):

- **Build your listing's assistant** — paste real facts, get a grounded chat that states them exactly and refuses everything else (the production receptionist's property rule).
- **The Sparring Ring** — ten scored rounds vs. a seller persona; scores are parsed from the model's `SCORE:` line in code and rendered only when present.

Honesty is enforced in the API, not the copy: no `ANTHROPIC_API_KEY` → tools return 503 `offline` and the UI says so. Per-device message caps and a per-room dollar cap are checked **before** every model call.

## Run it

```bash
cp .env.example .env   # set pin, presenter key, session secret; add ANTHROPIC_API_KEY for the arcade
npm install
npm run dev            # http://localhost:3000
npm run walkthrough    # end-to-end API test against the dev server
```

No Supabase envs → in-memory store (dev and any single-node deploy). This is fine for `next start` on one box.

## Deploy (Vercel + Supabase)

Serverless lambdas share no memory, so on Vercel the Supabase store is **required**:

1. Create a Supabase project, run `supabase/migrations/001_live.sql` in its SQL editor. RLS is enabled with no policies on purpose — only the service role touches these tables; the browser never speaks to Supabase.
2. Vercel project → root directory `projects/equipped-agent-live` → env: `LIVE_ROOM_PIN`, `LIVE_PRESENTER_KEY`, `LIVE_SESSION_SECRET`, `ANTHROPIC_API_KEY`, `LIVE_SPEND_CAP_USD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. After the event: `L` → CSV, and every ladder vote gets a same-hour text. That reply is the last demo.

To split this into its own repo later: `git subtree split -P projects/equipped-agent-live -b equipped-agent-live` and push that branch to a new repo — the app has no dependencies on anything outside this directory.

## Status honesty

- Memory-store path: exercised end-to-end by `scripts/walkthrough.mjs`.
- Supabase-store path: written to the same interface, **not yet run against a live project** — provisioning is a deploy-time step. Exercise the walkthrough against a deployed URL before the first real room.
- Arcade with a live key: the walkthrough runs grounding checks (states a fact, refuses an unknown) when `ANTHROPIC_API_KEY` is set.

<!-- vercel: linked as the-equipped-agent; previews build from this branch -->
