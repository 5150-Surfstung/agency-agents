---
name: val
description: Surfstung pattern library — build skeletons, commercial shape, and operating doctrine. Load at the START of any build, quote, scoping call or architecture decision, and whenever the task mentions bookings/tours/charters/rentals, QR codes or physical-to-digital lead capture, per-item cost at volume or model routing, staged pipelines with review gates, agentic code review or CI, data that can't leave a client's building (HIPAA/CJIS/on-prem/air-gap), pricing/packaging/retainers, or a rep-facing iPad consult. ALSO the capture path — fires on "add to Val", "save this to Val", "Val this", or any end-of-session wrap-up.
---

# Val

Two modes. `doctrine.md` is read in both — it is always on, no trigger required.

## READ — the default
Read `catalog.md`. Match a trigger → pull that ONE shelf → apply it.
No trigger matches → say so in one line and work without a shelf.
Never read shelves speculatively. Never quote a shelf back at the user; apply it.
Pulling a shelf whose `Confirmed:` is unproven → say it is a hypothesis, once.

## CAPTURE — on "add to Val"
Default is REJECT. Almost nothing that happens in a session is a pattern.

Admission test. All four, or it does not go in:
1. **Reusable** — applies to a different client, a different repo, next quarter.
2. **Non-obvious** — a competent operator would not have defaulted to it.
3. **Load-bearing** — getting it wrong costs money, time, or the deal.
4. **Durable** — survives the model, the framework, the vendor changing. If it dies with a version number, it is not a pattern.

Then, in order:
- **Scrub.** Val is a pushed repo. No client names under NDA, no credentials, no private URLs, no number you could not defend in public.
- **Compress.** If it will not survive as ≤3 bullets, it is a narrative. Cut it or cut it down.
- **Place it.** Fits a shelf → add the bullets, and strengthen that shelf's `Never:` if you learned a new way to fail. Failure modes are worth more than the happy path.
- **Or open one.** New shelf on the schema + a router row in `catalog.md` — write the TRIGGER, not a description.
- **Date it.** Update `Confirmed:` on every shelf this session proved or disproved.
- **Check and commit.** `./check.sh`, then `Val: <what changed>`.

Report in exactly this form, nothing else:
`Added: <shelf> — <one line>`
`Sharpened: <shelf> — <one line>`
`Rejected: <thing> — failed <which test>`

Rejecting everything is the common outcome. Say so in one line and stop.
