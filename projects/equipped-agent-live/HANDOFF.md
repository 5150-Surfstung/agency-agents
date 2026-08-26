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

### 1. Arming the engine — where the key has to live

Vercel still has `main` as this project's production branch, so every build off
`claude/agent-connection-real-estate-ai-odi1e2` is a **Preview** deployment — and
Production env vars never reach Preview builds. A key added with
`vercel env add ANTHROPIC_API_KEY production` therefore sits in the right project
and the wrong bucket, and `engineOnline` reads `false`.

So the key goes in the **preview** bucket:

```bash
cd $(mktemp -d) && npx vercel link --project the-equipped-agent --scope surfstung-systems --yes
npx vercel env add ANTHROPIC_API_KEY preview
```

Then push any commit to this branch to rebuild.

Verify: `/api/selftest?key=<presenter-key>&deep=1` →
`"engineOnline":true` **and** an `engine: grounded round-trip` check that passes.
That check makes one real Haiku call against the demo fact sheet and fails unless
the assistant both states a sheet fact (4 bed) and refuses an off-sheet one (roof
year). It costs a fraction of a cent. Run it before every real room.

> **Cosmetic, optional:** to serve the room from
> `the-equipped-agent-surfstung-systems.vercel.app` instead of the long branch
> alias, set the production branch to this branch under
> Settings → **Environments → Production** (Vercel moved this out of the Git tab).
> Do that and the key belongs in the `production` bucket instead. Nobody types
> the URL in a live room — they scan the QR — so this is polish, not a blocker.

### 2. Optional — the speed-to-lead buzz

Same bucket rule as above: `preview` while this branch is a preview branch.

```bash
npx vercel env add TWILIO_ACCOUNT_SID preview
npx vercel env add TWILIO_AUTH_TOKEN preview
npx vercel env add TWILIO_FROM preview        # the Twilio number
npx vercel env add LEAD_ALERT_TO preview      # Mike's cell
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
- **Swap Stump's fact sheet**: `src/lib/deck.ts` → `STUMP_FACTS` → a live listing's real sheet.
- Push to this branch = auto-deploy. Run `npm run walkthrough` before pushing (all checks must stay green — fresh `npm run start` first; a server carrying state from a previous run fails the tally checks by design).

## Loaded and verified (no action needed)

- **Price game** runs on the published Stonoview Index (466 closings, Charleston
  Trident MLS, updated July 27 2026): the room prices a 4-bed ~2,200 sq ft
  Stonoview resale; the reveal shows the room's histogram vs. what $327/sq ft
  blended arithmetic claims ($719K) vs. what the 22 comparable homes actually
  closed at (median $797K — labeled **ACTUALLY CLOSED**, never "SOLD," because
  it is a median of real closings, not one house's price). The $78K gap is the
  lesson; the source line renders under the reveal.
- **Host slide** count-ups: 1,800 homes inspected since 2004 · 18 years selling ·
  346 multifamily units owned in part · Surfstung Systems founded two years ago
  (in the lines).
- **Farming demo slide** now carries the index's real headline numbers: 466
  closings, 11 years, premium 28.6% → 20.5% in twelve months.

## Everything else

- HQ artifact (share w/ Sean): https://claude.ai/code/artifact/8ab6df02-a395-4b29-8481-1c47c2e2b777
- FB course page artifact: https://claude.ai/code/artifact/1e2ac359-37d5-4bbf-85ad-02cfdcd93d99
- FB launch kit + facilitator run sheet: `projects/agent-connection/equipped-agent-course/`
- Supabase dashboard: https://supabase.com/dashboard/project/iwotispqqcnkrbcnvozq
- The seed prompt (the giveaway): `src/lib/prompts.ts` → `SEED_PROMPT`
- The live Stonoview Index (the demo tab): https://stonoview-index.vercel.app
