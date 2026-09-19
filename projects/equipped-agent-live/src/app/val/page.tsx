import type { Metadata } from "next";
import Link from "next/link";
import { OrbLazy } from "./orb-lazy";
import { Reveal } from "@/app/live/reveal";
import { ClaudeMark } from "@/app/live/claude-mark";
import { HOST } from "@/lib/contact";

// MEET VAL & SURFSTUNG SYSTEMS.
//
// The old version of this page described Val as a pattern library, which is
// true and is also the least interesting true thing about it. Somebody reaches
// this from the bottom of the invite asking one question — who is this guy and
// what does he actually build — and the answer was a shelf list.
//
// It is the company page now. Every product named below is live at the URL
// printed next to it; every line of the Surfstung copy is lifted from
// surfstung.vercel.app rather than written fresh, because a second set of
// words for the same company is how two pages end up disagreeing.
//
// Nothing here claims a price, a timeline or a result that Mike has not said.

export const metadata: Metadata = {
  title: "Meet Val & Surfstung Systems — Mike Olson's tech company",
  description:
    "Val is the assistant behind every build. Surfstung Systems is Mike Olson's software company in Charleston — custom tools for agents, brokerages and local business. See what is already live.",
};

/** Every one of these is shipped and reachable. A link that 404s on a page
 *  whose whole argument is "we actually build things" costs more than the
 *  product it was pointing at. */
const BUILDS: { name: string; url: string; what: string }[] = [
  {
    name: "Track to Keys",
    url: "https://tracktokeys.app",
    what: "The deal OS for a South Carolina agent. Every contract date counted from the ratified date, e-signatures, showing feedback, seller updates and a neighbour card — so nothing depends on remembering.",
  },
  {
    name: "Living CMA",
    url: "https://living-cma.vercel.app",
    what: "A homeowner keeps an eye on their own place — county record, nearby closings, a net sheet — and the ones who are actually thinking about selling surface themselves on an intent-scored desk.",
  },
  {
    name: "AI Receptionist",
    url: "https://ai-receptionist-opal.vercel.app",
    what: "Answers the phone when you cannot, qualifies the caller, offers real windows, and hands over a warm lead instead of a voicemail. Built to say it does not know rather than invent.",
  },
  {
    name: "Mount Pleasant Index",
    url: "https://mtp-index.vercel.app",
    what: "A seven-neighbourhood farming platform built on public deed records. One agent owns the data story for their patch instead of renting leads.",
  },
  {
    name: "Bring Your Numbers",
    url: "https://bring-your-numbers.vercel.app",
    what: "An agent puts their own production in and sees what the maths actually does — no pitch attached to the output.",
  },
  {
    name: "The AGENT Connection",
    url: "https://theagentconnection.com",
    what: "Speed to lead for a real brokerage: a consumer arrives, Val answers instantly, the agents get blasted, and one desk controls where every message goes.",
  },
];

/** Straight from surfstung.vercel.app. Same company, same words. */
const SOLUTIONS: { title: string; body: string }[] = [
  {
    title: "AI assistants",
    body: "An assistant that answers your customers from your documents — accurately, 24/7, with receipts.",
  },
  {
    title: "Websites that win business",
    body: "Fast, sharp sites that turn visitors into calls — built around your actual services, not a template.",
  },
  {
    title: "Client portals",
    body: "Give customers one login to see progress, documents, and messages — instead of a hundred emails.",
  },
  {
    title: "Booking & payments",
    body: "Appointments, sign-ups, and payments in one flow — no more chasing checks or double-booked Saturdays.",
  },
  {
    title: "Ops dashboards",
    body: "Your whole operation on one screen — who's signed, who's paid, what needs you today.",
  },
  {
    title: "Team & league scheduling",
    body: "Seasons, game days, rosters, and reminders that run themselves — coaches and parents always know what's next.",
  },
];

export default function ValPage() {
  return (
    <main className="stage invite">
      <Reveal />
      <section className="valhero">
        <OrbLazy className="valhero-orb pointer-events-none" />
        <div className="valhero-said">
          <p className="valhero-kicker">
            <ClaudeMark size={26} />
            Surfstung Systems · Charleston, SC
          </p>
          <h1 className="display valhero-h">
            Meet Val &amp;
            <br />
            Surfstung Systems
          </h1>
          <p className="valhero-sub">Mike Olson&rsquo;s tech company.</p>
          <p className="valhero-lede">
            <b>The tool you wish existed? We build it.</b> Websites, apps and
            systems shaped to exactly how you run things &mdash; a brokerage, a
            league, a business. A working concept in your hands within a week
            of kickoff, and more affordable than you would think.
          </p>
          <div className="valhero-go">
            <a className="invite-cta" href={`tel:${HOST.cellE164}`}>
              Call Mike &mdash; {HOST.cell}
            </a>
            <a className="share-secondary" href={`mailto:${HOST.email}`}>
              Email him
            </a>
          </div>
        </div>
      </section>

      <section className="hour" data-reveal>
        <h2 className="display">Who Val is.</h2>
        <p className="valbody">
          Val is the assistant inside every build on this page. One set of
          operating rules, reused: answer from what you actually gave it, say
          plainly when it has not been told something, never claim it sent or
          filed anything, and never guess at a number with your name on it.
        </p>
        <p className="valbody">
          That last part is the whole product. An assistant that makes things
          up is not a faster assistant, it is a liability with your licence
          attached &mdash; so every one of these is built to refuse first and be
          impressive second.
        </p>
      </section>

      <section className="hour" data-reveal>
        <h2 className="display">Already built. Already running.</h2>
        <p className="valbody">
          Real estate first, because that is the business Mike has been in for
          twenty years. Every one of these is live right now &mdash; open them.
        </p>
        <ul className="buildlist">
          {BUILDS.map((b) => (
            <li key={b.name}>
              <a href={b.url} target="_blank" rel="noopener noreferrer">
                <span className="buildlist-name">{b.name}</span>
                <span className="buildlist-url">{b.url.replace("https://", "")}</span>
              </a>
              <p>{b.what}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="hour" data-reveal>
        <h2 className="display">Built for exactly what you do.</h2>
        <p className="valbody">
          No bloated licences. No features you will never open. Your workflow,
          turned into software &mdash; and not only for agents.
        </p>
        <ul className="solgrid">
          {SOLUTIONS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="share-block" data-reveal>
        <div className="share">
          <p className="share-h display">Want one of these for your business?</p>
          <p className="share-p">
            Mike builds these himself, in Charleston. Tell him what you wish
            existed and he will tell you straight whether it is worth building.
          </p>
          <div className="share-go">
            <a className="share-primary" href={`tel:${HOST.cellE164}`}>
              {HOST.cell}
            </a>
            <a className="share-secondary" href={`mailto:${HOST.email}`}>
              {HOST.email}
            </a>
            <a className="share-secondary" href="https://surfstung.vercel.app" target="_blank" rel="noopener noreferrer">
              surfstung.com
            </a>
          </div>
        </div>
      </section>

      <div className="claude-band" data-reveal>
        <ClaudeMark size={58} />
        <div>
          <p className="claude-band-h">Come and build one.</p>
          <p className="claude-band-p">
            The Equipped Agent, Friday October 2 at noon.{" "}
            <Link href="/live">Take a seat</Link>.
          </p>
        </div>
      </div>

      <footer className="invite-foot">
        <p className="invite-sponsor">
          {HOST.full} &middot; {HOST.title}, {HOST.org} &middot; REALTOR
          <sup>&reg;</sup>, {HOST.brokerage}
        </p>
        <p className="invite-legal">
          Claude is a product of Anthropic. Surfstung Systems is an independent
          company and is not affiliated with, sponsored by or endorsed by
          Anthropic.
        </p>
      </footer>
    </main>
  );
}
