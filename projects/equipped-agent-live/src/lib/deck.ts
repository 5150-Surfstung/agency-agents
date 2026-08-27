// The hour. Slide order IS the run sheet — polls sit exactly where the
// facilitator outline puts them. Every number here traces to the 2025 NAR
// member data or the published Stonoview Neighborhood Index; nothing invented.

import type { Slide } from "./types";

export const DECK: Slide[] = [
  {
    id: "title",
    kind: "title",
    eyebrow: "The AGENT Connection™ × Surfstung Systems",
    heading: "The Equipped Agent",
    lines: [
      "The Claude Course — sponsored by Mike Olson with The Agent Connection.",
      "Most agents can sell. A few can prompt. Almost none can build.",
      "One hour. Working systems, live games, and an assistant you keep.",
    ],
    cue: "Doors open. PIN on screen. Phones welcome — they're part of the show.",
  },
  {
    id: "host",
    kind: "content",
    eyebrow: "Your host",
    heading: "Mike Olson",
    stats: [
      { value: "1,800", label: "homes inspected \u2014 under them, in them, on them since 2004" },
      { value: "18", label: "years selling real estate" },
      { value: "346", label: "multifamily units owned in part" },
    ],
    lines: [
      "Technology & Innovation Director \u00b7 The Agent Connection",
      "Inspector \u2192 Agent \u2192 Multifamily \u2192 Technology. Every system tonight was built from inside the business, not sold into it.",
      "Founded Surfstung Systems two years ago and built what you're about to watch run live: the neighborhood index, the AI assistant, Track to Keys.",
      "REALTOR\u00ae \u00b7 eXp Realty",
    ],
    cue: "Thirty seconds, first person, let the numbers count up behind you: 1,800 crawlspaces taught me what agents miss, 346 doors taught me scale, two years of building taught me leverage. Then straight into the poll \u2014 don't let this slide breathe.",
  },
  {
    id: "poll-comfort",
    kind: "poll",
    eyebrow: "First — a totally anonymous confession",
    heading: "Real talk: where are you and AI right now?",
    poll: {
      key: "comfort",
      question: "Real talk: where are you and AI right now?",
      options: [
        "Never touched it — be gentle",
        "We've talked a few times",
        "I use it every week for real work",
        "My assistant has an assistant",
      ],
    },
    cue: "The icebreaker — votes are anonymous, say so, and let the bars climb while you tease each answer out loud ('be gentle — I love it'). Whatever wins: 'Perfect. This hour was built for exactly this room.' Read the extremes and remember them for the open floor two slides from now.",
  },
  {
    id: "poll-using",
    kind: "poll",
    eyebrow: "Data before opinions",
    heading: "What are you actually using AI for today?",
    poll: {
      key: "using",
      question: "What are you actually using AI for today?",
      options: [
        "Listing descriptions & emails",
        "Research, CMAs, summaries",
        "Social content",
        "Nothing yet — that's literally why I'm here",
      ],
    },
    cue: "Second poll, faster energy. On the reveal, narrate the split: 'listing copy is where everyone starts — and it's the SHALLOWEST end of the pool. By minute forty you'll be somewhere no listing-copy prompt can follow.' The 'nothing yet' number is your permission slip to keep everything hands-on.",
  },
  {
    id: "open-floor",
    kind: "content",
    eyebrow: "Open floor · two minutes",
    heading: "Brag or confess. Both count.",
    lines: [
      "Shout it out: the best thing AI has done for your business this month —",
      "or the worst. The fail. The made-up comp. The email you're glad you read twice.",
      "Best story gets named from the stage. Confessions are a safe space — the polls stay anonymous, the stories are volunteer-only.",
    ],
    cue: "WORK THE ROOM — two to three minutes, no more. Call on a 'my assistant has an assistant' voter for a brag and a 'be gentle' voter for a fear. REPEAT every story back in one line so the room hears it. The fails are your gold: 'a made-up comp — hold that thought, because in twenty minutes you're going to watch an AI REFUSE to do exactly that.' Name the best story out loud and tell them to remember it for the ladder.",
  },
  {
    id: "poll-time",
    kind: "poll",
    eyebrow: "Now the expensive question",
    heading: "Where does your week actually go?",
    poll: {
      key: "time",
      question: "Where does your week actually go?",
      options: [
        "Chasing and answering leads",
        "Paperwork, dates, deadlines",
        "Marketing and content",
        "Actual showings and appointments",
      ],
    },
    cue: "Open the poll, let it climb, reveal. Whatever wins: 'AI eats that first.'",
  },
  {
    id: "split",
    kind: "content",
    eyebrow: "The split",
    heading: "The line isn't new vs. experienced. It's equipped vs. unequipped.",
    stats: [
      { value: "60%", label: "of 1.3M licensed agents sold zero homes last year" },
      { value: "$58K", label: "average agent income, on roughly seven closings" },
      { value: "120K", label: "agents left the industry over unsustainable income" },
    ],
    lines: ["Source: 2025 NAR member data. Equipment is now a decision, not a budget."],
    cue: "Land the reframe. Nobody in this room is on the wrong side by choice.",
  },
  {
    id: "where-ai-pays",
    kind: "content",
    eyebrow: "Strategist",
    heading: "Where AI actually pays",
    lines: [
      "1 — Speed to lead: whoever owns the first sixty seconds owns the customer.",
      "2 — Neighborhood authority: research depth nobody expects from a solo agent.",
      "3 — Reps: practicing the hard conversations before they're real.",
      "The rule of the hour: never let AI say a number you can't defend.",
    ],
    cue: "Name the hype too: generic listing copy, autoresponders in a trench coat.",
  },
  {
    id: "demo-farming",
    kind: "demo",
    eyebrow: "Live demo · Neighborhood systems",
    heading: "Farm like you have a research department",
    stats: [
      { value: "466", label: "closings indexed — every sale since May 2015" },
      { value: "11", label: "years of record, not a 12-month snapshot" },
      { value: "28.6% → 20.5%", label: "Stonoview's premium over its own island, in twelve months" },
    ],
    quote:
      "When you hand a seller eleven years of their own street, you're not one of three agents interviewing. You're the one who did the homework.",
    cue: "SWITCH TO: the live Stonoview Index (stonoview-index.vercel.app) + the 29466 seven-hood plan. Scroll it live. The beat that lands: 8.1 points of premium gone in twelve months, and it is NOT a speed problem — 51.2 days for Stonoview vs 50.6 for the island. Same pace, compressed prices. A 12-month report would have missed it entirely.",
  },
  {
    id: "price-game",
    kind: "price",
    eyebrow: "Game one \u00b7 The room vs. the arithmetic vs. the record",
    heading: "What does a house like this actually close at?",
    price: {
      key: "price1",
      facts: [
        "Stonoview, Johns Island \u00b7 single-family resale",
        "4 bedrooms \u00b7 1,993\u20132,618 sq ft \u2014 call it 2,200",
        "Everything in this set closed since 2023 \u00b7 22 sales in the record",
      ],
      minK: 550,
      maxK: 1050,
      stepK: 5,
      // The median of those 22 comparable closings. A median of real sales \u2014
      // labeled as exactly that on screen, never as one house's sale price.
      soldK: 797,
      soldLabel: "ACTUALLY CLOSED",
      // $327/sq ft (the blended rate everyone quotes) \u00d7 2,200 sq ft. The trap.
      anchorK: 719,
      anchorLabel: "what $327/sq ft arithmetic claims",
      source: "The Stonoview Index \u00b7 466 recorded closings, Charleston Trident MLS \u00b7 updated July 27, 2026",
    },
    cue:
      "Space opens the slider AND locks the machine's guess from the same three facts \u2014 say it out loud: 'the AI just made its call. Same facts you have. No feelings about granite.' THE TRAP: every agent prices off blended $/sq ft \u2014 $327 \u00d7 2,200 = $719K. The record says these 22 homes closed at a median of $797K \u2014 $78,000 the arithmetic leaves on the table, and the bias runs against SMALLER homes every time. Space again: the room's histogram, the arithmetic marker, the machine's call, then the record. Podium takes 100/50/25 on THE BOARD; every phone shows its own rank. Say the middle half out loud: half of the 22 closed between $756K and $824K \u2014 a span, not a false point. 'The second number is what happened; the first is arithmetic.'",
  },
  {
    id: "poll-build",
    kind: "poll",
    eyebrow: "Check the room",
    heading: "Which would you build first?",
    poll: {
      key: "build",
      question: "Which would you build first?",
      options: [
        "The neighborhood index",
        "A listing that answers its own phone",
        "An AI sparring partner",
        "A deal that tracks itself to keys",
      ],
    },
    cue: "Reveal, then: 'Good news — you're about to watch all four.'",
  },
  {
    id: "demo-assistant",
    kind: "demo",
    eyebrow: "Live demo · The AI assistant",
    heading: "The listing that answers its own phone",
    lines: [
      "One QR per listing — the per-listing page is the product.",
      "The assistant never answers past the fact sheet. Grounded or nothing.",
      "The lead routes instantly — captured to your phone in under a minute.",
    ],
    quote: "Capture the lead before the portal does.",
    cue: "SWITCH TO: live assistant. Audience scans, asks, watch the SMS land. Phone on loud. Sean can Break In from the console.",
  },
  {
    id: "build",
    kind: "build",
    eyebrow: "Phones out \u00b7 ninety seconds",
    heading: "Now build YOUR listing's assistant.",
    lines: [
      "Paste a real fact sheet \u2014 your listing, your pocket listing, or the demo one on screen.",
      "Pick your voice. Tap Deploy. You get a live web page and a QR code that is yours.",
      "Put it on a rider tomorrow morning. It answers at 11pm and it never invents a fact.",
    ],
    cue: "THE TROPHY MOMENT \u2014 give it five full minutes and WALK THE ROOM. This is not a prompt they could have typed: it is a deployed page with their name on it and a QR they can print tonight. Watch the built counter climb on this screen. When the first one lands, put their QR on the projector and scan it yourself from the stage.",
  },
  {
    id: "duel",
    kind: "duel",
    eyebrow: "Game two \u00b7 the room vs. the room",
    heading: "Now try to break each other's.",
    lines: [
      "Pick somebody else's assistant. Ask it something their fact sheet does not cover.",
      "Every honest refusal is +15 to the agent who BUILT it \u2014 defending yours is the skill.",
      "Think you made one invent something? Hit I BROKE IT and I'll rule on it from up here.",
    ],
    cue: "The wager out loud: 'if anyone makes one invent a fact tonight, lunch is on me.' Flagged shots land on this screen for you to judge \u2014 award or dismiss from the console. The lesson to say plainly when it holds: the assistant is only as good as the fact sheet behind it, and THAT is the part they control.",
  },
  {
    id: "demo-t2k",
    kind: "demo",
    eyebrow: "Live demo · Track to Keys",
    heading: "The deal that keeps its own promises",
    lines: [
      "Six contract dates in — the full milestone chain, client portal, and notification schedule out. Under two minutes.",
      "The client sees a porch light, not a password. Plain-English dates with stakes.",
      "The agent sees an attention queue: overdue, waiting-on-others, quiet.",
    ],
    cue: "SWITCH TO: Track to Keys. Run the wizard on a real-shaped deal. Show the client view on a phone.",
  },
  {
    id: "leaderboard",
    kind: "leaderboard",
    eyebrow: "THE BOARD \u00b7 whole-night standings",
    heading: "Somebody's leaving with the crown.",
    lines: [
      "Every vote, every guess, every stump attempt, every ring round \u2014 it all counted.",
      "Post your sparring score from YOUR OWN assistant to make your final move.",
    ],
    cue: "Two boards: the night's points standings and the ring scores feeding them. Ring scores are on their honor \u2014 it's a lunch table, not the SEC. Crown the leader OUT LOUD by jersey: 'The \ud83e\udd88 shark takes it.' Screenshot moment \u2014 tell them so.",
  },
  {
    id: "playbook",
    kind: "content",
    eyebrow: "Builder",
    heading: "The one-week playbook",
    lines: [
      "Mon — pick the farm. Tue — export the solds from your MLS.",
      "Wed — run the Neighborhood Index prompt. Thu — one listing, one QR page.",
      "Fri — ten rounds in the ring before your next appointment.",
      "Everything I showed you, you can build yourself — that's why the prompts are free.",
    ],
    cue: "The toolkit is the ad. Give it away like you mean it.",
  },
  {
    id: "the-room",
    kind: "content",
    eyebrow: "Minute 55 — the only pitch of the hour",
    heading: "Build alone, or build in a room",
    lines: [
      "The difference between having tools and having systems is the room you're in.",
      "The Agent Connection is a room where all of this is already running —",
      "the lunches, the mentorship, the systems, the people who've done it.",
    ],
    cue: "SEAN'S SEGMENT. Keep it honest, keep it short — the ladder does the closing.",
  },
  {
    id: "poll-ladder",
    kind: "poll",
    eyebrow: "No dead ends",
    heading: "What's your next step?",
    poll: {
      key: "ladder",
      question: "What's your next step?",
      capture: true,
      options: [
        "Send me the toolkit",
        "Save me a seat at the next lunch",
        "Coffee + fifteen minutes",
        "All of it",
      ],
    },
    cue: "Votes are leads. Names land on your console in real time — first replies go out before the room empties.",
  },
  {
    id: "close",
    kind: "close",
    eyebrow: "The Equipped Agent",
    heading: "Go build something unfair.",
    lines: [
      "Your assistant is already yours — open your /pack link tonight and install it.",
      "Toolkit ships today. First replies inside the hour — that's the standard we just taught.",
    ],
    cue: "Leave the QR up. Work the console: every ladder vote gets a same-hour text.",
  },
];

/** The build moment and everything after it — phones may act on their own. */
export const BUILD_FROM_STEP = DECK.findIndex((s) => s.kind === "build");

/** Every real poll/price key in the deck — THE BOARD only counts these. */
export const ALL_POLL_KEYS = DECK.flatMap((s) => [s.poll?.key, s.price?.key]).filter(
  (k): k is string => typeof k === "string"
);

/** The starter fact sheet on the build slide — for anyone who walks in
 *  without a listing of their own. Everyone else pastes their real one. */
export const STUMP_FACTS = `Address: 214 Demo Oak Ln, Johns Island SC 29455
Asking price: $612,000
Bedrooms: 4 · Bathrooms: 2.5 · Square feet: 2,240
Built: 2016 · Lot: 0.21 acres
HOA: $95/mo (covers pool, dock, common areas)
Garage: 2-car attached
Heating/cooling: gas furnace, central air, both original to build
Roof: architectural shingle, original to build
Flood zone: X (lowest risk designation)
Annual property tax: $2,180 at current owner-occupied rate
Showings: Saturday and Sunday, 11am / 1pm / 3pm slots`;

/** TIER 2 — the color. This is what an agent WANTS said, and what turns a
 *  refusal machine into a front desk. Prefilled on the build slide so the
 *  demo lands and every attendee sees the shape of a good one. */
/** THE HOUSE — a permanent target so the duel is playable from the first
 *  second, solo, and from the stage. Fixed code and a non-player device id,
 *  so it never lands on THE BOARD and never counts as somebody's build. */
export const HOUSE_CODE = "HAUS24";
export const HOUSE_DEVICE = "00000000-0000-4000-8000-00000000f00d";

export const STUMP_NOTES = `WHAT MAKES IT SPECIAL
The kitchen was redone in 2023 — quartz, gas range, new cabinet fronts. Screened porch off the back looks over trees, not another house. The primary is downstairs, which is rare at this price point in the neighborhood.

THE NEIGHBORHOOD
Stonoview on Johns Island. Amenities are a pool, a community dock on the Stono River, and a crab dock. It's about 20 minutes to downtown Charleston and 25 to Folly Beach depending on the bridge. Publix and a handful of restaurants are five minutes up Maybank Highway.

SHOWINGS
Saturday and Sunday, 11am, 1pm, and 3pm. Offer those specific times. Weekday evenings can usually be arranged with a day's notice.

ON PRICE
The sellers priced it to move and have already had traffic. Don't speculate about what they'd accept — that's a conversation for the agent.

WHO THE AGENT IS
Licensed in South Carolina, works Johns Island and the surrounding area, and answers texts fast. Happy to send comparable sales or the seller's disclosure on request.`;

export function pollForStep(step: number) {
  return DECK[step]?.poll ?? null;
}

/** Landing on a game slide opens the floor — the room reads the question and
 *  the phones light up in the same beat, with no second button. One rule,
 *  used by the control route and asserted by /api/selftest, so a deployment
 *  that lost it fails loudly instead of sitting "armed" forever. */
export function opensOnArrival(step: number): boolean {
  const s = DECK[step];
  return Boolean(s?.poll || s?.price);
}
