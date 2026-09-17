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
import { ValOrb } from "./val-orb";
import { ValParticles } from "./val-particles";
import { ValLines } from "./val-lines";
import { TacLockup } from "./tac-lockup";

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
    out.push({ angle: a, radius: out.length % 2 === 0 ? 1.18 : 1.36 });
  }
  return out;
})();

export function ValStandby() {
  // What Val has currently made, if anything. Naming it under the wordmark is
  // the difference between "pretty screensaver" and "that thing knows."
  const [form, setForm] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col items-center justify-between py-[2vh]">
      <TacLockup />

      {/* 1em is the ORB's diameter; the stage around it is 2.6em so the
          particle field has room to grow a house bigger than the thing it
          came out of, and so the wordmark below clears the field entirely. */}
      <div className="text-[min(22vh,15vw)]">
        <div className="relative mx-auto h-[2.6em] w-[2.6em]">
          <ValOrb
            label={false}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1em] transition-all duration-[1100ms] ease-out ${
              form ? "scale-[0.42] opacity-25" : "scale-100 opacity-100"
            }`}
          />
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

      <p className="val-standby-name mt-[2vh] font-[family-name:var(--font-display)] text-[clamp(34px,4.6vw,80px)] font-semibold leading-none text-cream">
        VAL
      </p>
      {/* Reserved height, so naming the shape never nudges the layout. */}
      <p className="mt-[1.2vh] h-[2.6vh] text-[clamp(11px,1.05vw,18px)] font-semibold uppercase tracking-[0.3em] text-gold">
        <span className={form ? "form-name" : "opacity-0"}>{form ?? "\u00a0"}</span>
      </p>

      <ValLines />
    </div>
  );
}
