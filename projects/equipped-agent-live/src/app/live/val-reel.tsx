"use client";

// THE ORB PUTS ON A SHOW.
//
// It winds up until the wireframe is a blur, then brakes — and the line lands
// on the deceleration, so the slowing down is what delivers it. That order
// matters: a fact that appears while the thing is still spinning reads as
// decoration, and a fact that appears as it settles reads as something that
// was just worked out.
//
// The cycle also knows when to stop showing off. The desk below shares this
// orb, so the moment somebody types a client's message into the page, the reel
// stands down and the orb goes to work on the real thing instead.
//
// Under prefers-reduced-motion nothing spins and nothing flies: the lines
// still change, on a slower timer, with no transform and no blur.

import { useEffect, useRef, useState } from "react";
import { ValAir } from "@/app/stage/val-air";
import { ValParticles } from "@/app/stage/val-particles";

export type Mode = "listen" | "think" | "speak" | null;

const WIND = 620;   // spinning up
const BRAKE = 980;  // slowing down — the line arrives here
const HOLD = 3000;  // the line sits still and gets read
const CYCLE = WIND + BRAKE + HOLD;
const TOP_SPIN = 9;

const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export function ValReel({
  facts,
  height = "52vh",
  orb = "48vh",
  mode: override = null,
  busy = false,
}: {
  /** The lines, in order. Each one is a full sentence — the orb is not
   *  labelling itself, it is telling somebody what they will be able to do. */
  facts: string[];
  height?: string;
  orb?: string;
  /** When the desk is working, it owns the orb and the reel steps aside. */
  mode?: Mode;
  busy?: boolean;
}) {
  const [i, setI] = useState(0);
  const [spin, setSpin] = useState(1);
  const [phase, setPhase] = useState<"wind" | "land">("land");
  const raf = useRef(0);
  const t0 = useRef(0);
  const shown = useRef(0);

  const held = busy || override !== null;

  useEffect(() => {
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (calm) {
      // No spin, no flight. Just the next line, slowly.
      setSpin(1);
      setPhase("land");
      if (held) return;
      const id = window.setInterval(() => setI((n) => (n + 1) % facts.length), 7000);
      return () => window.clearInterval(id);
    }

    if (held) {
      // The desk is using it. Hand the wheel over and hold still.
      setSpin(1);
      return;
    }

    t0.current = performance.now();
    let last = 0;
    const step = (t: number) => {
      const p = (t - t0.current) % CYCLE;
      const turn = Math.floor((t - t0.current) / CYCLE);

      let s: number;
      if (p < WIND) {
        s = 1 + (TOP_SPIN - 1) * easeIn(p / WIND);
      } else if (p < WIND + BRAKE) {
        s = 1 + (TOP_SPIN - 1) * (1 - easeOut((p - WIND) / BRAKE));
      } else {
        s = 1;
      }

      // ~12 updates a second is invisible on an angular velocity and keeps
      // this from re-rendering the subtree sixty times a second.
      if (t - last > 80) {
        last = t;
        setSpin(s);
        setPhase(p < WIND ? "wind" : "land");
      }
      // The line swaps the instant the brake bites, not at the top of the loop.
      const slot = turn * 2 + (p >= WIND ? 1 : 0);
      if (p >= WIND && slot !== shown.current) {
        shown.current = slot;
        setI((n) => (n + 1) % facts.length);
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [facts.length, held]);

  // While winding she is thinking; on the brake and the hold she is answering.
  const orbMode: Mode = override ?? (phase === "wind" ? "think" : "speak");

  return (
    <div
      className="reel"
      style={{ height, ["--orb" as string]: orb }}
    >
      <ValAir className="air-mask pointer-events-none absolute inset-0 -z-10" />
      <div className="reel-orb">
        <ValParticles className="absolute inset-0" mode={orbMode} spin={held ? 1 : spin} />
        <div className="holo-scan pointer-events-none absolute inset-0" aria-hidden />
      </div>
      {!held && (
        <p className="reel-say display" key={i} aria-live="off">
          {facts[i]}
        </p>
      )}
    </div>
  );
}
