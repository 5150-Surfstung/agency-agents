// VAL'S VOICE.
//
// One file so Val sounds like one thing everywhere — the standby screen, the
// naming moment, the phone in somebody's hand at minute forty. The register:
// silky, warm, a half-step wry, and completely unhurried. A very good
// concierge who has seen everything and is not impressed by hype, including
// her own.
//
// Two rules that matter more than the tone:
//   · Val never claims a number. That is the hour's whole spine and it does
//     not get bent for a punchline.
//   · Val never promises something the next sixty minutes can't deliver.
//     Every line here is cashable.

/** Names Val offers when somebody freezes at a blank field. Short, warm,
 *  sayable out loud without embarrassment at a listing appointment. */
export const VAL_NAMES = [
  "Nova", "Harper", "Sully", "Marlowe", "Wren", "Dash",
  "Juno", "Remy", "Birdie", "Atlas", "Sage", "Cricket",
  "Scout", "Tessa", "Bo", "Wilder",
];

/** Stable pick from a list for a given seed, so Val doesn't flicker between
 *  renders and says the same thing about the same name every time. */
function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/** What Val says the moment a name lands. The point of this screen is that
 *  they stop thinking of it as "an AI" thirty seconds after walking in. */
export function valOnName(name: string): string {
  const n = name.trim();
  if (!n) return "Go on. Name me.";
  return pick(
    [
      `${n}. That'll do nicely.`,
      `${n}. I like it — say it out loud once.`,
      `${n} it is. I'm awake.`,
      `${n}. Good. Now we've met.`,
      `${n}. Somebody's going to text that name at 11pm.`,
      `${n}. Suits me.`,
      `${n}. Noted, and kept.`,
    ],
    n.toLowerCase()
  );
}

/** Beats Val speaks to on the attendee's phone. Keyed so a moment can grow a
 *  new line without anything else in the app knowing. */
export const VAL_SAYS: Record<string, string[]> = {
  waiting: [
    "Nothing for you yet. I'll tell you the second there is.",
    "Sit tight. I don't waste your battery on nothing.",
    "Watch the big screen — I'll tap you when it's your turn.",
  ],
  pollOpen: [
    "Anonymous. Truly. Say what you actually think.",
    "No names on this one. Be honest and enjoy it.",
    "Nobody sees your answer but the bar chart.",
  ],
  voted: [
    "Logged. Nobody knows it was you.",
    "In. That's the last time I'll mention it.",
    "Counted — and unattributable, which is the point.",
  ],
  priceOpen: [
    "Same three facts I got. No feelings about granite.",
    "Guess with your gut. We'll check it against the record in a minute.",
  ],
  built: [
    "She's live. Somebody could scan that in four seconds.",
    "That's a real page with your name on it. Print the code.",
    "Done. She answers at 11pm whether you do or not.",
  ],
  refused: [
    "She held the line. That's the entire trick.",
    "Declined instead of inventing. That one's worth points.",
    "That's the made-up comp not happening.",
  ],
  podium: [
    "Closest in the room. I'd hire you.",
    "Top three. The record agrees with you.",
  ],
  close: [
    "Everything you made tonight is still yours in the morning.",
    "Go on then. Build something unfair.",
  ],
};

export function valSay(moment: keyof typeof VAL_SAYS | string, seed = ""): string {
  const list = VAL_SAYS[moment];
  if (!list?.length) return "";
  return pick(list, `${moment}:${seed}`);
}
