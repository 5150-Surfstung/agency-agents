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
import { ValAir } from "./val-air";
import { ValParticles } from "./val-particles";
import { ValLines, VAL_IDLE } from "./val-lines";
import { TacLockup } from "./tac-lockup";
import { ValFeed } from "./val-feed";

// The language of the room, not AI jargon. These are words an agent already
// thinks in — which is the point Val is making without saying it.

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
    <div className="relative isolate flex flex-1 flex-col items-center justify-between overflow-hidden py-[1.5vh]">
      {/* The whole wall is in the weather, not just the stage. */}
      <ValAir className="air-mask pointer-events-none absolute inset-0 -z-10" />
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
          {/* Scanlines, masked to the middle of the stage: the field reads as
              projected onto glass rather than painted on the wall. */}
          <div className="holo-scan pointer-events-none absolute inset-0" aria-hidden />

        </div>
      </div>

      <p className="val-standby-name mt-[1.5vh] display text-[clamp(28px,3.8vw,64px)] font-extrabold leading-none text-cream">
        <span className="val-glitch [font-variation-settings:'wdth'_122]">VAL</span>
      </p>
      {/* Reserved height, so naming the shape never nudges the layout. */}
      <p className="label mt-[0.9vh] text-[clamp(9px,0.8vw,13px)] tracking-[0.34em] text-faint">
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
