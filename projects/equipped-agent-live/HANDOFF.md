# HANDOFF — The Equipped Agent Claude Course

**For the next Claude session (run it LOCALLY on Mike's Mac — local sessions have
the Vercel CLI and key files this cloud sandbox could not touch).**

## State: built, deployed, proven

- **Live room:** https://the-equipped-agent-git-claude-agent-co-dde968-surfstung-systems.vercel.app (PIN `1054`)
- **Console:** `/present/dev-presenter` · **Seed:** `/seed` · **Selftest:** `/api/selftest?key=dev-presenter`
- Production selftest: 8/8 green on the `supabase` backend. Local walkthrough: 38/38 green (`npm run walkthrough`).
- Deck (17 slides): title → **host intro (Mike Olson, Technology & Innovation Director; Inspector→Agent→Multifamily→Tech)** → poll → split → where-AI-pays → farming demo → **Price Is Right** → poll → assistant demo → **Stump the Assistant** → T2K demo → **the Seed** (build-your-own on their own Claude) → **leaderboard** (self-reported ring scores) → playbook → the room → ladder (lead capture + one-tap email to mike@mikeolsonre.com cc melaniejager@thejagergroup.com) → close (eXp Realty attribution).
- Cost model per Mike: **no arcade**; attendees build on their own free Claude accounts via the seed. Only Stump touches `ANTHROPIC_API_KEY` (Haiku, hard caps in `src/lib/ai.ts`).
- Architecture: Next.js on Vercel (project `the-equipped-agent`, team `surfstung-systems`, git-linked to this branch, root `projects/equipped-agent-live`). All state in Supabase project `iwotispqqcnkrbcnvozq` behind security-definer RPCs (`live_*`); PIN + presenter key live in the sealed `live_config` table — **not env**. App ships zero secrets.

## Finish list

### 1. The one click that arms the engine (do this first)

`ANTHROPIC_API_KEY` is already in the project's **Production** environment bucket.
The URL we've been serving (`...-git-claude-agent-co-dde968-...`) is technically a
**Preview** deployment, because Vercel still has `main` set as the production
branch — and Production env vars never reach Preview builds. That's the whole
reason `engineOnline` reads `false`.

Fix, once, permanently:
<https://vercel.com/surfstung-systems/the-equipped-agent/settings/git>
→ **Production Branch** → `claude/agent-connection-real-estate-ai-odi1e2` → Save.

Then push any commit to this branch. The next build is a *Production* build, it
inherits the key, and it lands on the clean URL:
**https://the-equipped-agent-surfstung-systems.vercel.app**

Verify: `/api/selftest?key=dev-presenter&deep=1` →
`"engineOnline":true` **and** an `engine: grounded round-trip` check that passes.
That check makes one real Haiku call against the demo fact sheet and fails unless
the assistant both states a sheet fact (4 bed) and refuses an off-sheet one (roof
year). It costs a fraction of a cent. Run it before every real room.

### 2. Optional — the speed-to-lead buzz

```bash
cd $(mktemp -d) && npx vercel link --project the-equipped-agent --scope surfstung-systems --yes
npx vercel env add TWILIO_ACCOUNT_SID production
npx vercel env add TWILIO_AUTH_TOKEN production
npx vercel env add TWILIO_FROM production        # the Twilio number
npx vercel env add LEAD_ALERT_TO production      # Mike's cell
```

Until those exist the console shows `sms: off` and the ladder still captures
leads — it just doesn't text. Honest either way; nothing fakes a send.

### 3. Housekeeping

Delete the two dead stub projects (leftovers from the blocked file-deploys):
<https://vercel.com/surfstung-systems/equipped-agent-live/settings> → Delete Project

## Before a real room

- **Rotate keys** (PIN + presenter key) — one SQL statement on Supabase project `iwotispqqcnkrbcnvozq`:
  `update live_config set pin='<4 digits>', presenter_key='<long-random>' where id;`
  (attendees re-join; console URL becomes `/present/<new-key>`)
- **Load a real closing** into the Price Is Right slide: `src/lib/deck.ts` → `price-game` → set `soldK` + exact `facts` (defensible numbers only — the reveal shows an honest "not loaded" badge until then).
- **Swap Stump's fact sheet**: `src/lib/deck.ts` → `STUMP_FACTS` → a live listing's real sheet.
- **Mike's bio numbers** on the host slide (`id: "host"`): years inspecting, homes inspected, multifamily doors — add as `stats` for count-up animation.
- Push to this branch = auto-deploy. Run `npm run walkthrough` before pushing (38 checks must stay green).

## Everything else

- HQ artifact (share w/ Sean): https://claude.ai/code/artifact/8ab6df02-a395-4b29-8481-1c47c2e2b777
- FB course page artifact: https://claude.ai/code/artifact/1e2ac359-37d5-4bbf-85ad-02cfdcd93d99
- FB launch kit + facilitator run sheet: `projects/agent-connection/equipped-agent-course/` (run sheet predates the games — refresh it against the 17-slide deck)
- Supabase dashboard: https://supabase.com/dashboard/project/iwotispqqcnkrbcnvozq
- The seed prompt (the giveaway): `src/lib/prompts.ts` → `SEED_PROMPT`
