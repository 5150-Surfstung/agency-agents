# Capture — "add to Val"
Default is REJECT. Almost nothing that happens in a session is a pattern.

Admission — all four, or it stays out:
1. Reusable — a different client, a different repo, next quarter.
2. Non-obvious — a competent operator would not have defaulted to it.
3. Load-bearing — getting it wrong costs money, time, or the deal.
4. Durable — survives the model, framework, or vendor changing. Dies with a version number → not a pattern.

Then, in order:
- Scrub. Val is a pushed repo: no NDA names, credentials, private URLs, or numbers you couldn't defend in public.
- Compress. ≤3 bullets or it's a narrative — cut it down or cut it.
- Place. Fits a shelf → add the bullets; a new way to fail → strengthen that shelf's `Never:` (failure modes outrank the happy path).
- Or open a shelf: schema below + a router row in catalog.md — write the TRIGGER, not a description.
- Date. Update `Confirmed:` on every shelf this session proved or disproved.
- `./check.sh` → commit `Val: <what changed>` → push.

Report in exactly this form, nothing else:
`Added: <shelf> — <one line>`
`Sharpened: <shelf> — <one line>`
`Rejected: <thing> — failed <which test>`
Rejecting everything is the common outcome. One line, stop.

## Shelf schema — enforced by check.sh
`# Name` → `Pull when:` → ≤10 bullets → `Never:` → `Confirmed: YYYY-MM — where proven` → `Done when:` → ≤15 lines.
One pattern per shelf. No narratives, no war stories, no status.

## Prune
A shelf a cold agent can't act on in under a minute, or one that never earns a pull → cut it.
Shelves shrink over time; only the router grows.

## NOT Val
Project status. Client-specific facts. Single-repo specifics. Brand, stack, house rules (global CLAUDE.md owns those).
