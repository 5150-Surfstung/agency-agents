"use client";

// THE FEED. What a Tuesday looks like when the systems are running.
//
// Alerts shoot in from the right and leave to the left, the way a live ops
// board behaves. This is the thing that makes somebody walking past stop:
// not a claim that the tools work, but the SHAPE of them working — a lead at
// 9:47pm, a showing booked without anybody awake, a deadline caught four days
// out.
//
// HONESTY, because this one has a real trap in it: these are illustrative, not
// live, and a standby screen that looked like a real lead feed would be
// exactly the "render a confirmation the system didn't perform" failure this
// whole hour teaches against. So the strip is LABELLED as an illustration, in
// the room, permanently — and every line is a thing the built systems actually
// do, phrased as an example rather than as an event.

import { useEffect, useState } from "react";

const FEED = [
  ["NEW LEAD", "9:47pm · scanned the rider at 214 Demo Oak Ln"],
  ["QUALIFIED", "pre-approved · moving in 1–3 months · no agent yet"],
  ["SHOWING BOOKED", "Saturday 11:00 — offered, taken, confirmed"],
  ["TEXT SENT", "to you, 14 seconds after the scan"],
  ["DUE DILIGENCE", "ends Tuesday — 4 days out, flagged now"],
  ["LOAN COMMITMENT", "due in 9 days · lender chased, politely"],
  ["INSPECTION PARSED", "41 pages → 6 items worth asking for"],
  ["SELLER UPDATE", "drafted for Friday · waiting on your read"],
  ["MARKET PULLED", "median sold vs. median asking · 10 seconds"],
  ["YOU BROKE IN", "took the conversation over at message three"],
];

export function ValFeed() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const h = setInterval(() => setI((n) => (n + 1) % FEED.length), 3400);
    return () => clearInterval(h);
  }, []);
  const [tag, body] = FEED[i];
  return (
    <div className="flex w-full max-w-[46ch] flex-col items-center overflow-hidden">
      <p className="text-[clamp(8px,0.72vw,12px)] font-bold uppercase tracking-[0.32em] text-faint/70">
        What a Tuesday looks like
      </p>
      <div className="mt-[0.8vh] flex h-[4.2vh] w-full items-center justify-center">
        {/* Keyed so each alert remounts and replays the shot-in. */}
        <span key={i} className="val-feed flex items-center gap-[0.7vw] whitespace-nowrap">
          <span className="live-dot shrink-0" aria-hidden />
          <span className="text-[clamp(9px,0.86vw,15px)] font-bold uppercase tracking-[0.16em] text-gold-bright">
            {tag}
          </span>
          <span className="text-[clamp(9px,0.84vw,15px)] text-soft">{body}</span>
        </span>
      </div>
    </div>
  );
}
