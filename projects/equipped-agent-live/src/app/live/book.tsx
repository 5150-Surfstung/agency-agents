"use client";

// VAL BOOKS THE SEAT, AND THE CONFIRMATION IS REAL.
//
// This is the demo. Not a paragraph claiming an assistant can handle a
// booking — an assistant handling this booking, in front of them, on the way
// in the door. The orb is in the block rather than off at the top of the page
// because Val should be visibly the one doing it: listening while they type,
// thinking while the row is written, answering when it lands.
//
// THE RULE THIS WHOLE COMPONENT EXISTS UNDER: every line of the confirmation
// describes something that happened. The reference and the time come back
// from the database — the browser does not invent them and draw them on the
// screen. Nothing is emailed or texted, so nothing says it was; the dash says
// that out loud, and offers their own mail app so a human inbox gets it too.
// An animation of a confirmation is the exact thing this hour teaches against,
// and it is not going on the page that sells the hour.
//
// The questions are deterministic on purpose. A model taking a reservation can
// read "no" as a yes or invent a detail, and a booking that is wrong is worse
// than no booking. Val's voice is in the writing; the booking is code.

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ValReel, type Mode } from "./val-reel";
import { LEARNS } from "./learns";
import { HOST } from "@/lib/contact";
import { EVENT, eventLine } from "@/lib/event";
import { RSVP_CC, RSVP_TO, rsvpMailto } from "@/lib/signup";
import { starterPrompt } from "@/lib/prompts";

type Step = "name" | "cell" | "attend" | "working" | "done";
type Attend = "in-person" | "zoom" | "either";

const ATTEND_SAYS: Record<Attend, string> = {
  "in-person": "In the office",
  zoom: "On Zoom",
  either: "Either works",
};

export function Book() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [attend, setAttend] = useState<Attend>("in-person");
  const [ref, setRef] = useState("");
  const [at, setAt] = useState("");
  const [trouble, setTrouble] = useState("");
  const [gotIt, setGotIt] = useState(false);

  // The orb does what the block is doing, and nothing else.
  const mode: Mode = step === "working" ? "think" : step === "done" ? "speak" : "listen";

  const when = eventLine();
  const mailto = useMemo(
    () => rsvpMailto({ name, cell, when: `${when} — reference ${ref || "pending"}` }),
    [name, cell, when, ref]
  );

  const book = useCallback(
    async (chosen: Attend) => {
      setStep("working");
      setTrouble("");
      try {
        const r = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          // Sending the reference back on a retry is what stops a flaky
          // connection turning one person into three seats.
          body: JSON.stringify({ name, cell, attend: chosen, ref: ref || undefined }),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) {
          setTrouble(
            j?.error === "too_many"
              ? "The list is taking more than it can right now. Give it a minute, or just send Mike the message below — that works either way."
              : "That did not save. Nothing was recorded, so try again — or send the message below and you are on the list the old way."
          );
          setStep("attend");
          return;
        }
        setRef(String(j.ref));
        setAt(String(j.at));
        setStep("done");
      } catch {
        setTrouble("That did not save — nothing was recorded. Try again, or send the message below.");
        setStep("attend");
      }
    },
    [name, cell, ref]
  );

  // Handed over at the moment they are most likely to actually do it.
  const starter = useMemo(() => starterPrompt(name, ref || "pending"), [name, ref]);
  const takeStarter = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(starter);
      setGotIt(true);
    } catch {
      // No clipboard permission: the text is right there and selectable, and
      // the button does not get to claim a copy that did not happen.
      setGotIt(false);
    }
  }, [starter]);

  const saved = at
    ? new Date(at).toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : "";

  return (
    <section className="book" id="seat">
      <ValReel facts={LEARNS} height="34vh" orb="28vh" mode={mode} busy />

      {step !== "done" ? (
        <div className="book-talk">
          {step === "name" && (
            <>
              <p className="book-say display">I&rsquo;ll hold you a seat. Who am I holding it for?</p>
              <form
                className="book-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim().length >= 2) setStep("cell");
                }}
              >
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 80))}
                  placeholder="Your name"
                  aria-label="Your name"
                />
                <button type="submit" disabled={name.trim().length < 2}>
                  That&rsquo;s me
                </button>
              </form>
            </>
          )}

          {step === "cell" && (
            <>
              <p className="book-say display">
                Noted, {name.trim().split(/\s+/)[0]}. Best number to reach you — or skip
                it, you&rsquo;re in either way.
              </p>
              <form
                className="book-row"
                onSubmit={(e) => { e.preventDefault(); setStep("attend"); }}
              >
                <input
                  inputMode="tel"
                  autoComplete="tel"
                  value={cell}
                  onChange={(e) => setCell(e.target.value.slice(0, 32))}
                  placeholder="Cell — optional"
                  aria-label="Your cell, optional"
                />
                <button type="submit">{cell.trim() ? "Use that" : "Skip it"}</button>
              </form>
            </>
          )}

          {step === "attend" && (
            <>
              <p className="book-say display">
                One more and you&rsquo;re done: the office in West Ashley, or Zoom?
              </p>
              <div className="book-pick">
                {(Object.keys(ATTEND_SAYS) as Attend[]).map((a) => (
                  <button key={a} type="button" onClick={() => { setAttend(a); book(a); }}>
                    {ATTEND_SAYS[a]}
                  </button>
                ))}
              </div>
              {trouble && <p className="book-trouble">{trouble}</p>}
            </>
          )}

          {step === "working" && (
            <p className="book-say display" role="status">
              Writing it down…
            </p>
          )}

          <p className="book-fineprint">
            Val is taking this, not a form. Your name and number go in one row
            so Mike knows who walked in — nothing else, never sold, never a
            list.
          </p>
        </div>
      ) : (
        /* ---- THE MINI DASH. Every line below is a thing that happened. ---- */
        <div className="dash">
          <p className="dash-said display">
            Held. That one&rsquo;s yours, {name.trim().split(/\s+/)[0]}.
          </p>

          {/* The stub. A reservation is a ticket, so it reads as one — and
              the two things printed largest are the two the database gave
              back, which is the whole point. */}
          <div className="stub">
            <p className="stub-ref">{ref}</p>
            <p className="stub-at">recorded {saved}</p>
          </div>

          <dl className="dash-rows">
            <div>
              <dt>Name on the seat</dt>
              <dd>{name}</dd>
            </div>
            <div>
              <dt>Attending</dt>
              <dd>{ATTEND_SAYS[attend]}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>Friday, October 2 · 12:00pm ET</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{attend === "zoom" ? "Zoom" : EVENT.place}</dd>
            </div>
            <div>
              <dt>Bring</dt>
              <dd>A laptop with Claude on it, and your phone</dd>
            </div>
            <div className="dash-pending">
              <dt>Zoom link</dt>
              <dd>Not issued yet — Mike sends it before the 2nd</dd>
            </div>
          </dl>

          <div className="dash-go">
            <a href={`/api/ics?ref=${encodeURIComponent(ref)}&attend=${attend}`} download>
              Put it in my calendar
            </a>
            <a href="/api/vcard" download>
              Save Mike&rsquo;s contact
            </a>
            <a href={mailto}>Send it to his inbox too</a>
          </div>

          <p className="dash-truth">
            Straight about what just happened: your reservation is a row in a
            database with that reference and that time on it, and you can hold
            Mike to it. Nothing was emailed or texted — this page cannot do
            that, so it is not going to tell you it did. The last button opens
            a message in your own app if you want it in his inbox as well.
          </p>

          <p className="dash-sell">
            That was the pitch, by the way. You asked for a seat, I took the
            name, wrote the row, and handed you something you can hold Mike to
            — and no human touched any of it. Friday you build the one that
            does that for <i>your</i> listing, with <i>your</i> number on it,
            while you are standing on a soccer field. That is the part{" "}
            {HOST.org} puts in its agents&rsquo; hands, and Mike stands it up
            in an hour.{" "}
            <Link href="/seed">Want the head start?</Link>
          </p>

          <p className="dash-more">
            And since you are already in — bring somebody. Licensed, or still
            deciding. Send them this page and I will hold theirs too.
          </p>

          {/* ---- THE HEAD START ---- */}
          <div className="starter">
            <h3 className="display">Now go find out what your business is leaking.</h3>
            <p>
              This is not a demo prompt. Paste it into Claude tonight and it
              interviews you — where last Tuesday actually went, what fell
              through, what you are secretly not good at — then tells you the
              three biggest gaps and <b>writes you your own Val aimed at
              exactly those</b>. Val building your Val. It already knows your
              name and your reference, and it will not invent a number about
              your business, because a made-up number is how people end up
              trusting the wrong thing.
            </p>
            <pre className="starter-text" aria-label="Your starter prompt">{starter}</pre>
            <div className="starter-go">
              <button type="button" onClick={takeStarter}>
                {gotIt ? "Copied — now paste it into Claude" : "Copy my starter"}
              </button>
              <a href="https://claude.ai/new" target="_blank" rel="noreferrer">
                Open Claude
              </a>
            </div>
            <p className="starter-fine">
              Twenty minutes, and the free tier runs it fine. If it asks
              something you would rather not answer, say so — it is built to
              move on. Bring what it builds you on Friday and we will make it
              sharper in the room.
            </p>

            <div className="starter-alt">
              <p>
                Would rather skip the interview? Here is Val ready-made — the
                same rules, none of the personalisation. It installs in Claude
                under <b>Settings → Features</b>, which needs a paid plan;
                on the free tier use the script above instead, it does the
                same job one conversation at a time.
              </p>
              <a href={`/api/val-skill?name=${encodeURIComponent(name)}`} download>
                Download Val as a skill
              </a>
            </div>
          </div>

          <p className="dash-fine">
            Anything wrong with the above, or need to cancel — text {HOST.cell}{" "}
            or email {RSVP_TO} with {ref}. {RSVP_CC.split("@")[0]} is copied on
            the office side.
          </p>
        </div>
      )}
    </section>
  );
}
