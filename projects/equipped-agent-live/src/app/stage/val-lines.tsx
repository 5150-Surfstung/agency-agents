"use client";

// VAL, TALKING. The lines that fly through the pre-show.
//
// The standby screen is not a holding pattern, it is the first thing that
// sells. People walk in, sit down, and look at the wall for ten minutes before
// anyone says a word — so those ten minutes make the promise, name the room,
// and tell them what their phone is for. Val says it, not a bullet list.
//
// Every line here is something the hour actually delivers. Nothing on this
// screen writes a cheque the next sixty minutes can't cash.

import { useEffect, useState } from "react";

const LINES = [
  "Welcome to The AGENT Connection AI Strategy Course.",
  "I'm Val. Every system you'll see tonight came off my shelves.",
  "Scan the code — your phone is part of the show.",
  "In one hour you'll have a listing that answers its own phone.",
  "Nobody leaves with notes. You leave with things that run.",
  "I never say a number I can't defend. Neither will yours.",
  "Smarter tools. Stronger agents. Bigger opportunities.",
  "Same relationships. Bigger possibilities.",
];

const EVERY = 6600;

export function ValLines() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const h = setInterval(() => setI((n) => (n + 1) % LINES.length), EVERY);
    return () => clearInterval(h);
  }, []);
  return (
    <p className="flex h-[10vh] items-center justify-center px-[2vw] text-center">
      {/* Keyed so each line remounts and replays the fly-through. */}
      <span
        key={i}
        className="val-line max-w-[54ch] font-[family-name:var(--font-display)] text-[clamp(16px,1.9vw,34px)] italic leading-snug text-cream"
      >
        {LINES[i]}
      </span>
    </p>
  );
}
