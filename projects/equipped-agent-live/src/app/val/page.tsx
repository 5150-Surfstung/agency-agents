import type { Metadata } from "next";
import { ValParticles } from "@/app/stage/val-particles";
import { HOST } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Val — the library every build comes out of",
  description:
    "Val is Surfstung's pattern library: the operating rules and proven builds behind the systems The AGENT Connection runs on. What it is, why it exists, and what's already on the shelf for real estate.",
};

/** The shelves, described by what they do for an AGENT rather than by what
 *  they do for a build. Every one of these is a pattern that already shipped —
 *  that is the entire bar for getting into the library. */
const SHELVES: { name: string; pull: string; agent: string }[] = [
  {
    name: "AI front desk",
    pull: "Missed calls, after-hours phone, intake and lead qualification.",
    agent:
      "The receptionist that answers when you can't — qualifies the caller, offers real showing windows, and hands you a warm lead instead of a voicemail. This is the one you built in the room.",
  },
  {
    name: "Speed to lead / QR",
    pull: "Yard signs, riders, table tents, stickers, per-listing pages, 'scan to…'.",
    agent:
      "Owning the first sixty seconds at the physical edge. The rider becomes a front door: a scan lands on a page that already knows the house and already knows what to ask.",
  },
  {
    name: "Curated corpus",
    pull: "Building a knowledge base, a prompt system, or a grounded assistant.",
    agent:
      "How you feed a system your market so it stops guessing — the fact sheet discipline, the source-of-truth rules, and the refusal behavior that keeps a made-up comp off your listing.",
  },
  {
    name: "Staged workflow",
    pull: "Sequential stages, human review gates, a process that reruns.",
    agent:
      "A transaction is a pipeline with deadlines and handoffs. This is the shape behind Track to Keys — what runs automatically, and exactly where a human has to sign off.",
  },
  {
    name: "Live room",
    pull: "Audience phones in a presentation, polls, second screen, class scoring.",
    agent:
      "Your own listing presentation, open house, or lunch-and-learn with the room's phones in it. This hour is running on this shelf right now.",
  },
  {
    name: "In-home / iPad consult",
    pull: "A tablet in front of a customer, guided consult, rep-facing flow.",
    agent:
      "The listing appointment itself: what goes on the screen, in what order, and what you never make a seller read upside down.",
  },
  {
    name: "Model routing",
    pull: "The same operation run N times — per listing, per row — and 'this is expensive'.",
    agent:
      "Running something across 400 listings without a surprise bill. Which work needs the expensive model and which does not.",
  },
  {
    name: "Bookings",
    pull: "Tours, rentals, day passes, deposits online.",
    agent:
      "Short-term rentals and investment property: taking a booking and a deposit without a human in the loop.",
  },
  {
    name: "Deal shape",
    pull: "Pricing, packaging, scoping, retainers.",
    agent:
      "For the ones who start selling this: what to charge, what to include, and what never to include.",
  },
];

/** Lines from the doctrine that a REALTOR feels immediately. Quoted because
 *  they are the actual rules, not a marketing paraphrase of them. */
const DOCTRINE = [
  "Smallest thing that proves it. Ship that. Widen only on evidence.",
  "Remove the step, don't polish it: a tap beats a field, two taps beat five.",
  "Verify before you fix. An unverified finding is a rumor.",
  "Never claim a number you can't defend on the client's own data.",
  "Own the edge — the physical object, the first scan, the first sixty seconds.",
  "The client owns the asset. Recurring revenue comes from the thing that keeps working, not from lock-in.",
];

export default function ValPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="relative overflow-hidden rounded-3xl border border-rule bg-sheet-2 p-7 sm:p-10">
        <ValParticles className="pointer-events-none absolute -right-16 top-1/2 hidden h-[26rem] w-[26rem] -translate-y-1/2 opacity-80 sm:block" />
        <div className="relative max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Surfstung Systems · The AGENT Connection™
          </p>
          <h1 className="mt-2 display text-5xl font-extrabold text-cream sm:text-7xl">
            Val
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-soft">
            Val is the library every one of our builds comes out of. Not an app you log into —
            the accumulated <span className="text-cream">operating rules</span> and{" "}
            <span className="text-cream">proven patterns</span> that a system gets built from,
            so nobody has to rediscover what already works.
          </p>
          <p className="mt-3 text-[17px] leading-relaxed text-soft">
            It goes in as a scar. It comes back out as a default.
          </p>
        </div>
      </header>

      <Section title="Why it exists">
        <p className="text-[17px] leading-relaxed text-soft">
          Anyone can buy the same AI you can. What nobody can buy is the notes from every time one
          of these systems broke in front of a real client — the poll that sat waiting on a button
          nobody knew about, the function that worked locally and failed in production, the
          assistant that sounded great until somebody asked it a question the fact sheet
          didn&apos;t cover.
        </p>
        <p className="mt-3 text-[17px] leading-relaxed text-soft">
          Every one of those became a rule. The rules are why the next build doesn&apos;t make the
          same mistake — and why your build starts somewhere better than a blank page.
        </p>
        <div className="mt-5 rounded-2xl border border-gold/50 bg-sheet-2 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gold">The bar to get in</p>
          <p className="mt-2 text-[15px] leading-relaxed text-soft">
            A pattern earns a place only if it is <span className="text-cream">reusable</span>,{" "}
            <span className="text-cream">non-obvious</span>,{" "}
            <span className="text-cream">load-bearing</span>, and{" "}
            <span className="text-cream">still true</span> six months from now. The default answer
            to a new entry is <span className="font-bold text-gold-bright">no</span>. That is the
            whole reason the library is worth reading — it stayed small on purpose.
          </p>
        </div>
      </Section>

      <Section title="The rules that are always on">
        <ul className="grid gap-3 md:grid-cols-2">
          {DOCTRINE.map((d) => (
            <li key={d} className="rounded-2xl border border-rule bg-sheet-2 p-4 text-[15px] leading-relaxed text-soft">
              <span className="mr-2 text-gold">—</span>
              {d}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-faint">
          You heard the fourth one all hour. It isn&apos;t a slogan we wrote for the class; it&apos;s
          line six of the doctrine, and it&apos;s why the assistant you built would rather tell a
          stranger &ldquo;that&apos;s not on the sheet&rdquo; than invent an answer that costs you a
          client.
        </p>
      </Section>

      <Section title="What's already on the shelf for real estate">
        <p className="text-[17px] leading-relaxed text-soft">
          These aren&apos;t ideas. Each one is a pattern that has already shipped and been confirmed
          in production — which is the only way anything gets in here.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {SHELVES.map((sh) => (
            <article key={sh.name} className="rounded-3xl border border-rule bg-sheet-2 p-5">
              <h3 className="display text-xl font-extrabold text-cream">
                {sh.name}
              </h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                pulled when: {sh.pull}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-soft">{sh.agent}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="What you get at The AGENT Connection">
        <ul className="space-y-3">
          {[
            ["The Val chatbot", "Every agent here gets it — the same library, answering your questions instead of you reading it."],
            ["Your agent site, run on Val", "The skills and automations get pulled off the shelf rather than rebuilt from scratch for you."],
            ["An on-site Director", `${HOST.full} is in ${HOST.city}. We sit down with your listings, your farm, your live transaction — and build the thing.`],
            ["The rules, not just the tools", "You learn why each system is shaped the way it is, so you can extend it after we leave the table."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-rule bg-sheet-2 p-4">
              <p className="display text-lg font-extrabold text-cream">{t}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-soft">{d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-2xl border border-rule bg-sheet-2 p-4 text-sm leading-relaxed text-faint">
          Val isn&apos;t for sale and it isn&apos;t a subscription. It came out of our own builds,
          which is exactly why it isn&apos;t available anywhere else — and why the honest version of
          this pitch is: you can build all of it yourself, you just can&apos;t skip the part where it
          breaks first.
        </p>
      </Section>

      <footer className="mt-14 border-t border-rule pt-6">
        <p className="display text-2xl font-extrabold text-cream">{HOST.full}</p>
        <p className="mt-1 text-[15px] text-soft">
          {HOST.title} · {HOST.org}
          <br />
          REALTOR® · {HOST.brokerage} · {HOST.city}, {HOST.state}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/vcard" className="rounded-full border border-gold/60 px-4 py-2 text-xs font-bold text-gold">
            ⬇ Save my contact
          </a>
          <a href={`tel:${HOST.cellE164}`} className="rounded-full border border-rule px-4 py-2 text-xs font-bold text-soft">
            {HOST.cell}
          </a>
          <a href={`mailto:${HOST.email}`} className="rounded-full border border-rule px-4 py-2 text-xs font-bold text-soft">
            {HOST.email}
          </a>
          <a href="/kit" className="rounded-full border border-rule px-4 py-2 text-xs font-bold text-soft">
            The kit →
          </a>
        </div>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="display text-3xl font-extrabold text-cream sm:text-4xl">
        {title}
      </h2>
      <span className="mt-2 block h-[3px] w-24 rounded-full bg-gold" />
      <div className="mt-5">{children}</div>
    </section>
  );
}
