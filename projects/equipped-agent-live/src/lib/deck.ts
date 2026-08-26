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
      "Most agents can sell. A few can prompt. Almost none can build.",
      "One hour. Two working systems. Three prompts you keep.",
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
    id: "arcade",
    kind: "arcade",
    eyebrow: "Your turn",
    heading: "Phones out. Build one right now.",
    lines: [
      "Build YOUR OWN assistant — branded to you, tested here, installed in your own free Claude app tonight. Yours forever.",
      "Or ground an assistant in a real listing's facts, or go ten rounds in the sparring ring.",
    ],
    cue: "Arcade unlocks on this slide. Push the take-home tile hard — the gasp is 'wait, I OWN this.' Everyone leaves with a /pack link.",
  },
  {
    id: "seed",
    kind: "seed",
    eyebrow: "The one they'll talk about",
    heading: "Build your own — on YOUR Claude, right now.",
    lines: [
      "1 — Your phone has a COPY button on it right now. Tap it.",
      "2 — Open the free Claude app (or claude.ai) and paste into a new chat.",
      "3 — It interviews YOU — six questions — then becomes your assistant. Take it for a sparring round.",
    ],
    cue: "The head-on-fire moment. Give it four full minutes. Walk the room. When the first person's assistant introduces itself by name, have them read it out loud.",
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

/** Arcade unlocks at the arcade slide and stays open to the end. */
export const ARCADE_FROM_STEP = DECK.findIndex((s) => s.kind === "arcade");

export function pollForStep(step: number) {
  return DECK[step]?.poll ?? null;
}
