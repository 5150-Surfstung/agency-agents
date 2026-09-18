"use client";

// THE CLOSE.
//
// Every show closes. By the time somebody reaches this they have either
// booked in the block directly above or they have not, so a second "save my
// seat" button here would be a page shouting at itself. Instead this is the
// last word: the orb running the same lines it opened with, the date, and
// one sentence that does not ask for anything.
//
// A page that stops asking at the end is more convincing than one that asks
// twice.

import { ValReel } from "./val-reel";
import { LEARNS } from "./learns";
import { EVENT } from "@/lib/event";
import { HOST } from "@/lib/contact";

export function Closer() {
  return (
    <section className="close-band">
      <ValReel facts={LEARNS} height="40vh" orb="34vh" />

      <p className="close-seat">
        <b>One hour. You leave with it running.</b>
        <span>Friday, October 2 · 12:00pm ET · {EVENT.place}</span>
      </p>

      <p className="close-last">
        And if you take nothing else off this page — take the build, run the
        audit, and come anyway. The worst case is you spend an hour in a room
        with people who are trying the same things you are, and you leave with
        a mark on your screen that nobody else in this market has.
      </p>

      <p className="close-note">
        Questions before the 2nd: {HOST.cell}. First Friday of every month,
        whether you make this one or the next.
      </p>
    </section>
  );
}
