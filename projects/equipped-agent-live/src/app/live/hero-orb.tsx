"use client";

// The orb, on a page a stranger reached from Facebook. Same engine as the
// room: it morphs through every shape the hour is about — a Charleston single,
// a key, a sold sign, a lockbox, a floor plan, the table with four parties
// around it — and the vocabulary crosses the screen going in and coming out.
// Somebody who scrolls past this and does not stop was never coming anyway.

import { ValAir } from "@/app/stage/val-air";
import { ValParticles } from "@/app/stage/val-particles";

export function HeroOrb() {
  return (
    <div className="relative isolate flex h-[62vh] min-h-[22rem] w-full items-center justify-center overflow-hidden">
      <ValAir className="air-mask pointer-events-none absolute inset-0 -z-10" />
      <div className="relative h-[min(56vh,86vw)] w-[min(56vh,86vw)]">
        <ValParticles className="absolute inset-0" />
        <div className="holo-scan pointer-events-none absolute inset-0" aria-hidden />
      </div>
    </div>
  );
}
