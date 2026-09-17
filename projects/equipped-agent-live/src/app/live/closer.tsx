"use client";

// THE CLOSE.
//
// The orb has just spent the page telling somebody what they will be able to
// do. This is the part that gets them in the door, and it does it with one
// tap: the button writes the message in their own mail app, already addressed
// and already written, and their send button is the signature. No scrolling
// back up to a form, no second decision.
//
// The scarcity line is true and that is why it is there: the room is an
// office, not a ballroom.

import { ValReel } from "./val-reel";
import { LEARNS } from "./learns";
import { eventLine } from "@/lib/event";
import { rsvpMailto } from "@/lib/signup";

export function Closer() {
  const when = eventLine();
  return (
    <section className="close-band">
      <ValReel facts={LEARNS} height="40vh" orb="34vh" />
      <p className="close-seat">
        <b>One hour. You leave with it running.</b>
        <span>Friday, October 2 · 12:00pm ET · 2000 Sam Rittenberg Blvd, Suite 2020</span>
      </p>
      <a href={rsvpMailto({ name: "", cell: "", when })} className="close-go">
        Save my seat
      </a>
      <p className="close-note">
        That opens the message in your own mail app — you hit send. The room is
        our office, not a ballroom, so when it is full it is full.
      </p>
    </section>
  );
}
