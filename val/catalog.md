# VAL — Surfstung Pattern Library
`doctrine.md` is always on — read it every time, no trigger needed.
Shelves are conditional: match a trigger → pull that ONE shelf → apply. No match = no pull.

## Router
| Pull when the task involves… | Shelf |
|---|---|
| pricing, packaging, scoping, retainers, "how do we charge for this" | shelves/deal-shape.md |
| tour, charter, rental, day pass, attraction, vendor market, "take bookings/deposits online" | shelves/booking-vertical.md |
| QR code, yard sign, rider, table tent, sticker, "scan to…", per-listing page, lead capture | shelves/speed-to-lead-qr.md |
| the same operation run N times (per item/listing/row), cost per run, "this is expensive" | shelves/model-routing.md |
| sequential stages, human review gates, a process that reruns, handoff between agents | shelves/icm-workflow.md |
| any agent writing code, reviewing a diff, CI, "why does it keep breaking the same way" | shelves/review-loop.md |
| "data can't leave the building", HIPAA/CJIS/legal/defense, air-gap, self-host, egress | shelves/onprem-runtime.md |
| iPad/tablet in front of a customer, in-home close, guided consult, rep-facing flow | shelves/ux-inhome-sales.md |

Two shelves may both apply (a QR-driven booking build) — pull both only if the task truly spans them.

## Precedence
Client's stated constraint > global CLAUDE.md (brand/stack) > doctrine.md > shelves.

## Shelf schema — enforced by check.sh
`# Name` → `Pull when:` → ≤10 bullets → `Never:` → `Confirmed:` → `Done when:` → ≤15 lines.
One pattern per shelf. No narratives, no war stories, no status.
`Confirmed:` is a date plus where it was proven. An unconfirmed shelf is a hypothesis — say so when you pull it.

## Add / Prune
Capture protocol is in SKILL.md; the default is reject.
Prune on sight: a shelf a cold agent can't act on in under a minute, or one that has never earned a pull, gets cut.
Shelves shrink over time. Only the router grows.

## NOT Val
Project status. Client-specific facts. Single-repo specifics. Brand, stack, house rules (global CLAUDE.md owns those).
