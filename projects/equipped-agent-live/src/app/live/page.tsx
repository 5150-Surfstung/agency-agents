import type { Metadata } from "next";
import Link from "next/link";
import { Top } from "./top";
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
            <p className="invite-kicker">Charleston&rsquo;s Claude community for tech-forward agents.</p>
            <p className="invite-lede">
              <b>If you are not keeping up with AI, you are falling behind.</b>{" "}
              One hour in our West Ashley office. You build something on your
              own Claude account that answers a real buyer at eleven at night,
              and you take it home working.
            </p>
            <p className="invite-lede-fine">
              No pitch. No upsell. Nothing to buy.
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
                  <b>Install Claude on your phone and your laptop before you come.</b>
                  <span>Bring both devices. Free tier is fine. Plus your best ideas and anything you have already built — half finished counts.</span>
                </dd>
              </div>
            </dl>
            <Seats />
          </div>
        }
      />

      {/* ---- 1. The hour itself, in three lines. ---- */}
      <section className="hour">
        <h2 className="display">The hour, start to finish.</h2>
        <ol className="hour-list">
          <li>
            <span>First fifteen</span>
            <p>
              Claude on the work you already do — the follow-up you forgot, the
              listing description, the dates on a live contract. Then a listing
              answers its own phone, and refuses to invent an answer nobody
              gave it. That refusal is why this is safe in front of a client.
            </p>
          </li>
          <li>
            <span>Next thirty</span>
            <p>
              You build your own agent. Your listing, your Claude account, your
              number on it. Everybody leaves with a working page and a QR code
              that goes on a real sign.
            </p>
          </li>
          <li>
            <span>Last fifteen</span>
            <p>
              MCP — how Claude plugs into the tools you already pay for. A
              flexmls seat connected live on the screen, asked about a farm
              area in plain English. Almost nobody here has done it.
            </p>
          </li>
        </ol>
        <p className="hour-after">
          You leave knowing three things: Claude on your everyday work, how to
          build an agent that runs without you, and how MCP hooks it to your
          own tools — flexmls included, on your own login.
        </p>

        {/* The objection that keeps the most people home, answered on the
            page rather than in the room they did not come to — and answered
            SHORT. This block used to run four long paragraphs and cost more
            seats than it saved. Somebody deciding in a feed reads two. */}
        <div className="hour-calm">
          <p className="hour-calm-h display">Watching everyone else pull ahead?</p>
          <p>
            Most agents are not behind because they are not working hard
            enough. They are behind because nobody handed them the tools. If
            where you hang your licence gives you a login and a Zoom link and
            calls that support, come see what the other side looks like and
            decide for yourself. Nobody will ask you anything.
          </p>
          <p>
            And you do not need to be technical. All of it happens in a chat
            box. What it hands back is writing, not a program — nothing to
            install, nothing to run.
          </p>
          <p className="hour-bring">
            <b>There is no homework — but do this one thing: have Claude
            installed on your phone and your laptop before you come.</b> Then
            turn up, and we do the whole thing together in the hour.
          </p>
        </div>

        {/* The part people actually come back for. */}
        <div className="hour-stay">
          <p className="hour-calm-h display">Then stay and show off.</p>
          <p>
            Bring your best ideas and anything you have already built — half
            finished counts, broken counts. Afterwards we sit down, put builds
            on the screen, see what everyone else is running, and work out
            where I can help. That part is usually the best part of the whole
            thing.
          </p>
        </div>
      </section>

      {/* ---- 2. Who else is in the room. ---- */}
      <Room />

      {/* ---- 3. Who is running it. ---- */}
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

      {/* ---- 4. The one action. ---- */}
      <Book />

      <Closer />

      <footer className="invite-foot">
        <p>
          Curious what the assistant is? <Link href="/val">Meet Val</Link>. The
          prompts are yours the moment you take a seat.
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
