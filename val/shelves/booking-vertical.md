# Booking Vertical Skeleton
Pull when: anything takes money for a time slot or a seat — tour, charter, rental, day pass, attraction, vendor market.
- Stripe Checkout, three-tier pricing default ($25/$35/$75 where tiered listings apply)
- QR slug routing: printable QR → /book/[slug] → checkout in ≤2 taps
- Twilio SMS confirmations to buyer + operator on payment
- Operator gets a dead-simple availability toggle, not a calendar app
Never: hand-roll checkout, seat maps, or a calendar UI in v1. Never require the operator to log in to accept a booking. Never add a field the buyer doesn't need to pay.
Confirmed: 2026-08 — v1 seed, production source not recorded.
Done when: a stranger scans the QR and has paid in ≤2 taps, and both phones buzz.
