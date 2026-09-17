"use client";

// THE SIGN-UP, AND WHAT IT ACTUALLY DOES.
//
// No server email and no "thanks, we'll be in touch" that nothing performed.
// The button composes the message in the person's OWN mail or texting app,
// addressed to the office with Melanie copied, and their send button is the
// signature. It works on every phone, it cannot silently fail, and nobody has
// to trust a form. The fields are a convenience — the message is complete
// without them, because a sign-up lost to a required field is a sign-up lost.
//
// The copy is careful about exactly one thing: it never says the message was
// received, because this page cannot know that. It says the message is open,
// which is true, and then it hands over the last thing worth having.

import { useMemo, useState } from "react";
import Link from "next/link";
import { HOST } from "@/lib/contact";
import { EVENT, eventLine } from "@/lib/event";
import { RSVP_CC, RSVP_TO, rsvpMailto } from "@/lib/signup";

export function Rsvp() {
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [opened, setOpened] = useState(false);

  const when = eventLine();
  const mailto = useMemo(() => rsvpMailto({ name, cell, when }), [name, cell, when]);
  const sms = useMemo(() => {
    const body = [
      `Save me a seat at The Equipped Agent (${when}).`,
      name ? `This is ${name}.` : "",
    ].filter(Boolean).join(" ");
    // iOS wants ?&body=, Android wants ?body=; this form satisfies both.
    return `sms:${HOST.cellE164}?&body=${encodeURIComponent(body)}`;
  }, [name, when]);

  return (
    <div className="seat">
      <h2 className="seat-ask display">Take a seat on Friday.</h2>
      <p className="seat-sub">
        There is no form here. The button writes the message in your own mail or
        texting app and you hit send — that is the entire system. It goes to the
        office with {RSVP_CC.split("@")[0]} copied, and nothing is stored on this
        page.
      </p>

      <div className="seat-in">
        <label>
          <span>Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="optional"
            autoComplete="name"
          />
        </label>
        <label>
          <span>Your cell</span>
          <input
            value={cell}
            onChange={(e) => setCell(e.target.value.slice(0, 24))}
            inputMode="tel"
            placeholder="optional"
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="seat-go">
        <a href={mailto} onClick={() => setOpened(true)} className="seat-primary">
          Save my seat
        </a>
        <a href={sms} onClick={() => setOpened(true)} className="seat-secondary">
          Or text {HOST.first}
        </a>
      </div>

      {opened && (
        <div className="seat-after">
          <h3 className="display">
            The message is open in your app. It is not sent until you hit send —
            and this page has no way to know that you did, so it will not tell
            you it worked.
          </h3>

          <p>
            Once it is gone: bring <b>one listing you know cold</b>. Any listing,
            any price. That is the one you build in the room, and you leave with
            it live.
          </p>

          <p>
            And take this before Friday. It is the script that turns Claude from
            a chatbot into something that behaves like a colleague who has read
            your whole business — paste it in once and ask it what it should
            know about you.{" "}
            <Link href="/seed" className="seat-link">
              The commissioning script
            </Link>
          </p>

          <p className="seat-fallback">
            Nothing opened? Email{" "}
            <a href={`mailto:${RSVP_TO}?cc=${RSVP_CC}&subject=Save%20me%20a%20seat`}>
              {RSVP_TO}
            </a>{" "}
            or text {HOST.cell}. You can also reserve on{" "}
            <a href={EVENT.rsvpUrl}>the Agent Connection page</a> — same seat,
            same room.
          </p>
        </div>
      )}
    </div>
  );
}
