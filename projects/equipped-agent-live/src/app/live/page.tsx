import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Top } from "./top";
import { Profile } from "./profile";
import { Room } from "./room";
import { Book } from "./book";
import { Reveal } from "./reveal";
import { ClaudeMark } from "./claude-mark";
import { Share } from "./share";
import { INSTALL } from "@/lib/install";
import { FromBanner } from "./from-banner";
import { Closer } from "./closer";
import { Seats } from "./seats";
import { HOST } from "@/lib/contact";
import { EVENT } from "@/lib/event";

// THE INVITE.
//
// One argument, one action. A stranger opens this from a Facebook post and
// has to get four things before they decide: what it is, that it is real,
// what happens in the hour, and who else is in the room. Then one button.
//
// Everything else that used to be here — both prompts, the orb build, the
// full run sheet, what we build for other people, Track to Keys — moved to
// the kit page they reach the second they book. That is the right order: the
// page makes the case, the kit is the payoff. A page carrying both was
// fifteen phone screens and asked somebody to choose between four demos,
// which is how you get "later" instead of a seat.
// THE CARD IS A VERSIONED FILE, ON PURPOSE.
//
// It shipped as /og.png, which a CDN is entitled to hold for a year and which
// Facebook had already fetched with the old crop in it. Renaming the file
// means every fresh fetch — a new share, a new scrape, any platform that has
// not seen this page before — gets the corrected card, and nothing anywhere
// can still be serving the one with the top of his head cut off.
//
// What it does NOT do is clear what Facebook already has against THIS page
// URL. That cache is keyed on the page, not the image, and only a scrape from
// the Sharing Debugger clears it.
export const metadata: Metadata = {
  title: "The Equipped Agent",
  description:
    "Charleston's Claude community. Friday, October 2, noon ET — build a working AI assistant in an hour and take it home.",
  robots: { index: true },
  openGraph: {
    title: "The Equipped Agent",
    description: "Mike Olson · Friday, October 2 · noon ET",
    type: "website",
    images: [{ url: "/og-oct2.png", width: 1200, height: 630, alt: "The Equipped Agent" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Equipped Agent",
    description: "Mike Olson · Friday, October 2 · noon ET",
    images: ["/og-oct2.png"],
  },
};

export default function LivePage() {
  return (
    <main className="stage invite">
      <Reveal />
      <Suspense fallback={null}>
        <FromBanner />
      </Suspense>
      <div className="rail">
        {/* The real mark, not a typeset stand-in. eslint-disable-next-line
            @next/next/no-img-element — a plain img keeps this a static file
            with no loader in front of it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/surfstung-logo.png"
          alt="Surfstung Systems"
          width={748}
          height={536}
          className="rail-logo"
        />
        <span className="rail-and">with</span>
        <span className="rail-tac">The AGENT Connection</span>
      </div>

      <Top
        head={
          <header className="invite-head">
            <h1 className="display">
              The Equipped
              <br />
              Agent
            </h1>
            <p className="invite-kicker" data-reveal>
              <ClaudeMark size={30} className="kicker-mark" />
              Charleston&rsquo;s Claude community &mdash; for agents already building, and agents starting from zero.
            </p>
            <p className="invite-lede" data-reveal>
              <b>Not keeping up with AI? You are already behind.</b>{" "}
              One hour. You build a working assistant on your own Claude
              account and walk out with it running.
            </p>
            <p className="invite-lede-fine" data-reveal>You leave with it working, and it is yours.</p>
            <div className="invite-actions" data-reveal>
              <a className="invite-cta" href="#seat">Save my seat</a>
              <Share compact />
            </div>
          </header>
        }
        details={
          <div className="invite-details">
            <dl className="stamp" data-reveal>
              <div>
                <dt>When</dt>
                <dd>
                  <b>Friday, October 2</b>
                  <span className="stamp-num">12:00pm ET</span>
                  <span>
                    Doors {EVENT.doors} — get set up and network. {EVENT.guests}{" "}
                    will be there too.
                  </span>
                </dd>
              </div>
              <div>
                <dt>Where</dt>
                <dd>
                  <b>2000 Sam Rittenberg Blvd, Suite 2020</b>
                  <span>Charleston — {EVENT.online}</span>
                </dd>
              </div>
              <div>
                <dt>Bring</dt>
                <dd>
                  <b>Claude installed on your phone and your laptop.</b>
                  <span>Both devices, free tier is fine — plus anything you have already built.</span>
                </dd>
              </div>
            </dl>
            <Seats />
          </div>
        }
      />

      {/* ---- 1. The hour itself, in three lines. ---- */}
      <section className="hour" data-reveal>
        <h2 className="display">One hour. Three things.</h2>
        <ol className="hour-list">
          <li data-reveal>
            <span>First fifteen</span>
            <p>
              Claude on the work you already do. Then a listing answers its own
              phone &mdash; and refuses to invent an answer nobody gave it.
              That refusal is why this is safe in front of a client.
            </p>
          </li>
          <li data-reveal>
            <span>Next thirty</span>
            <p>
              You build your own agent. Your listing, your account, your number
              &mdash; working before you leave, with a QR code for a real sign.
            </p>
          </li>
          <li data-reveal>
            <span>Last fifteen</span>
            <p>
              <b>The new flexmls MCP.</b>{" "}We hook Claude straight into the MLS,
              live on the screen, and ask it about a farm in plain English.
              Almost nobody in this market has done it &mdash; you will leave
              knowing how.
            </p>
          </li>
        </ol>
        <div className="install" data-reveal>
          <p className="install-h">
            <b>Have Claude installed on your phone and your laptop before you
            come.</b> That is the only homework — and here it is.
          </p>
          <div className="install-go">
            <a href={INSTALL.ios} target="_blank" rel="noopener noreferrer">
              iPhone &mdash; App Store
            </a>
            <a href={INSTALL.android} target="_blank" rel="noopener noreferrer">
              Android &mdash; Google Play
            </a>
            <a href={INSTALL.web} target="_blank" rel="noopener noreferrer">
              Laptop &mdash; claude.ai
            </a>
          </div>
          <p className="install-fine">
            The free tier is fine. Sign in on both before the 2nd and you will
            build for the whole hour instead of setting up for the first twenty
            minutes.
          </p>
        </div>

        {/* The objection that keeps the most people home, answered on the
            page rather than in the room they did not come to — and answered
            SHORT. This block used to run four long paragraphs and cost more
            seats than it saved. Somebody deciding in a feed reads two. */}
        <div className="hour-calm" data-reveal>
          <p className="hour-calm-h display">Watching everyone else pull ahead?</p>
          <p>
            Most agents are not behind on effort. They are behind because
            nobody handed them the tools.
          </p>
          <p className="hour-bring">
            Come see what the other side looks like. Nobody will ask you
            anything, and none of it is technical &mdash; it all happens in a
            chat box.
          </p>
        </div>

        {/* The part people actually come back for. */}
        <div className="hour-stay" data-reveal>
          <p className="hour-calm-h display">Then stay and show off.</p>
          <p>
            Bring what you have built &mdash; half finished counts. Builds go
            on the screen, you see what everyone else is running, and we work
            out where I can help.
          </p>
        </div>
      </section>

      {/* ---- 2. Who else is in the room. ---- */}
      <Room />

      {/* ---- 3. Who is running it. ---- */}
      <section className="invite-who" data-reveal>
        <h2 className="display">The job title is new. The twenty years are not.</h2>
        <Profile />
        <p>
          Inspector, agent, multifamily investor, and now the person who builds
          these systems for the agents around him. None of this came out of a
          course.
        </p>
      </section>

      {/* ---- 4. The one action. ---- */}
      <Book />

      <Closer />

      <section className="share-block" data-reveal>
        <Share label="Know an agent who should be in the room?" />
      </section>

      <div className="claude-band" data-reveal>
        <ClaudeMark size={62} />
        <div>
          <p className="claude-band-h">Built on Claude.</p>
          <p className="claude-band-p">
            Bring it on your phone and your laptop. The free tier is fine.
          </p>
        </div>
      </div>

      <footer className="invite-foot">
        <p>
          Mike Olson&rsquo;s tech company, and everything already built and
          running for agents.
        </p>
        <p className="foot-go">
          <Link href="/val" className="share-secondary">
            Meet Val &amp; Surfstung Systems
          </Link>
        </p>
        <p className="invite-sponsor">
          Hosted by {HOST.org}. Built and sponsored by Surfstung Systems.
        </p>
        <p className="invite-pillars">
          Smarter tools. Stronger agents. Bigger opportunities. Real impact.
        </p>
        <p className="invite-legal">
          Claude is a product of Anthropic. The Equipped Agent is an
          independent meetup and is not affiliated with, sponsored by or
          endorsed by Anthropic.
        </p>
      </footer>
    </main>
  );
}
