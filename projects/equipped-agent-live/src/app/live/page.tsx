import type { Metadata } from "next";
import Link from "next/link";
import { HeroOrb } from "./hero-orb";
import { Rsvp } from "./rsvp";
import { HOST } from "@/lib/contact";
import { EVENT, eventLine } from "@/lib/event";

// THE PAGE YOU PUT ON FACEBOOK.
//
// The share card does one job: stop the scroll. So the metadata is
// deliberately SHORT — a long title and a paragraph of description is a wall
// of grey text above the image, which is exactly what makes a post look like
// an ad. Four words and the orb. The page behind it does the selling.
export const metadata: Metadata = {
  title: "The Equipped Agent",
  description: "Friday, October 2 · noon ET",
  robots: { index: true },
  openGraph: {
    title: "The Equipped Agent",
    description: "Friday, October 2 · noon ET",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Equipped Agent" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Equipped Agent",
    description: "Friday, October 2 · noon ET",
    images: ["/og.png"],
  },
};

export default function LivePage() {
  return (
    <main className="stage relative mx-auto w-full max-w-5xl px-6 pb-20">
      <HeroOrb />

      {/* The fold. Everything above it is the orb; everything here is the door. */}
      <section className="relative z-10 -mt-[4vh]">
        <p className="label text-[11px] tracking-[0.24em] text-gold">
          {EVENT.series}
        </p>
        <h1 className="mt-3 display text-5xl font-extrabold leading-[0.92] text-cream sm:text-7xl">
          The Equipped
          <br />
          Agent
        </h1>
        <span className="mt-4 block h-[3px] w-28 rounded-full bg-gold" />

        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-cream sm:text-2xl">
          One hour, live. You will not watch a slideshow about AI — you will build
          something on your own account that answers a real buyer at eleven at night,
          and you will take it home working.
        </p>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-soft">
          This is a Claude-based program. Bring a laptop with Claude on it and your
          cellphone, and you will leave with more than notes.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="display text-2xl font-extrabold text-gold-bright sm:text-3xl">
            {eventLine()}
          </p>
          <p className="text-[15px] text-soft">
            {EVENT.place || `The AGENT Connection · Charleston, SC — ${EVENT.online}`}
          </p>
        </div>
      </section>

      {/* ---- what they leave with. Concrete, or it is noise. ---- */}
      <section className="relative z-10 mt-14">
        <p className="label text-[11px] tracking-[0.22em] text-gold">What you walk out with</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            [
              "A listing that answers its own phone",
              "You build it in the room, on your own account. A QR on the rider, a page that replies in under a second, and it refuses to make anything up.",
            ],
            [
              "Your MLS, answering in English",
              "Almost nobody in this market has turned this on. Ask it what your farm did last month and watch it answer from the record, live, on the screen.",
            ],
            [
              "Every deadline in your next contract",
              "Two dates in, every date out — and a plain-English version you can text your client the same night.",
            ],
            [
              "A page you keep",
              "Fourteen prompts that are complete as written, free, no email required. Screenshot one into Claude and it runs.",
            ],
          ].map(([h, p]) => (
            <div key={h} className="rounded-3xl border border-rule bg-sheet-2 p-5">
              <h3 className="display text-xl font-extrabold leading-snug text-cream">{h}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-soft">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- who is running it. Numbers that can be defended, only. ---- */}
      <section className="relative z-10 mt-14">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
          {[
            ["20+", "years in real estate — top producer, still selling"],
            ["1,800+", "homes inspected, residential and commercial"],
            ["346", "multifamily units owned in part — hands on"],
          ].map(([n, l]) => (
            <div key={l} className="min-w-[8rem]">
              <p className="display text-4xl font-extrabold tabular-nums text-gold-bright sm:text-5xl [font-variation-settings:'wdth'_114]">
                {n}
              </p>
              <p className="mt-1 max-w-[22ch] text-[13px] leading-snug text-soft">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-soft">
          {HOST.full} — {HOST.title} at {HOST.org}, REALTOR® at {HOST.brokerage}. Inspector,
          then agent, then multifamily investor, then the person who builds these systems.
          Everything in this hour came out of running the business, not out of a course.
        </p>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-cream">
          And selfishly — it would be good to see some old faces in the room.
        </p>
      </section>

      <section className="relative z-10 mt-14">
        <Rsvp />
      </section>

      <section className="relative z-10 mt-10">
        <p className="text-[15px] leading-relaxed text-soft">
          Curious what the assistant actually is?{" "}
          <Link href="/val" className="font-bold text-gold underline-offset-4 hover:underline">
            Meet Val
          </Link>{" "}
          — or see{" "}
          <Link href="/kit" className="font-bold text-gold underline-offset-4 hover:underline">
            the page everybody leaves with
          </Link>
          . Both are free and neither asks for an email.
        </p>
        <p className="label mt-8 text-[10px] tracking-[0.2em] text-faint">
          Smarter tools · Stronger agents · Bigger opportunities · Real impact
        </p>
      </section>
    </main>
  );
}
