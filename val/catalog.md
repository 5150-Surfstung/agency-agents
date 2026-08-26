# VAL — Surfstung Pattern Library
What works, distilled. Router only. Match a trigger → pull that ONE shelf → apply.
Never pull a shelf "to be thorough." No match = no pull; you already know how to work.

## Router
| Pull when the task involves… | Shelf |
|---|---|
| tour, charter, rental, day pass, attraction, vendor market, "take bookings/deposits online" | shelves/booking-vertical.md |
| QR code, yard sign, rider, table tent, sticker, "scan to…", per-listing page, lead capture | shelves/speed-to-lead-qr.md |
| the same operation run N times (per item/listing/row), cost per run, "this is expensive" | shelves/model-routing.md |
| sequential stages, human review gates, a process that reruns, handoff between agents | shelves/icm-workflow.md |
| any agent writing code, reviewing a diff, CI, "why does it keep breaking the same way" | shelves/review-loop.md |
| "data can't leave the building", HIPAA/CJIS/legal/defense, air-gap, self-host, egress | shelves/onprem-runtime.md |
| iPad/tablet in front of a customer, in-home close, guided consult, rep-facing flow | shelves/ux-inhome-sales.md |

Two shelves may both apply (QR-driven booking build) — pull both only if the task truly spans them.

## Precedence
Client's stated constraint > global CLAUDE.md (brand/stack/rules) > Val. Val is default, not law.

## Shelf schema — no exceptions
`# Name` → `Pull when:` → ≤10 pattern bullets → `Never:` → `Done when:` → ≤15 lines total.
Atomic: one pattern per shelf. No narratives, no war stories, no status.

## Add — end of session, on "add to Val"
1. Reusable across clients and projects? No → not Val, drop it.
2. Fits a shelf → ≤3 bullets there. Doesn't → new shelf, same schema.
3. Add or sharpen its router row above — the trigger, not a description.
4. `./check.sh` → commit `Val: <what changed>`.

## Prune
Cold agent can't orient in <1 min, or the shelf has never earned a pull → cut it.
Shelves shrink over time; only the router grows.

## NOT Val
Project status. Single-repo specifics. Brand, stack, house rules (global CLAUDE.md owns those).
