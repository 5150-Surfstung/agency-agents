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
// AND THEN THE DOOR OPENS. Tapping it reveals where to be, what to bring, and
// a live listing assistant they can argue with from the parking lot. The copy
// is careful about one thing: it never says the message was received, because
// this page cannot know that. It says the message is open, which is true.

import { useMemo, useState } from "react";
import Link from "next/link";
import { HOST } from "@/lib/contact";
import { EVENT, eventIsSet, eventLine } from "@/lib/event";
import { RSVP_CC, RSVP_TO, rsvpMailto } from "@/lib/signup";

export function Rsvp() {
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [inside, setInside] = useState(false);

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
    <div className="rounded-3xl border border-gold/50 bg-sheet-2 p-6 sm:p-8">
      <p className="label text-[11px] tracking-[0.22em] text-gold">Save your seat</p>
      <h2 className="mt-2 display text-3xl font-extrabold leading-tight text-cream sm:text-4xl">
        One hour. Bring a phone.
      </h2>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-soft">
        No form, no funnel, no list. The button opens a message in your own app, already
        written — you hit send. That is the entire system.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label block text-[10px] tracking-[0.2em] text-faint">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="optional"
            className="mt-1.5 w-full rounded-xl border border-rule bg-sheet px-4 py-3 text-base text-cream placeholder:text-faint focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="label block text-[10px] tracking-[0.2em] text-faint">Your cell</span>
          <input
            value={cell}
            onChange={(e) => setCell(e.target.value.slice(0, 24))}
            inputMode="tel"
            placeholder="optional"
            className="mt-1.5 w-full rounded-xl border border-rule bg-sheet px-4 py-3 text-base text-cream placeholder:text-faint focus:border-gold focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={mailto}
          onClick={() => setInside(true)}
          className="flex-1 rounded-2xl bg-gold px-6 py-4 text-center text-lg font-extrabold text-sheet"
        >
          Save my seat
        </a>
        <a
          href={sms}
          onClick={() => setInside(true)}
          className="flex-1 rounded-2xl border border-gold px-6 py-4 text-center text-lg font-extrabold text-gold"
        >
          Or text Mike
        </a>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-faint">
        Goes to {RSVP_TO}, {RSVP_CC.split("@")[0]} copied. Nothing is stored on this page.
      </p>

      {/* ---- through the door ---- */}
      {inside && (
        <div className="mt-7 border-t border-gold/40 pt-6">
          <p className="label text-[11px] tracking-[0.22em] text-gold-bright">You&apos;re on the list</p>
          <h3 className="mt-2 display text-2xl font-extrabold leading-snug text-cream sm:text-3xl">
            Hit send in the app that just opened. Then read this part.
          </h3>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-rule bg-sheet p-4">
              <dt className="label text-[10px] tracking-[0.2em] text-gold">Where</dt>
              {EVENT.place ? (
                <dd className="mt-1.5 text-[15px] leading-relaxed text-cream">{EVENT.place}</dd>
              ) : (
                <dd className="mt-1.5 text-[15px] leading-relaxed text-soft">
                  The AGENT Connection office, Charleston — the exact address comes back with
                  your confirmation, so it lands in your thread and not in a screenshot.
                </dd>
              )}
              {EVENT.online && (
                <dd className="mt-1.5 text-[15px] text-soft">
                  You can come {EVENT.online} — say which in your reply. The Zoom link comes
                  back with your confirmation.
                </dd>
              )}
            </div>
            <div className="rounded-2xl border border-rule bg-sheet p-4">
              <dt className="label text-[10px] tracking-[0.2em] text-gold">When</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-cream">
                {eventIsSet ? when : "Announced this week — you will hear before it is public."}
              </dd>
              <dd className="mt-1.5 text-[15px] text-soft">One hour, and it starts on time.</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-2xl border border-rule bg-sheet p-4">
            <p className="label text-[10px] tracking-[0.2em] text-gold">Bring</p>
            <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-soft">
              <li>· <span className="font-bold text-cream">A laptop with Claude installed.</span> This is a Claude-based program — the free tier is genuinely fine.</li>
              <li>· <span className="font-bold text-cream">Your cellphone</span>, charged. It is half the show.</li>
              <li>· One listing you know cold. Any listing. You will build its assistant in the room.</li>
            </ul>
          </div>

          {/* THE TEASER. Not a promise about what AI can do — a thing that is
              already running, that they can try to break, from the parking lot. */}
          <div className="mt-5 rounded-2xl border border-gold bg-sheet p-5">
            <p className="label text-[10px] tracking-[0.22em] text-gold-bright">
              Before you come · this is live right now
            </p>
            <p className="mt-2 display text-xl font-extrabold leading-snug text-cream sm:text-2xl">
              Argue with one.
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-soft">
              This is a real listing assistant, answering from a fact sheet, on a page with a QR
              code on it. Ask it how many bedrooms. Then ask it when the water heater was
              replaced — something nobody told it — and watch it refuse to make one up instead
              of inventing an answer. That refusal is the part most agents have never seen, and
              it is the reason any of this is safe to put in front of a client.
            </p>
            <Link
              href="/a/HAUS24"
              className="mt-4 inline-block rounded-xl bg-gold px-5 py-3 text-base font-extrabold text-sheet"
            >
              Try to break it →
            </Link>
            <p className="mt-3 text-[13px] leading-snug text-faint">
              You will build one of these, on your own account, in the room. It is yours when
              you leave.
            </p>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-soft">
            Or reserve on the{" "}
            <a href={EVENT.rsvpUrl} className="font-bold text-gold underline-offset-4 hover:underline">
              Agent Connection page
            </a>{" "}
            — same seat, same room. Nothing opened?{" "}
            <a href={`mailto:${RSVP_TO}?cc=${RSVP_CC}&subject=Save%20me%20a%20seat`} className="font-bold text-gold underline-offset-4 hover:underline">
              Email {RSVP_TO}
            </a>{" "}
            or text {HOST.cell}. Either one works.
          </p>
        </div>
      )}
    </div>
  );
}
