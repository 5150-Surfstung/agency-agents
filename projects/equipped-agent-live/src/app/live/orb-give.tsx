"use client";

// THE ONE WE GIVE AWAY.
//
// The audit and the skill are personal and they are the reason to book, so
// they sit behind the reservation. This one does not: it is the most
// shareable thing on the page and the least personal, and an agent who
// spends twenty minutes building their own version of the mark at the top of
// this page has spent twenty minutes inside Mike's work. Some of them post
// it. That is worth more than using it as a reward nobody reaches.
//
// It is placed where a stranger will actually see it rather than eleven
// screens down, and it asks for nothing — no name, no email, no booking.

import { useCallback, useState } from "react";
import { orbPrompt } from "@/lib/prompts";

export function OrbGive() {
  const [took, setTook] = useState(false);
  const take = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orbPrompt(""));
      setTook(true);
    } catch {
      setTook(false);
    }
  }, []);

  return (
    <section className="give">
      <h2 className="display">Want the thing at the top of this page? Take it.</h2>
      <p>
        That mark is not a video. It is maths — a few hundred points on a
        sphere, wired to their nearest neighbours, lit by two lights and
        pulled into the shape of a house. This copies a build brief that hands
        you the whole method: paste it into Claude, answer four questions, and
        you get back one HTML file you double-click. Your colours, your
        market, your shapes.
      </p>
      <p className="give-real">
        Straight with you, because you will find out anyway: this gives you
        the method, not our finished engine — and I know the brief works,
        because I built it from my own instructions, got a ball of spaghetti,
        found the rule I had left out, and put it in. You will get something
        good in one pass and something great once you push it around. Nothing
        asked for in return. No email, no booking, no catch.
      </p>
      <button type="button" onClick={take} className="give-go">
        {took ? "Copied — paste it into Claude" : "Copy the orb build"}
      </button>
    </section>
  );
}
