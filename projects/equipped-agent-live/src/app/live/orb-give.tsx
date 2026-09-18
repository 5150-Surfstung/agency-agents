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
import { orbPrompt, starterPrompt } from "@/lib/prompts";
import { HOST } from "@/lib/contact";

export function OrbGive() {
  const [took, setTook] = useState<"" | "orb" | "val">("");
  const take = useCallback(async (which: "orb" | "val", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setTook(which);
    } catch {
      setTook("");
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
      <button type="button" onClick={() => take("orb", orbPrompt(""))} className="give-go">
        {took === "orb" ? "Copied — paste it into Claude" : "Copy the orb build"}
      </button>

      {/* This page is going on a personal feed, so most of the people who see
          it do not sell houses. They get the same thing, pointed at whatever
          they do. */}
      <div className="give-anyone">
        <h3 className="display">Not an agent? It does not care.</h3>
        <p>
          This one is the bigger of the two. It asks what you do for a living
          first — lender, contractor, photographer, salon owner, teacher,
          whatever it is — then interviews you about where your week actually
          leaks, tells you the three biggest gaps, and writes you your own
          assistant aimed at them. Then that assistant builds your mark.
        </p>
        <p className="give-yours">
          And it is <b>yours</b>. It gets built inside your own account, it
          lives there, nobody here gets a copy, and you can open it and rewrite
          any line of it forever. We only get you started.
        </p>
        <button type="button" onClick={() => take("val", starterPrompt("", ""))} className="give-go">
          {took === "val" ? "Copied — paste it into Claude" : "Build mine, whatever I do"}
        </button>

        <p className="give-mike">
          And while you are here and not an agent: {HOST.first} sells houses.
          Twenty years, {HOST.brokerage}, Charleston. If you have been idly
          wondering what yours is worth, or you know somebody moving — that is
          a text to {HOST.cell}, not a commitment. Worst case you find out and
          go back to your day.
        </p>
      </div>
    </section>
  );
}
