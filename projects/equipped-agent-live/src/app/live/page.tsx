import type { Metadata } from "next";
import Link from "next/link";
import { Top } from "./top";
import { Closer } from "./closer";
import { MarketPanel } from "./market-panel";
import { OrbGive } from "./orb-give";
import { Room } from "./room";
import { Seats } from "./seats";
import { Profile } from "./profile";
import { Book } from "./book";
import { HOST } from "@/lib/contact";
import { EVENT } from "@/lib/event";

// THE PAGE YOU PUT ON FACEBOOK.
//
// It is not a flyer. A flyer describes value; an agent scrolling past a flyer
// keeps scrolling. This page hands two working things over before it asks for
// anything: the after-hours desk, which drafts the reply to whatever a client
// just texted them, and the deadline chain, which counts a live file's dates
// in front of them for free. If neither of those is useful, the hour would not
// have been either, and they have lost nothing but a scroll.
//
// The share card stays deliberately short — four words and the orb. A long
// title and a paragraph of description is a wall of grey text above the image,
// which is exactly what makes a post look like an ad. The page does the
// selling; the card only has to stop the thumb.
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
      {/* Who is behind it, said once, at the top, the way a product says it. */}
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
            One hour, live, in our office in West Ashley. You will not watch a
            slideshow about AI. You will build something on your own account
            that answers a real buyer at eleven at night, and you will take it
            home working.
          </p>

          </header>
        }
        details={
          <div className="invite-details">
            <p className="byline">
            <b>{HOST.full}</b>
            <span>
              {HOST.title}, {HOST.org} · REALTOR<sup>®</sup> at {HOST.brokerage}
            </span>
            <em>
              First Friday of every month, this is the room where Charleston
              real estate finds out what these tools actually do — run by the
              person whose job that is.
            </em>
          </p>

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
                <span>
                  Claude installed on the laptop — the free tier is genuinely
                  fine. The phone is half the show.
                </span>
              </dd>
            </div>
            <div>
              <dt>Series</dt>
              <dd>
                <b>AI REvealed with {HOST.full}</b>
                <span>First Friday of the month</span>
              </dd>
            </div>
          </dl>
            <Seats />
          </div>
        }
      />

      {/* Proof before argument. */}
      <MarketPanel />

      {/* Ungated on purpose — see orb-give.tsx. */}
      <OrbGive />


      {/* ---- the one scarce thing. Everything else about AI is free. ---- */}
      <section className="invite-why">
        <h2 className="display">
          Everything you can learn about AI is free and everywhere. This is the
          part that isn&rsquo;t.
        </h2>
        <p>
          Your MLS, answering a question about your own farm, in plain English,
          on your own laptop. FlexMLS publishes a connector for exactly this
          and almost nobody in this market has switched it on. You will, in
          this hour — it is a settings screen and a key, not a project, and it
          keeps working after you leave.
        </p>

        {/* The questions are the product. An agent reading this list is
            already thinking of the one they would ask about their own farm,
            and every one of these maps to something the connector actually
            serves — days on market, inventory, absorption, price ratios,
            listing search, and their own listings. */}
        <ul className="asks">
          <li>What are days on market doing in West Ashley this quarter versus last?</li>
          <li>How much inventory is actually sitting in 29407 right now?</li>
          <li>What is the absorption rate in my farm — how many months of supply?</li>
          <li>List-to-sale price ratio in my neighborhood this year, by month.</li>
          <li>Every three-bedroom under $500k that came on this week in my ZIP.</li>
          <li>What did my own listings do last month?</li>
        </ul>
        <p className="asks-note">
          You type those. In English. It answers from the record, on the
          screen, in front of the room — and when it does not have something,
          it says so instead of guessing. Bring the question you have been
          meaning to ask about your own farm; that is the one we will run.
        </p>

        <ol className="runsheet">
          <li>
            <span className="runsheet-when">First fifteen</span>
            <p>
              You watch one listing answer its own phone — a QR on the rider, a
              page that replies in under a second, and a refusal when somebody
              asks it something nobody told it.{" "}
              <Link href="/a/HAUS24">The one from the last room is still up</Link>
              , so try to break it before you come.
            </p>
          </li>
          <li>
            <span className="runsheet-when">Next thirty</span>
            <p>
              You build yours. Your listing, your account, your phone number on
              it. Everybody in the room ends up with a working page and a QR
              code that goes on a real sign.
            </p>
          </li>
          <li>
            <span className="runsheet-when">Last fifteen</span>
            <p>
              We turn the MLS connection on and ask it about your farm, live,
              on the screen — then you leave with{" "}
              <Link href="/kit">the page of prompts</Link> that runs the rest of
              your week, and{" "}
              <Link href="/t2k">the tool that counts a contract&rsquo;s
              deadlines</Link> for you. Free, no email, complete as written.
            </p>
          </li>
          <li>
            <span className="runsheet-when">Afterwards</span>
            <p>
              Nobody gets rushed out. We stay in the office, people put what
              they just built on the screen and show it off, and the dumb
              questions get asked with no audience. That part is usually the
              best part.
            </p>
          </li>
        </ol>
      </section>

      {/* ---- who it is for. Named plainly, because an agent deciding in four
              seconds needs to find themselves on the list. ---- */}
      <section className="invite-for">
        <h2 className="display">Come if any of these is you.</h2>
        <ul className="who">
          <li>
            <b>You are licensed and slammed.</b> You do not need to be taught
            what AI is. You need the eleven-o'clock reply written, the deadlines
            counted, and the listing answering for itself while you are at a
            soccer game.
          </li>
          <li>
            <b>You just got licensed.</b> No database, no systems, nobody has
            shown you the back half of the job. You will leave this hour with a
            working assistant on a real listing — which is more than most agents
            three years in have.
          </li>
          <li>
            <b>You are in class, or still deciding.</b> Come anyway. Watch what
            the job looks like with the tools switched on, and start ahead of
            people who have been doing it a decade.
          </li>
        </ul>
        <p className="invite-bring">
          <b>Bring somebody.</b> One who is licensed, or one who is still making
          up their mind — both of them belong in that room, and between the
          people hosting the hour there is close to a century in this business
          to ask about.
        </p>
      </section>

      {/* ---- who is running it. Figures that can be defended, set as a
              spec sheet rather than three big gold numbers in a row. ---- */}
      <section className="invite-who">
        <h2 className="display">
          The job title is new. The twenty years behind it are not.
        </h2>
        <Profile />
        <p>
          {HOST.full} is {HOST.title} at {HOST.org} and a REALTOR<sup>®</sup> at{" "}
          {HOST.brokerage}. Inspector first, then agent, then multifamily
          investor, and now the person who builds these systems for the agents
          around him. Nothing in this hour came out of a course — it came out
          of running the business in this market, with these clients, on these
          contracts.
        </p>
        <table className="spec">
          <tbody>
            <tr>
              <th scope="row">Years in real estate, still selling</th>
              <td>20+</td>
            </tr>
            <tr>
              <th scope="row">Homes inspected, residential and commercial</th>
              <td>1,800+</td>
            </tr>
            <tr>
              <th scope="row">Multifamily units owned in part</th>
              <td>346</td>
            </tr>
          </tbody>
        </table>
        <p className="invite-aside">
          And selfishly — it would be good to see some old faces in the room.
        </p>
      </section>

      {/* ---- the only ask on the page, and it is placed last on purpose: a
              stranger who came for the tool has already been paid before
              anybody says the word brokerage. ---- */}
      <section className="invite-for">
        <h2 className="display">
          If where you are feels a step behind, sit in the back and watch.
        </h2>
        <ul className="who">
          <li>
            <b>A tech-driven team with old-school experience.</b> The tools are
            new. Picking up the phone, knowing the street, and remembering what
            somebody told you in March is not — and that part is still the job.
          </li>
          <li>
            <b>Serve clients the way it used to be done.</b> Same follow-up,
            same attention to the small thing they mentioned once, except now
            something remembers it for you and nudges you on the right day.
          </li>
          <li>
            <b>Nobody pitches you from the front of the room.</b> Come for the
            hour, take the build home, and use it whether you ever move an inch.
            The longer conversation only happens if you start it.
          </li>
        </ul>
        <p className="invite-bring">
          <b>And if you do want it:</b> we stay in the office afterwards. Ask
          what the team actually is, what eXp does differently, what the first
          ninety days look like. Coffee, no script, no closing.
        </p>
      </section>

      <Room />

      <Book />

      <Closer />

      <footer className="invite-foot">
        <p>
          Curious what the assistant actually is?{" "}
          <Link href="/val">Meet Val</Link>. Want the prompts without coming?{" "}
          <Link href="/kit">Take them</Link>. Neither one asks for an email,
          because a page that asks for an email to hand over a prompt was never
          giving you much.
        </p>
        <p className="invite-sponsor">
          Hosted by The AGENT Connection. Built and sponsored by Surfstung
          Systems.
        </p>
        <p className="invite-pillars">
          Smarter tools. Stronger agents. Bigger opportunities. Real impact.
        </p>
      </footer>
    </main>
  );
}
