"use client";

// THE PRE-SHOW. What is on the projector while the room fills up.
//
// No headline, no bullets, no "welcome to". Just Val: a slow-breathing orb
// with the vocabulary of the business surfacing and sinking around it, like
// something already running that you happened to walk in on. The first thing
// anyone asks when they sit down should be "what IS that", which is a better
// opening than any sentence on a slide.
//
// The terms ORBIT the orb rather than being scattered across the screen. Two
// earlier versions scattered them by percentage and both failed the same way:
// the ones behind the orb got dimmed by its glow, and the ones near an edge
// got sliced mid-word ("MONTHS OF SUP"). Anchoring every term to the orb's own
// centre at a fixed radius makes both failures impossible — it cannot overlap
// what it circles, and it cannot reach an edge the orb doesn't reach.

import { useState } from "react";
import { ValParticles } from "./val-particles";
import { ValLines, VAL_IDLE } from "./val-lines";
import { TacLockup } from "./tac-lockup";
import { ValFeed } from "./val-feed";

// The language of the room, not AI jargon. These are words an agent already
// thinks in — which is the point Val is making without saying it.
const TERMS = [
  "speed to lead", "days on market", "absorption rate", "months of supply",
  "sale-to-list", "under contract", "due diligence", "the farm",
  "appraisal gap", "showing window", "the rider", "the record",
];

/** Evenly spaced around the field, skipping the bottom arc where the VAL
 *  wordmark sits, and sitting just outside the radius the shapes reach. */
const RING = (() => {
  const out: { angle: number; radius: number }[] = [];
  for (let a = 0; a < 360; a += 26) {
    // CSS rotation: 0 is right, 90 is DOWN, 270 is UP. Keep the terms on the
    // left and right flanks — the bottom belongs to the wordmark and the top
    // to the house lockup, and terms landed on both before this.
    if (a > 58 && a < 122) continue;
    if (a > 238 && a < 302) continue;
    out.push({ angle: a, radius: out.length % 2 === 0 ? 1.34 : 1.54 });
  }
  return out;
})();

/** The line under the wordmark when Val isn't holding a shape.
 *
 *  Swap this for any of the alternates and nothing else changes:
 *    "Everything that already worked."          ← current
 *    "The part you can't buy."
 *    "Built from what broke."
 *    "Nothing in here is a guess."
 *    "Leading agents into the new era of real estate."
 *
 *  The current one is deliberate: Val's whole character is that nothing gets
 *  in until it has already survived a real build, so a line about what it has
 *  DONE lands harder than a line about where it is going — and it pays off
 *  forty minutes later when the Val slide explains the library.
 */
const TAGLINE = "Everything that already worked.";

export function ValStandby() {
  // The symbol Val is currently holding, if any. While one is up the copy
  // sells it; the rest of the time Val talks about the room.
  const [form, setForm] = useState<{ id: string; says: string[]; closing: boolean } | null>(null);

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-hidden py-[1.5vh]">
      <div className="flex w-full flex-col items-center gap-[1.4vh]">
        <TacLockup />
        <ValFeed />
      </div>

      {/* 1em is the ORB's diameter; the stage around it is 2.6em so the
          particle field has room to grow a house bigger than the thing it
          came out of, and so the wordmark below clears the field entirely. */}
      <div className="text-[min(15vh,11.5vw)]">
        <div className="relative mx-auto h-[2.8em] w-[2.8em]">
          {/* The core IS the particles and the bodies of light now. The CSS
              gradient ball that used to sit under here was a second system
              with a second look — a beige marble parked in front of the
              machinery. */}
          <ValParticles onForm={setForm} className="absolute inset-0" />

          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {TERMS.map((t, i) => {
              const { angle, radius } = RING[i % RING.length];
              return (
                <span
                  key={t}
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `rotate(${angle}deg) translateX(${radius}em) rotate(${-angle}deg)` }}
                >
                  <span
                    className="val-term block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(10px,0.85vw,15px)] font-semibold uppercase tracking-[0.18em] text-gold"
                    style={{
                      animationDelay: `${(i * 1.6) % 19}s`,
                      animationDuration: `${18 + (i % 4) * 2}s`,
                    }}
                  >
                    {t}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <p className="val-standby-name mt-[1.5vh] font-[family-name:var(--font-display)] text-[clamp(28px,3.8vw,64px)] font-semibold leading-none text-cream">
        VAL
      </p>
      {/* Reserved height, so naming the shape never nudges the layout. */}
      <p className="mt-[0.9vh] text-[clamp(9px,0.85vw,14px)] font-semibold uppercase tracking-[0.3em] text-faint">
        {TAGLINE}
      </p>

      {/* A held symbol gets its own pitch, on a faster clock — four lines
          inside a fifteen-second hold. Otherwise Val works the room. */}
      <ValLines
        lines={
          form
            ? form.closing
              // Val is winding up to throw it — the copy stops moving and
              // lands on the close while the shape flies apart.
              ? [form.says[form.says.length - 1]]
              : form.says
            : VAL_IDLE
        }
        every={form ? 3400 : 7200}
      />
    </div>
  );
}
