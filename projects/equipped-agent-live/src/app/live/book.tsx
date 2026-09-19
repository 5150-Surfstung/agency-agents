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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ValReel, type Mode, type Packet } from "./val-reel";
import { ClaudeMark } from "./claude-mark";
import { Share } from "./share";
import { Console } from "./console";
import { LEARNS } from "./learns";
import { HOST } from "@/lib/contact";
import { EVENT, eventLine } from "@/lib/event";
import { RSVP_CC, RSVP_TO, rsvpMailto } from "@/lib/signup";
import { orbPrompt, starterPrompt } from "@/lib/prompts";

type Step = "name" | "cell" | "email" | "attend" | "working" | "done";
type Attend = "in-person" | "zoom" | "either";

const ATTEND_SAYS: Record<Attend, string> = {
  "in-person": "In the office",
  zoom: "On Zoom",
  either: "Either works",
};

/** THE LEVEL-UP, WHILE THE ROW IS BEING WRITTEN.
 *
 *  Two different kinds of sentence share this screen and they are not allowed
 *  to blur together. "Saving your seat" is a claim about right now, and it is
 *  true — the POST is in flight while it is on screen. Everything after it is
 *  labelled as what gets built on the 2nd, because an assistant that lists
 *  "MCP server" as though it were installing one is exactly the lie this hour
 *  teaches against. The label under the reel carries that distinction, and the
 *  confirmation still does not appear until the database has answered. */
function LevelUp({ first }: { first: string }) {
  const beats = [
    { t: `Saving your seat`, kind: "now" as const },
    { t: `Leveling up ${first || "you"}`, kind: "hype" as const },
    { t: "Claude upgrades", kind: "build" as const },
    { t: "MCP server", kind: "build" as const },
    { t: "AI agent", kind: "build" as const },
    { t: "Social media manager", kind: "build" as const },
    { t: "Friday, October 2", kind: "hype" as const },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (calm) return;
    const id = window.setInterval(() => setI((n) => (n + 1 < beats.length ? n + 1 : n)), 430);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const b = beats[i];
  return (
    <div className="levelup" role="status" aria-live="polite">
      <p className={`levelup-line levelup-${b.kind}`} key={i}>
        {b.t}
      </p>
      <div className="levelup-rack" aria-hidden>
        {beats.filter((x) => x.kind === "build").map((x, n) => (
          <span key={x.t} className={beats.indexOf(x) <= i ? "is-lit" : ""} style={{ transitionDelay: `${n * 60}ms` }}>
            {x.t}
          </span>
        ))}
      </div>
      <p className="levelup-foot">
        The seat is being written now. The rest is what you build on the 2nd.
      </p>
    </div>
  );
}

export function Book() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [email, setEmail] = useState("");
  // What the server actually did. Never assumed, never optimistic.
  const [emailed, setEmailed] = useState(false);
  const [attend, setAttend] = useState<Attend>("in-person");
  const [ref, setRef] = useState("");
  const [at, setAt] = useState("");
  const [trouble, setTrouble] = useState("");
  const [took, setTook] = useState<"" | "audit" | "orb">("");
  const [brokerage, setBrokerage] = useState("");
  const [bringing, setBringing] = useState("");
  const [onWall, setOnWall] = useState(false);
  const [wallSaved, setWallSaved] = useState(false);
  // The show. `reveal` steps the confirmation in; `beat` is the pulse the orb
  // gives when the row actually lands. Both describe real events — the data
  // is already in hand and true before any of it is shown, so this is paced
  // disclosure of a fact, never an animation standing in for one.
  const [reveal, setReveal] = useState(0);
  // THE TRAFFIC. Each packet is a thing that moved: a field committed on its
  // way in, a value the server handed back on its way out. Nothing is emitted
  // for effect, which is what makes watching the machinery worth more than
  // watching an animation of it.
  const [packets, setPackets] = useState<Packet[]>([]);
  // THE DESK, RUNNING. Once the seat exists the mark stops idling and starts
  // showing the job list — the actual things this assistant does, streaming
  // in and out of it. Every label is a capability built in the hour on the
  // 2nd, and the panel says so on screen, because a chip reading "POSTED TO
  // INSTAGRAM" on a page selling an hour about assistants that refuse to
  // invent would be read by a stranger as a thing that just happened to their
  // account. What it is instead is a live preview of their own desk, which is
  // the same spectacle and survives being looked at closely.
  const [deskOn, setDeskOn] = useState(false);
  const pktId = useRef(0);
  const DESK_WORK: [string, "in" | "out"][] = [
    ["BUYER ASKS AT 11PM", "in"],
    ["ANSWERED FROM THE SHEET", "out"],
    ["LISTING POST", "out"],
    ["OPEN HOUSE RECAP", "out"],
    ["DAY 3 FOLLOW-UP DUE", "in"],
    ["DRAFTED IN YOUR VOICE", "out"],
    ["CONTRACT RATIFIED", "in"],
    ["DATES COUNTED", "out"],
    ["INSPECTION IN 4 DAYS", "out"],
    ["ASK THE MLS", "in"],
    ["FARM ANSWERED", "out"],
    ["SELLER UPDATE", "out"],
    ["PRICE QUESTION", "in"],
    ["SENT TO YOU TO SEND", "out"],
    ["NOT ON THE SHEET", "out"],
    ["REFUSED TO INVENT", "out"],
  ];

  const fly = useCallback((label: string, dir: "in" | "out") => {
    pktId.current += 1;
    const id = pktId.current;
    setPackets((p) => [...p.slice(-7), { id, label, dir }]);
  }, []);
  // ASK VAL. The point of the whole panel: a real turn, on a real key, with a
  // real refusal when the question is not on the sheet. Nothing here is
  // scripted — if the engine is off or the cap is hit, the honest sentence the
  // server returns is what appears.
  const [askQ, setAskQ] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [askLog, setAskLog] = useState<{ q: string; a: string; refused: boolean }[]>([]);
  const [beat, setBeat] = useState(0);
  // THE NAME LANDS BIG. `boom` is the word on screen at full size; `flung` is
  // the second half of the same move, where it collapses into the record on
  // the right. Both are pure presentation of something already true — she is
  // not pretending to save anything here, the row beside it is the save.
  const [boom, setBoom] = useState("");
  const [flung, setFlung] = useState(false);

  // Each field flies into the mark at the moment it is actually committed,
  // never on keystroke — what is drawn arriving is what Val now holds.
  const lastStep = useRef<Step>("name");
  useEffect(() => {
    const was = lastStep.current;
    lastStep.current = step;
    if (was === step) return;
    if (was === "name" && name.trim()) fly(name.trim().split(/\s+/)[0].toUpperCase(), "in");
    else if (was === "cell") fly(cell.trim() ? "CELL" : "NO CELL", "in");
    else if (was === "email") fly(email.trim() ? "EMAIL" : "NO EMAIL", "in");
    else if (was === "attend") fly(attend === "zoom" ? "ZOOM" : "IN PERSON", "in");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // THE DESK STARTS WHEN THEY START. Waiting for the write meant the mark sat
  // idle through the only part of this somebody is actually looking at. Two
  // characters into a name is enough to know a person is engaged rather than
  // scrolling past, and from that moment the orb is visibly working.
  useEffect(() => {
    if (deskOn) return;
    const engaged = name.trim().length >= 2 || step !== "name";
    if (!engaged) return;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (calm) return;
    const start = window.setTimeout(() => setDeskOn(true), 500);
    return () => window.clearTimeout(start);
  }, [name, step, deskOn]);

  useEffect(() => {
    if (!deskOn) return;
    let n = 0;
    const id = window.setInterval(
      () => {
        const [label, dir] = DESK_WORK[n % DESK_WORK.length];
        n += 1;
        fly(label, dir);
      },
      step === "done" ? 820 : 1150
    );
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deskOn, step]);

  // The orb does what the block is doing, and nothing else.
  const mode: Mode = step === "working" ? "think" : step === "done" ? "speak" : "listen";

  // WHAT THE MARK IS HOLDING. Once they have given a name, Val stops cycling
  // through her thirteen objects and holds THEIR name, spelled in the same
  // wireframe — she is holding their seat, so she holds their name. When the
  // database hands back a reference she switches to that, in cream rather than
  // gold, because at that point the thing she is holding is a receipt. Every
  // character of both came from outside this component: one they typed, one
  // Postgres returned.
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  // She can hold about eight letters legibly at the size the mark runs on a
  // phone. A longer first name becomes a monogram rather than a word cut off
  // mid-letter — "BARTHOLOM" reads as a bug, "BK" reads as a decision. The
  // line underneath then says which one it is, so the claim stays true.
  const initials = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : first.slice(0, 1)).toUpperCase();
  const token = first.length <= 8 ? first : initials;
  const asInitials = token !== first;
  // She keeps holding the NAME, not the reference. A nine-character reference
  // spelled across the mark is a jumble at the size it actually runs — and an
  // illegible receipt is worse than no receipt. The reference is already the
  // largest thing on the stub, in monospace, where a number belongs. What
  // changes here is the colour: gold while she is taking it, cream once it is
  // saved, which is the same shift the key and the sold sign use.
  const spell = step !== "name" ? token : "";
  const spellAccent: [number, number, number] = ref ? [242, 239, 231] : [217, 174, 100];

  const when = eventLine();
  const mailto = useMemo(
    () => rsvpMailto({ name, cell, when: `${when} — reference ${ref || "pending"}` }),
    [name, cell, when, ref]
  );

  const book = useCallback(
    async (chosen: Attend) => {
      setStep("working");
      setTrouble("");
      // The write usually answers in a few hundred milliseconds, which is
      // faster than a human can read one line. The reel is given its three
      // seconds; the CONFIRMATION still waits on the database, so nothing is
      // shown as done before it is.
      const floor = new Promise<void>((r) => setTimeout(r, 3000));
      try {
        const r = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          // Sending the reference back on a retry is what stops a flaky
          // connection turning one person into three seats.
          body: JSON.stringify({ name, cell, email, attend: chosen, ref: ref || undefined }),
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
        setEmailed(Boolean(j.emailed));
        // Out it comes: only what the server actually returned.
        fly(String(j.ref), "out");
        window.setTimeout(() => fly("ROW WRITTEN", "out"), 260);
        if (j.emailed) window.setTimeout(() => fly("EMAIL SENT", "out"), 520);
        window.setTimeout(() => fly("CALENDAR READY", "out"), 780);
        window.setTimeout(() => fly("SEAT HELD", "out"), 1040);
        await floor;
        setStep("done");
        // It landed: hit the orb once, then let the ticket arrive in beats.
        setBeat((n) => n + 1);
        const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        if (calm) {
          setReveal(3);
        } else {
          setReveal(1);
          window.setTimeout(() => setReveal(2), 420);
          window.setTimeout(() => setReveal(3), 980);
        }
      } catch {
        setTrouble("That did not save — nothing was recorded. Try again, or send the message below.");
        setStep("attend");
      }
    },
    [name, cell, ref]
  );

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || askBusy) return;
      setAskBusy(true);
      setAskQ("");
      try {
        const r = await fetch("/api/val", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ q }),
        });
        const j = await r.json().catch(() => null);
        // A reply we did not get is not a reply we invent.
        setAskLog((l) => [
          ...l,
          j?.ok && j.reply
            ? { q, a: String(j.reply), refused: Boolean(j.refused) }
            : { q, a: "I could not reach my own engine just then, so I would rather not guess. Mike is on " + HOST.cell + ".", refused: true },
        ]);
      } catch {
        setAskLog((l) => [
          ...l,
          { q, a: "No connection on my end. Mike is on " + HOST.cell + ".", refused: true },
        ]);
      }
      setAskBusy(false);
    },
    [askBusy]
  );

  // Handed over at the moment they are most likely to actually do it.
  const starter = useMemo(() => starterPrompt(name, ref || "pending"), [name, ref]);
  const orb = useMemo(() => orbPrompt(name), [name]);
  const take = useCallback(async (which: "audit" | "orb", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setTook(which);
    } catch {
      // No clipboard permission: the text is right there and selectable, and
      // the button does not get to claim a copy that did not happen.
      setTook("");
    }
  }, []);

  // Asked only AFTER the seat exists, so a decision about being listed never
  // stands between somebody and their booking.
  const joinRoom = useCallback(async () => {
    try {
      const r = await fetch("/api/room", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref, show: true, brokerage, bringing }),
      });
      const j = await r.json().catch(() => null);
      // Only claim it worked if it worked.
      if (r.ok && j?.ok) { setOnWall(true); setWallSaved(true); }
    } catch {
      setWallSaved(false);
    }
  }, [ref, brokerage, bringing]);

  const saved = at
    ? new Date(at).toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : "";

  // The record as it stands. A field is here only once its value exists —
  // that is what makes this a demonstration rather than a mock-up.
  const rows = [
    ...(name.trim() ? [{ k: "Name", v: name.trim(), hot: step === "name" }] : []),
    ...(cell.trim() ? [{ k: "Cell", v: cell.trim(), hot: step === "cell" }] : []),
    ...(email.trim() ? [{ k: "Email", v: email.trim(), hot: step === "email" }] : []),
    ...(step === "done" ? [{ k: "Attending", v: ATTEND_SAYS[attend] }] : []),
    ...(ref ? [{ k: "Reference", v: ref, hot: true }] : []),
    ...(saved ? [{ k: "Logged", v: saved }] : []),
  ];
  const consStatus = step === "working" ? "writing" : step === "done" ? "saved" : "listening";
  const consNote =
    step === "done"
      ? "That row is in a database now. On your own build this is where the phone buzzes."
      : "This is the other side. When somebody books with you, this is what you would be looking at.";


  return (
    <section className="book" id="seat">
      <ValReel
        facts={LEARNS}
        height="34vh"
        orb="28vh"
        mode={mode}
        busy
        packets={packets}
        beat={beat}
        spell={spell}
        spellAccent={spellAccent}
      />

      {spell && (
        <p className="book-holding" aria-live="polite">
          {ref ? (
            <>
              Val is still holding <b>{first}</b>&rsquo;s seat. The reference on the
              ticket, <b>{ref}</b>, is the row in the database &mdash; not a number
              this page made up to look finished.
            </>
          ) : asInitials ? (
            <>Val is holding <b>{first}</b>&rsquo;s seat &mdash; those are {first}&rsquo;s initials up there, not a font.</>
          ) : (
            <>Val is holding <b>{first}</b>&rsquo;s seat &mdash; and that is {first}&rsquo;s name up there, not a font.</>
          )}
        </p>
      )}

      {boom && (
        <div
          className="boom"
          data-flung={flung ? "yes" : "no"}
          style={{ ["--chars" as string]: boom.length }}
          aria-hidden
        >
          <span className="boom-word display">{boom}</span>
        </div>
      )}

      <div className="book-stage">
      {step !== "done" ? (
        <div className="book-talk">
          {step === "name" && (
            <>
              <p className="book-say display">Hold your seat and watch your assistant go to work.</p>
              <p className="book-sub">
                Everything you type flies into the mark, and everything that
                comes back out is real &mdash; the reference, the row, the
                send.
              </p>
              <form
                className="book-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim().length < 2) return;
                  setStep("cell");
                  // The mark takes their name either way; the big version of
                  // it is the part that gets skipped when motion is unwelcome.
                  const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
                  if (calm) return;
                  setBoom(name.trim().split(/\s+/)[0] ?? "");
                  setFlung(false);
                  window.setTimeout(() => setFlung(true), 880);
                  window.setTimeout(() => setBoom(""), 1620);
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
                onSubmit={(e) => { e.preventDefault(); setStep("email"); }}
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

          {step === "email" && (
            <>
              <p className="book-say display">
                Where do I send your kit?
              </p>
              <p className="book-why">
                Both prompts, every step written out, and your reference — one
                email, no list, no newsletter, no second one unless you ask.
              </p>
              <form
                className="book-row"
                onSubmit={(e) => { e.preventDefault(); setStep("attend"); }}
              >
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 160))}
                  placeholder="you@wherever.com"
                  aria-label="Your email"
                />
                <button type="submit">{email.trim() ? "Send it there" : "Skip it"}</button>
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

          {deskOn && (
            <p className="desk-caption">
              <span className="desk-live-dot" aria-hidden />
              Val is running the job list you will be building on the 2nd
            </p>
          )}

          {step === "working" && <LevelUp first={name.trim().split(/\s+/)[0] ?? ""} />}

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
            {reveal >= 2 && <p className="stub-at">recorded {saved}</p>}
          </div>

          <dl className="dash-rows" data-in={reveal >= 3 ? "yes" : "no"}>
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
              <dd>Claude installed on your phone and your laptop</dd>
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
            <a
              href={`/api/howto?ref=${encodeURIComponent(ref)}&name=${encodeURIComponent(name)}`}
              download
            >
              Every step, as a file
            </a>
            <a href="/api/vcard" download>
              Save Mike&rsquo;s contact
            </a>
            <a href={mailto}>Send it to his inbox too</a>
          </div>

          {deskOn && (
            <div className="desk-live">
              <p className="desk-live-h">
                <span className="desk-live-dot" aria-hidden />
                Your desk, running
              </p>
              <p className="desk-live-p">
                That is the job list &mdash; the buyer at eleven at night, the
                follow-up you would have forgotten, the contract dates, the
                MLS question, and the answer it refuses to make up. You build
                every one of them on the 2nd, on your own account.
              </p>
            </div>
          )}

          {/* ---- BRING SOMEONE. The cheapest seat in the room is the one
              somebody already coming brings with them, and the moment to ask
              is now — thirty seconds after a yes, not in an email next week.
              Everything here carries their first name so what a friend opens
              is an invitation rather than a link. ---- */}
          <Share from={name} />

          {/* ---- ASK VAL. The hour, demonstrated on the way in the door. ----
              A page can claim an assistant will refuse to make things up. This
              one lets a stranger prove it, thirty seconds after booking, using
              the same engine the room runs on. The refusals are the feature:
              ask it about parking and watch it decline rather than guess. */}
          <div className="askval">
            <p className="askval-h display">
              <ClaudeMark size={26} className="askval-mark" />
              Ask me anything about Friday.
            </p>
            <p className="askval-sub">
              This is the real thing, on the same engine you will build with.
              Ask it something nobody told it and watch it refuse instead of
              making something up. That refusal is the whole hour.
            </p>

            {askLog.map((t, i) => (
              <div className="askval-turn" key={i}>
                <p className="askval-q">{t.q}</p>
                <p className={t.refused ? "askval-a is-refusal" : "askval-a"}>
                  {t.a}
                  {t.refused && <span className="askval-tag">refused to invent</span>}
                </p>
              </div>
            ))}

            {askBusy && <p className="askval-thinking">Val is thinking…</p>}

            <form
              className="askval-form"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(askQ);
              }}
            >
              <input
                value={askQ}
                onChange={(e) => setAskQ(e.target.value)}
                placeholder="What should I bring?"
                aria-label="Ask Val about Friday"
                maxLength={400}
              />
              <button type="submit" disabled={askBusy || askQ.trim().length < 2}>
                Ask
              </button>
            </form>

            <div className="askval-seeds">
              {["What do I need to bring?", "Is there parking?", "What is the flexmls MCP?"].map((sd) => (
                <button key={sd} type="button" onClick={() => void ask(sd)} disabled={askBusy}>
                  {sd}
                </button>
              ))}
            </div>
          </div>

          {/* ---- the room ---- */}
          {!onWall ? (
            <div className="join">
              <h3 className="display">Want the room to know you&rsquo;re coming?</h3>
              <p>
                Half of why anyone shows up is who else will be there. Put your
                first name and brokerage on the page and somebody who is on the
                fence sees a name they recognise. First name and brokerage
                only — never your number, never your full name.
              </p>
              <div className="join-in">
                <label>
                  <span>Brokerage or team</span>
                  <input
                    value={brokerage}
                    onChange={(e) => setBrokerage(e.target.value.slice(0, 60))}
                    placeholder="optional"
                  />
                </label>
                <label>
                  <span>Bringing something you built?</span>
                  <input
                    value={bringing}
                    onChange={(e) => setBringing(e.target.value.slice(0, 160))}
                    placeholder="optional — what is it?"
                  />
                </label>
              </div>
              <button type="button" onClick={joinRoom} className="join-go">
                Put me on the list
              </button>
              <p className="join-fine">
                Skip it and nothing about you appears anywhere. Your seat is
                held either way.
              </p>
            </div>
          ) : (
            <p className="join-done">
              You&rsquo;re on the wall{brokerage ? ` with ${brokerage}` : ""}
              {bringing ? ", and marked as bringing a build" : ""}. Somebody on
              the fence is going to see your name and decide to come.
            </p>
          )}

          {/* THE QR, HERE, NOW.
              This used to live only in an email, which made the whole product
              wait on a mail provider being configured — and on a stranger's
              spam folder. It does not need to. The reference exists the moment
              the row is written, so the code that opens their kit can be on
              the screen they are already looking at, and their phone can take
              it straight off the laptop in front of them. The email, when it
              is switched on, becomes a second copy of something they already
              have rather than the only way to get it. */}
          <div className="dash-kit">
            <h3 className="display">Point your phone at this.</h3>
            <p>
              It opens your page: the interview that builds your assistant, the
              one that writes your listing sheet, and the box that puts your
              listing behind a QR code of its own before Friday.
            </p>
            <div className="dash-qr">
              <img
                src={`/api/qr?u=${encodeURIComponent(`/kit/${ref}`)}`}
                alt={`QR code that opens your kit, reference ${ref}`}
                width={260}
                height={260}
              />
              <p>No app, no typing. Or tap the button if you are on your phone already.</p>
            </div>
            <a className="dash-kit-go" href={`/kit/${encodeURIComponent(ref)}`}>
              Open my kit
            </a>
            <p className="dash-kit-fine">
              {emailed
                ? `A copy is in your inbox at ${email} too — check spam if it is not there in a minute.`
                : "Screenshot this or bookmark the page. Nothing was emailed, and this page will not pretend otherwise — the code above is the whole thing."}
            </p>
          </div>

          <p className="dash-truth">
            Straight about what just happened: your reservation is a row in a
            database with that reference and that time on it, and you can hold
            Mike to it. Nothing was emailed or texted — this page cannot do
            that, so it is not going to tell you it did. The last button opens
            a message in your own app if you want it in his inbox as well.
          </p>

          <p className="dash-sell">
            That was the demo, by the way. You asked for a seat, I took the
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
              <button type="button" onClick={() => take("audit", starter)}>
                {took === "audit" ? "Copied — now paste it into Claude" : "Copy my audit"}
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

            <div className="starter-orb">
              <h4 className="display">And build the thing you have been staring at.</h4>
              <p>
                One more, for the fun of it. This one builds you your own
                version of Val — the mark at the top of this page — as a single
                file you double-click. Your colours, your market, your shapes.
                It goes on a laptop at an open house, or in a screen recording
                that does not look like everybody else&rsquo;s.
              </p>
              <p className="starter-real">
                Straight with you: this hands over the method — the maths, the
                lighting, the morph — not our finished engine. You will get
                something good in one shot and something great after you push
                it around. That pushing is what Friday is.
              </p>
              <button type="button" onClick={() => take("orb", orb)}>
                {took === "orb" ? "Copied — paste it into Claude" : "Copy the orb build"}
              </button>
            </div>

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

        <Console
          rows={rows}
          status={consStatus}
          note={consNote}
          hit={Boolean(boom) && flung}
        />
      </div>
    </section>
  );
}
