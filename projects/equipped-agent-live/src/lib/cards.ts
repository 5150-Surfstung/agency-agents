// THE CARDS. Screenshot one, drop the screenshot into Claude, and it runs.
//
// This exists because of a real failure mode in every AI class ever taught:
// people leave inspired and empty-handed. Notes don't survive the drive home.
// A photo on your camera roll does — and because each card is a COMPLETE
// prompt, pasting the picture into Claude is the whole workflow. No typing,
// no login, no copying from a slide you can't read from row six.
//
// Rules every card obeys:
//   · it names what it needs from YOU in [brackets] — no card pretends to
//     know your market, your listing, or your client;
//   · it asks the model to say what it's missing BEFORE it produces anything;
//   · nothing tells the model to invent a number. Where numbers matter, the
//     card demands a source and a refusal.

export interface Card {
  id: string;
  /** The deck slide this belongs to — the phone surfaces it there. */
  slide: string;
  title: string;
  /** One line: what this gets you, in the agent's own terms. */
  payoff: string;
  /** The whole prompt. What gets screenshotted. */
  body: string;
}

export const CARDS: Card[] = [
  {
    id: "first-five",
    slide: "install",
    title: "The first five minutes",
    payoff: "Do this in the parking lot. It works before you've learned anything.",
    body: `I'm a real-estate agent in [CITY]. I've just installed you and I've never
used AI for work before.

Ask me five questions — one at a time, waiting for my answer — that would let
you help me with the single most annoying recurring task in my week.

Then do that task with me, once, start to finish.

Rules: plain English, no jargon. If you need something from me to do it
properly, ask instead of guessing. Don't tell me what you COULD do — just do
the one thing.`,
  },
  {
    id: "profile",
    slide: "install",
    title: "Teach it who you are — once",
    payoff: "The difference between a clever stranger and something that knows your business.",
    body: `I'm going to tell you about my business. Turn it into a profile you keep and
use in every future conversation with me, and tell me what's still missing.

Me: [NAME], REALTOR® at [BROKERAGE] in [CITY / MARKET].
Years in: [N]. Who I mostly work with: [buyers / sellers / both / investors].
My farm: [NEIGHBORHOOD].
What I'm known for: [in your own words, one sentence].
How I write: [paste two emails you actually sent — your real voice, not your
best writing].
Price range I usually work in: [range].
The parts of the job I want help with: [list them].
The parts I will never hand over: [list them].

Give me back:
1. The profile, written so a stranger could pick it up and sound like me.
2. The five things you'd still need to know to be genuinely useful.
3. Where to save this so you have it every time — walk me through it for
   [Claude on my phone / Claude on my laptop], step by step.

Never invent a detail about me. Anything I didn't tell you, put in the
missing list.`,
  },
  {
    id: "first-brief",
    slide: "how-to-talk",
    title: "The listing-prep brief",
    payoff: "Walk into the appointment already knowing more than the last agent did.",
    body: `You're my listing coordinator. I have a listing appointment at [ADDRESS] on [DAY].

Here is everything I have: [PASTE the tax record, the MLS history, the old listing, your notes — raw is fine].

Build me a one-page prep brief:
1. What this house actually is, in four lines.
2. Its history — every time it sold or listed, and what that pattern suggests.
3. The three things a seller will be most sensitive about here.
4. Five questions I should ask them that another agent won't.

Rules: use ONLY what I pasted. If something important is missing, ask me for it
before you write. Never state a number that isn't in my source, and say
"not in what you gave me" instead of estimating.`,
  },
  {
    id: "objections",
    slide: "how-to-talk",
    title: "The objection rehearsal",
    payoff: "Practice the hard part before it's real and expensive.",
    body: `Be a [seller / buyer] who is [skeptical / in a hurry / talking to two other agents].

Context you know about me: [PASTE your value proposition, your market, the property].

Rules:
- Stay in character. Don't coach me and don't be nice to me.
- Push back on price and on commission at least once each.
- After 8 exchanges, break character and tell me: the one answer that was
  weakest, the exact words that lost you, and what you'd have said instead.

Start by objecting to something. Go.`,
  },
  {
    id: "fact-sheet",
    slide: "build",
    title: "The fact sheet your assistant runs on",
    payoff: "Turn a messy listing into the grounded source your AI can't lie about.",
    body: `Turn what I'm pasting into a clean fact sheet for a listing assistant.

[PASTE the MLS sheet, the seller's disclosure, your notes — all of it]

Output two blocks and nothing else:

BLOCK 1 — THE FACTS. One fact per line, label: value. Only things that are
verifiably in my source. Beds, baths, square feet, year built, lot, HOA, taxes,
systems and their ages, flood zone, showing windows.

BLOCK 2 — THE COLOR. What I'd actually SAY about this house: the neighborhood,
what makes it special, what the commute is like, what I want emphasized.

If something belongs in BLOCK 1 but you can't find it, list it under
"ASK MIKE FOR:" instead of guessing. That list is the most useful part.`,
  },
  {
    id: "mls-pulse",
    slide: "mls-mcp",
    title: "The market pulse (needs your MLS connected)",
    payoff: "The truth about your farm, from the MLS itself, in ten seconds.",
    body: `Using my MLS connection, pull residential stats for [CITY or AREA] for the
last 12 months and tell me:

1. Median SOLD price, most recent month, and the trend across the year.
2. Median price of what's ACTIVE right now.
3. The gap between those two — and what it says about how sellers here are pricing.
4. Average days on market, most recent month vs. the range across the year.
5. Sale-to-ORIGINAL-list ratio vs. sale-to-list ratio, and what the difference
   tells me about price corrections.

Give me the numbers with their months. Then give me two sentences I could say
out loud at a listing appointment. If any figure comes back empty, say so —
do not fill it in from anywhere else.`,
  },
  {
    id: "mls-seller",
    slide: "mls-mcp",
    title: "The 'why your price is wrong' page",
    payoff: "A seller conversation backed by the record instead of your opinion.",
    body: `Using my MLS connection, build me a one-page seller reality check for
[ADDRESS / NEIGHBORHOOD].

Pull: what's actually closed in the last 12 months, what's sitting active now,
days on market, and sale-to-original-list ratio.

Then write it for the SELLER, not for me:
- what buyers in this area actually paid, in plain English
- what the homes that sold had in common with the ones that didn't
- what the price-cut pattern says about starting high

No jargon, no acronyms, no scare tactics. Every number gets its month attached.
If the data doesn't support a point, cut the point.`,
  },
  {
    id: "social-post",
    slide: "social",
    title: "The post that doesn't sound like a post",
    payoff: "Content that leads with a hook and stays out of fair-housing trouble.",
    body: `You're the best real-estate social media manager I could hire. Write one
[Instagram / Facebook / LinkedIn / Reel] piece, angle: [just listed / neighborhood
story / open house / price improvement / just sold].

The facts — your only source of truth: [PASTE the listing]
My market: [CITY / NEIGHBORHOOD]

Rules:
- The hook does the work. No "check out this stunning home." Open with a detail,
  a number, or a sentence somebody would repeat out loud.
- One idea. Talk to one person, not "buyers."
- Show, don't adjective. Kill any word that could describe any house anywhere.
- CTA must be free to answer ("comment DOCK and I'll send the disclosure"),
  never "DM me for info."
- FAIR HOUSING, hard rule: describe the property, never who should live in it.
  No "perfect for families," no "safe neighborhood," no schools as a selling
  point for a type of buyer.

Give me: 3 hook options, the post, the CTA, the visual, tags, and a
"NEEDS FROM YOU" list of anything you'd have used but I didn't give you.
Do not invent a single fact to fill a gap.`,
  },
  {
    id: "week-update",
    slide: "everyday-ten",
    title: "The weekly seller update",
    payoff: "The email that keeps a listing from going quiet — in ninety seconds.",
    body: `Write this week's update to my seller at [ADDRESS].

This week: [showings: N] [feedback: PASTE it raw] [online views: N]
[what I did: list it] [what changed in the market: anything]

Rules:
- Under 200 words. Warm, specific, zero fluff.
- Lead with what happened, not with how excited I am.
- If the news is bad, say it in the first three sentences and then say what
  we do about it.
- End with one clear thing I need from them, or say there's nothing needed.

Don't invent a single number I didn't give you.`,
  },
  {
    id: "repair-request",
    slide: "everyday-ten",
    title: "The inspection-to-repair-request draft",
    payoff: "Turn 40 pages into a defensible ask in one pass.",
    body: `Here's the inspection report: [PASTE the summary section, or upload the PDF].

Sort every finding into three buckets:
1. SAFETY / STRUCTURAL / SYSTEM — the things worth asking for.
2. MAINTENANCE — real, but a buyer generally eats these.
3. COSMETIC — don't spend negotiating capital here.

Then draft the repair request for bucket 1 only: item, what the report actually
said (quote it), and the ask.

Quote the report's own words. Do not characterize severity beyond what the
inspector wrote, and do not estimate any repair cost.`,
  },
  {
    id: "debrief",
    slide: "everyday-ten",
    title: "The loss debrief",
    payoff: "The deal that fell apart pays you back — once — if you write it down.",
    body: `A deal just died. Interview me about it.

Ask me one question at a time — no more than eight total — until you understand
what actually happened, not the story I tell myself about it.

Then give me:
- the single decision point where it turned
- what I'd have to do differently, stated as a behavior not a feeling
- one sentence to put in my notes so next-time-me catches it earlier

Be direct. If my answers are vague, say so and ask again.`,
  },
  {
    id: "inbox",
    slide: "connect",
    title: "Monday morning, in one pass",
    payoff: "Every email that needs you, sorted, with the replies already drafted.",
    body: `You have my Gmail connected. Go through everything from the last [3] days.

Give me, in this order:
1. NEEDS ME TODAY — anything with a deadline, a contract date, or a client
   waiting on an answer. One line each, with who and by when.
2. DRAFT AND WAIT — for each of those, write the reply in my voice. Don't send
   anything. I read every one before it goes.
3. CAN WAIT — one line each, no drafts.
4. NOTHING NEEDED — just a count.

Rules:
- You draft, I read, I send. Every time, no exceptions.
- Match how I've actually written to that person before — go look.
- If an email needs a fact you don't have, write the reply with [BRACKETS]
  where the fact goes. Never fill a gap with a guess.
- Anything about a contract date, money, or a legal question: flag it, draft
  nothing, and tell me why.`,
  },
  {
    id: "week-ahead",
    slide: "connect",
    title: "The week before it happens",
    payoff: "Walk into Monday knowing where the week breaks.",
    body: `You have my calendar and my email connected. Look at the next [7] days.

Tell me:
1. What's actually on — by day, in one line each.
2. Where it breaks. Double-bookings, drive times that don't work, a showing
   and a closing forty minutes apart.
3. What I've promised somebody this week that isn't on the calendar. Go find
   it in my email.
4. Three showing blocks of [45] minutes that don't collide with anything.
5. The one thing most likely to go wrong, and what to do about it now.

Rules: read-only. Don't create, move, or cancel anything — tell me and I'll do
it. If you're inferring rather than reading, say which is which.`,
  },
  {
    id: "t2k-brief",
    slide: "demo-t2k",
    title: "The client date explainer",
    payoff: "Nine deadlines your buyer will actually read.",
    body: `Here are the dates on my buyer's contract: [PASTE them, or the dates from
Track to Keys].

Write my client a message that explains what each date means and what they
personally have to do — in plain English, at an 8th-grade reading level.

Rules:
- No acronyms. No "due diligence period expires" — say what expires and why
  they care.
- Exactly one sentence per date.
- End with the single next thing they need to do this week.
- Do not add a date I didn't give you, and don't give legal advice —
  point them to their contract for anything I didn't list.`,
  },
];

export function cardsForSlide(slideId: string): Card[] {
  return CARDS.filter((c) => c.slide === slideId);
}
