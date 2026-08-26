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
    id: "poll-time",
    kind: "poll",
    eyebrow: "First — an honest question",
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
      { value: "134", label: "months of sales history" },
      { value: "449", label: "sales indexed, eleven years" },
      { value: "32% → 26%", label: "premium over the island, in 12 months" },
    ],
    quote:
      "When you hand a seller eleven years of their own street, you're not one of three agents interviewing. You're the one who did the homework.",
    cue: "SWITCH TO: Stonoview Neighborhood Index + the 29466 seven-hood plan. Scroll it live.",
  },
  {
    id: "price-game",
    kind: "price",
    eyebrow: "Game one \u00b7 The room vs. the homework",
    heading: "What did it actually sell for?",
    price: {
      key: "price1",
      facts: [
        "Single-family resale \u00b7 Stonoview, Johns Island",
        "4 bed \u00b7 3 bath \u00b7 two-story, built during the buildout years",
        "Sold in the last twelve months \u00b7 51-day market average \u00b7 2\u20138 active listings a month",
      ],
      minK: 500,
      maxK: 1200,
      stepK: 5,
      soldK: null,
      anchorK: 824,
      anchorLabel: "the index's trailing-12 median",
    },
    cue: "Slider goes live on space. Reveal shows the room's guesses as a histogram vs. the real closing vs. the index anchor. LOAD A REAL CLOSING (soldK + exact facts) BEFORE THE ROOM \u2014 the reveal stays honest and says 'awaiting the closing' until you do.",
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
    id: "stump",
    kind: "stump",
    eyebrow: "Game two \u00b7 Try to break it",
    heading: "Stump the assistant.",
    lines: [
      "Your phones can now interrogate the demo listing's assistant.",
      "It knows ONLY the fact sheet. Make it guess \u2014 it won't.",
      "Every honest refusal lights up gold. That's the feature.",
    ],
    cue: "Questions and answers stream onto this screen live. Call out the best refusal. If the engine key isn't loaded, this slide says so honestly \u2014 skip it.",
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
    id: "seed",
    kind: "seed",
    eyebrow: "Phones and laptops out \u00b7 the one they'll talk about",
    heading: "Build your own — on YOUR Claude, right now.",
    lines: [
      "1 — Your phone has a COPY button on it right now. Tap it.",
      "2 — Open the free Claude app (or claude.ai) — phone or laptop — and paste into a new chat.",
      "3 — It interviews YOU — six questions — then becomes your assistant. Take it for a sparring round and post your score.",
    ],
    cue: "The head-on-fire moment. Give it four full minutes. Walk the room. When the first person's assistant introduces itself by name, have them read it out loud.",
  },
  {
    id: "leaderboard",
    kind: "leaderboard",
    eyebrow: "The ring \u00b7 standings",
    heading: "Toughest agents in the room",
    lines: ["Best sparring score takes the board. Three letters, immortalized."],
    cue: "Scores come from THEIR OWN ring (the seed's spar move) \u2014 on their honor, posted from their phone on this slide. Crown the leader out loud.",
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

/** The seed moment and everything after it — phones may act on their own. */
export const SEED_FROM_STEP = DECK.findIndex((s) => s.kind === "seed");

/** The fact sheet Stump the Assistant defends. SWAP for a live listing's
 *  sheet before a real room — the game only ever speaks these lines. */
export const STUMP_FACTS = `DEMO LISTING (labeled demo on purpose — swap with a live sheet)
Address: 214 Demo Oak Ln, Johns Island
Asking price: $612,000
Bedrooms: 4 · Bathrooms: 2.5 · Square feet: 2,240
Built: 2016 · HOA: $95/mo
Showings: Sat–Sun 11–4 by appointment`;

export function pollForStep(step: number) {
  return DECK[step]?.poll ?? null;
}
