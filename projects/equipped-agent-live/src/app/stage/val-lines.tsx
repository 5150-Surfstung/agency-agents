"use client";

// VAL, TALKING. The line that flies through the pre-show.
//
// The standby screen is not a holding pattern, it is the first thing that
// sells. People walk in, sit down, and look at the wall for ten minutes before
// anyone says a word — so those ten minutes make the promise, name the room,
// and tell them what their phone is for. Val says it, not a bullet list.
//
// While Val is holding a symbol this carries that symbol's pitch instead of
// the general rotation, because captioning a house "A HOUSE" tells the room
// something it can already see. Fifteen seconds of hold is fifteen seconds of
// selling.
//
// Every line is something the hour actually delivers. Nothing on this screen
// writes a cheque the next sixty minutes can't cash.

import { useEffect, useState } from "react";

/** THE CLOSE, on a loop.
 *
 *  This is not a list of nice things Val can say. It is a closing sequence,
 *  in order, that works whether somebody reads two lines of it or twenty:
 *  name the room, say who is talking, name the pain, reframe it, show the
 *  mechanism, make them want a number, reverse the risk, promise honesty,
 *  ask for the one action, close. Then round again.
 *
 *  Two rules outrank the persuasion:
 *  · No figure appears here that could go stale on a wall. The market line
 *    deliberately makes them WANT the number instead of quoting one — a
 *    standby screen is the last place that should carry a date-sensitive
 *    statistic nobody remembers to update.
 *  · Every promise is cashable inside the next sixty minutes. The NAR figure
 *    is the same one the deck sources on the split slide.
 */
export const VAL_IDLE = [
  "Welcome to The AGENT Connection AI Strategy Course.",
  "I'm Val. Every system you'll see tonight came off my shelves.",
  "Sixty percent of licensed agents sold nothing last year. Not one of them chose that.",
  "The line isn't new against experienced any more. It's equipped against unequipped.",
  "Whoever answers first has the conversation. Everyone else leaves a voicemail.",
  "Somewhere in your farm, what's asking and what's closing are tens of thousands apart. I can tell you that number in ten seconds.",
  "Nobody leaves with notes tonight. You leave with things that run.",
  "And they stay yours — whether you ever call Mike or not.",
  "I never say a number I can't defend. Neither will the one you build.",
  "Scan the code. Your phone is part of the show.",
  "An on-site Director, in Charleston, who built all of this himself.",
  "Same relationships. Bigger possibilities.",
  "People \u00b7 Tools \u00b7 Opportunity \u2014 in that order, on purpose.",
];

export function ValLines({ lines, every = 7200 }: { lines: string[]; every?: number }) {
  const [i, setI] = useState(0);
  // Restart the rotation whenever the set changes, so a symbol's pitch opens
  // on its first line rather than wherever the last set happened to be.
  const key = lines[0] ?? "";
  useEffect(() => {
    setI(0);
    const h = setInterval(() => setI((n) => (n + 1) % lines.length), every);
    return () => clearInterval(h);
  }, [key, lines.length, every]);

  const line = lines[i % lines.length] ?? "";
  return (
    <p className="flex h-[12vh] shrink-0 items-center justify-center px-[2vw] text-center">
      {/* Keyed so each line remounts and replays the fly-through. */}
      <span
        key={`${key}:${i}`}
        className="val-line max-w-[54ch] pull text-[clamp(15px,1.75vw,31px)] leading-snug text-cream"
      >
        {line}
      </span>
    </p>
  );
}
