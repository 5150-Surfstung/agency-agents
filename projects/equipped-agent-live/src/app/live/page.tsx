import type { Metadata } from "next";
import Link from "next/link";
import { Top } from "./top";
import { MarketPanel } from "./market-panel";
import { Profile } from "./profile";
import { Room } from "./room";
import { Book } from "./book";
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
export const metadata: Metadata = {
  title: "The Equipped Agent",
  description: "Mike Olson · Friday, October 2 · noon ET",
  robots: { index: true },
  openGraph: {
    title: "The Equipped Agent",
    description: "Mike Olson · Friday, October 2 · noon ET",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Equipped Agent" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Equipped Agent",
    description: "Mike Olson · Friday, October 2 · noon ET",
    images: ["/og.png"],
  },
};

export default function LivePage() {
  return (
    <main className="stage invite">
      <div className="rail">
        <span className="rail-mark">
          <i aria-hidden />
          Surfstung Systems
        </span>
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
            <p className="invite-lede">
              One hour, live, in our office in West Ashley. You will not watch
              a slideshow about AI — you will build something on your own
              account that answers a real buyer at eleven at night, and you
              will take it home working.
            </p>
          </header>
        }
        details={
          <div className="invite-details">
            <dl className="stamp">
              <div>
                <dt>When</dt>
                <dd>
                  <b>Friday, October 2</b>
                  <span className="stamp-num">12:00pm ET</span>
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
                  <b>A laptop and your phone. Both.</b>
                  <span>Claude on the laptop — the free tier is fine.</span>
                </dd>
              </div>
            </dl>
            <Seats />
          </div>
        }
      />

      {/* ---- 1. Proof, before any claim. Real numbers, zero input. ---- */}
      <MarketPanel />

      {/* ---- 2. The hour itself, in three lines. ---- */}
      <section className="hour">
        <h2 className="display">The hour, start to finish.</h2>
        <ol className="hour-list">
          <li>
            <span>First fifteen</span>
            <p>
              You watch one listing answer its own phone — and refuse to invent
              an answer when somebody asks it something nobody told it. That
              refusal is the whole reason this is safe in front of a client.
            </p>
          </li>
          <li>
            <span>Next thirty</span>
            <p>
              You build yours. Your listing, your Claude account, your number
              on it. Everybody leaves with a working page and a QR code that
              goes on a real sign.
            </p>
          </li>
          <li>
            <span>Last fifteen</span>
            <p>
              We switch the MLS connection on and ask it about your farm, live,
              on the screen. Almost nobody in this market has turned that on.
            </p>
          </li>
        </ol>
        <p className="hour-after">
          Then nobody gets rushed out. People put what they built on the screen
          and we stay in the office. That part is usually the best part.
        </p>
      </section>

      {/* ---- 3. Who else is in the room. ---- */}
      <Room />

      {/* ---- 4. Who is running it. ---- */}
      <section className="invite-who">
        <h2 className="display">The job title is new. The twenty years are not.</h2>
        <Profile />
        <p>
          Inspector first, then agent, then multifamily investor, and now the
          person who builds these systems for the agents around him. Nothing in
          this hour came out of a course — it came out of running the business
          in this market, on these contracts.
        </p>
      </section>

      {/* ---- 5. The one action. ---- */}
      <Book />

      <Closer />

      <footer className="invite-foot">
        <p>
          Curious what the assistant is? <Link href="/val">Meet Val</Link>.
          Want the prompts without coming? They are yours the moment you take a
          seat — no email required, nothing kept.
        </p>
        <p className="invite-sponsor">
          Hosted by {HOST.org}. Built and sponsored by Surfstung Systems.
        </p>
        <p className="invite-pillars">
          Smarter tools. Stronger agents. Bigger opportunities. Real impact.
        </p>
      </footer>
    </main>
  );
}
