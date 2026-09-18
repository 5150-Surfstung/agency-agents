import type { Metadata } from "next";
import Link from "next/link";
import { Copy, Peek } from "./copy";
import { ValReel } from "@/app/live/val-reel";
import { LEARNS } from "@/app/live/learns";
import { SERIES, SURFSTUNG_WORK, MLS_ASKS } from "@/lib/kit";
import { orbPrompt, starterPrompt } from "@/lib/prompts";
import { HOST } from "@/lib/contact";
import { EVENT } from "@/lib/event";
import { getStore } from "@/lib/store";

// THE PLAYGROUND.
//
// The email used to BE the kit, which made it a nine-thousand-pixel message
// with two full prompts inside it — Gmail clips over about 102KB behind "view
// entire message", half of clients block the images, and copying a prompt out
// of a pre block on a phone is miserable. So the email got short and this
// became the kit: one page, keyed to their reference, with buttons that
// actually copy.
//
// It is also the version that keeps working. Improve a prompt tomorrow and
// everybody who booked yesterday gets the better one, because they hold a
// link rather than a copy.
//
// Unlisted rather than secret: you need the reference to find it, and it
// shows a first name and nothing else about anybody.

export const metadata: Metadata = {
  title: "Your kit — The Equipped Agent",
  robots: { index: false },
};

export default async function KitPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref: raw } = await params;
  const ref = decodeURIComponent(raw).toUpperCase().slice(0, 24);

  let who = "";
  try {
    const row = /^EA-[A-Z0-9]{6}$/.test(ref) ? await getStore().rsvpGet(ref) : null;
    who = row?.who ?? "";
  } catch {
    // A lookup that fails is not a reason to withhold the kit — the prompts
    // are the point and they do not depend on knowing a name.
    who = "";
  }

  const audit = starterPrompt(who, ref);
  const orb = orbPrompt(who);

  return (
    <main className="stage pg">
      <div className="rail">
        <span className="rail-mark"><i aria-hidden />Surfstung Systems</span>
        <span className="rail-and">with</span>
        <span className="rail-tac">The AGENT Connection</span>
      </div>

      <ValReel facts={LEARNS} height="32vh" orb="26vh" />

      <header className="pg-head">
        <h1 className="display">{who ? `Your kit, ${who}.` : "Your kit."}</h1>
        <p className="pg-ref">
          {/^EA-[A-Z0-9]{6}$/.test(ref) ? ref : "The Equipped Agent"}
          <span>
            {EVENT.date} · {EVENT.time} · {EVENT.place}
          </span>
        </p>
        <p className="pg-lede">
          Everything here is yours to keep whether you make it on the 2nd or
          not. Bookmark this — the prompts get better and this link always has
          the current ones.
        </p>
      </header>

      {/* ---- the two prompts, which are the whole point ---- */}
      <section className="pg-block">
        <p className="pg-n">One</p>
        <h2 className="display">Build your own assistant</h2>
        <p>
          Paste this into a new chat at{" "}
          <a href="https://claude.ai/new" target="_blank" rel="noreferrer">claude.ai</a>{" "}
          and answer its questions. It asks what you do for a living first, so
          it works whether you sell houses or run a salon. Twenty minutes, and
          the free plan runs it fine.
        </p>
        <p>
          It ends by writing you a Skill — a permanent version of your
          assistant that already knows your work. <b>It is built in your
          account, it lives there, nobody here gets a copy,</b> and you can
          rewrite any line of it forever.
        </p>
        <Copy text={audit} label="Copy the interview" />
        <Peek text={audit} />
      </section>

      <section className="pg-block">
        <p className="pg-n">Two</p>
        <h2 className="display">Build your own mark</h2>
        <p>
          The thing turning above. Your colours, your objects, one HTML file
          you double-click. Your assistant from step one can already do this —
          just say <b>&ldquo;build my mark&rdquo;</b> — and this is the
          standalone version if you want it on its own or want to hand it to
          somebody else.
        </p>
        <Copy text={orb} label="Copy the mark build" kind="quiet" />
        <Peek text={orb} />
      </section>

      {/* ---- the things that download ---- */}
      <section className="pg-block">
        <p className="pg-n">Three</p>
        <h2 className="display">Keep the rest</h2>
        <ul className="pg-files">
          <li>
            <a href={`/api/howto?ref=${encodeURIComponent(ref)}&name=${encodeURIComponent(who)}`} download>
              Every step, as a file
            </a>
            <span>Both prompts and the whole walkthrough, in plain text.</span>
          </li>
          <li>
            <a href={`/api/val-skill?name=${encodeURIComponent(who)}`} download>
              Val, ready-made
            </a>
            <span>
              Skip the interview and install a general one. Needs a paid plan;
              on free, use the interview above instead.
            </span>
          </li>
          <li>
            <a href={`/api/ics?ref=${encodeURIComponent(ref)}`} download>
              Put it in my calendar
            </a>
            <span>Friday, October 2, noon. With an hour&rsquo;s warning.</span>
          </li>
          <li>
            <a href="/api/vcard" download>Save {HOST.first}&rsquo;s contact</a>
            <span>Straight into your phone.</span>
          </li>
        </ul>
      </section>

      {/* ---- the series ---- */}
      <section className="pg-block">
        <h2 className="display">It is a series, not an event</h2>
        <p>
          First Friday of every month, same room. Each one assumes the last one
          happened, so the earlier you start the further ahead you get — and if
          you miss one, the next is four weeks away, not gone.
        </p>
        <ol className="pg-series">
          {SERIES.map(([d, note], i) => (
            <li key={d} data-now={i === 0 ? "yes" : "no"}>
              <b>{d}</b>
              <span>{note}</span>
            </li>
          ))}
        </ol>
        <p className="pg-small">
          In the room on the 2nd: a listing that answers its own phone, you
          building yours, and the FlexMLS connector switched on live so you can
          ask things like &ldquo;{MLS_ASKS[0]}&rdquo; in plain English. Then
          nobody gets rushed out.
        </p>
      </section>

      {/* ---- what Val is, for everyone who is not an agent ---- */}
      <section className="pg-block">
        <h2 className="display">What Val actually is</h2>
        <p>
          Val is the assistant that took your seat. It is not a real-estate
          product — real estate is just where we have proved it hardest.
        </p>
        <p>
          Underneath it is one idea: take the part of a business that only
          lives in somebody&rsquo;s head or somebody&rsquo;s inbox, write it
          down properly, and put it somewhere that answers instantly, at two in
          the morning, without inventing anything. A dentist&rsquo;s front
          desk. A charter captain&rsquo;s calendar. A contractor&rsquo;s quote
          follow-up. A law office&rsquo;s intake, on a machine that never sends
          the file anywhere. Same idea every time; only the vocabulary changes.
        </p>
        <p className="pg-hit">
          What it buys you: the first sixty seconds after somebody raises their
          hand stop being wasted, the work that gets dropped at six stops being
          dropped, and the thing you would only trust yourself to do gets done
          the same way whether you are there or not.
        </p>

        <h3 className="display">What else we build</h3>
        <dl className="pg-work">
          {SURFSTUNG_WORK.map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
        <p>
          Not a menu — a list of things already built. If one of them is yours,
          that is a conversation, not a proposal:{" "}
          <a href={`mailto:${HOST.email}`}>{HOST.email}</a>
        </p>
        <p className="pg-hit">
          And the thing nobody asks out loud: <b>we build for any agent, at any
          brokerage.</b> You do not have to move to eXp, or to The AGENT
          Connection, or anywhere. Come, take the prompts, have something built
          — none of it is contingent on where your licence hangs.
        </p>
      </section>

      {/* ---- Track to Keys. Shown, not linked: there is no gate on it yet. ---- */}
      <section className="pg-block">
        <h2 className="display">Track to Keys</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/t2k-demo.jpg" alt="Track to Keys — every deadline in a contract, computed from two dates" className="pg-shot" width={1000} height={691} />
        <p>
          Two dates in, every deadline in the contract out — with what each one
          costs if it slips, and a plain-English version you can text your
          client the same night. It is the thing agents ask us for twice a
          week.
        </p>
        <p className="pg-hit">
          <b>TAC agents get exclusive pricing.</b> It is not open for sign-up
          yet, so there is nothing to click — ask {HOST.first} in the room on
          the 2nd, or reply to your confirmation and he will tell you where it
          is up to.
        </p>
      </section>

      <footer className="pg-foot">
        <p>
          Buying or selling a house? {HOST.full} is a REALTOR<sup>®</sup> with{" "}
          {HOST.brokerage} — twenty years, inspector first, then agent, then
          multifamily. If you have been idly wondering what yours is worth, or
          you know somebody moving, that is a text to {HOST.cell}. Not a
          commitment.
        </p>
        <p className="pg-small">
          Anything at all: text {HOST.cell}, or email {HOST.email} with {ref}.{" "}
          <Link href="/live">The invitation is here</Link> if you want to send
          it to somebody.
        </p>
      </footer>
    </main>
  );
}
