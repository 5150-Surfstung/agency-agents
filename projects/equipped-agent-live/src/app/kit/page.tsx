import type { Metadata } from "next";
import { CARDS } from "@/lib/cards";
import { CardList } from "./card-list";

export const metadata: Metadata = {
  title: "The Equipped Agent — your kit",
  description:
    "Everything from the hour: install Claude, connect your MLS, the prompt cards, and the one-week plan. Free, no email required.",
};

/** The page the whole class points at. It has to work for somebody who walked
 *  in never having opened an AI app, and still be worth bookmarking for
 *  somebody who uses one daily — so every section is written twice. */
export default function Kit() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-10 sm:px-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          The AGENT Connection™ · Charleston, SC
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold text-cream sm:text-6xl">
          The Equipped Agent kit
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-soft">
          Everything from the hour, on one page. Free, no email, no form. Bookmark it — the
          only thing I want back is that you actually build one of these.
        </p>
        <nav className="mt-5 flex flex-wrap gap-2">
          {[
            ["#install", "1 · Get Claude"],
            ["#talk", "2 · How to talk to it"],
            ["#mls", "3 · Connect your MLS"],
            ["#connect", "4 · Connect everything"],
            ["#cards", "5 · The cards"],
            ["#tools", "6 · The tools"],
            ["#week", "7 · The week"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-rule px-4 py-2 text-xs font-bold text-soft hover:border-gold hover:text-gold"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* ---------------------------------------------------------- install */}
      <Section id="install" n="1" title="Get Claude">
        <TwoUp
          left={{
            tag: "Never used it",
            items: [
              "Open the App Store or Google Play and search Claude — it's the one by Anthropic.",
              "Sign in with the email address you actually check.",
              "Start on the free tier. Nothing in this kit requires a paid plan to try.",
              "Say hello to it. That's genuinely the whole first step.",
            ],
          }}
          right={{
            tag: "Already using it",
            items: [
              "Open claude.ai on a laptop too — the phone is for capture, the laptop is for work.",
              "Use Projects: one per farm, one per listing, one per live transaction.",
              "Start each real task in a fresh chat. Clean context beats a cluttered one.",
              "Paste your sources in. It's smart; it is not psychic about your market.",
            ],
          }}
        />
        <Note>
          Plans and pricing change, so I won't quote you a number I'd have to correct later —
          Anthropic publishes the current ones at{" "}
          <a className="text-gold underline-offset-2 hover:underline" href="https://claude.ai" target="_blank" rel="noreferrer">
            claude.ai
          </a>
          . Start free; you'll know within a week whether it's worth upgrading.
        </Note>
      </Section>

      {/* ------------------------------------------------------------- talk */}
      <Section id="talk" n="2" title="How to talk to it">
        <p className="text-[17px] leading-relaxed text-soft">
          Most agents get bad results because they ask like it&apos;s a search engine. Four things
          turn a question into a brief:
        </p>
        <ol className="mt-4 space-y-2">
          {[
            ["WHO it is", "“You're my listing coordinator.” Give it a job before you give it a task."],
            ["WHAT you want", "One job, said plainly. Not three jobs stapled together."],
            ["WHAT IT MUST USE", "Paste the real data in — the tax record, the MLS sheet, the feedback. Don't make it guess."],
            ["HOW LONG", "“Three sentences.” “A one-page brief.” Length is a real instruction."],
          ].map(([k, v]) => (
            <li key={k} className="rounded-2xl border border-rule bg-sheet-2 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gold">{k}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-soft">{v}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-2xl border border-gold/50 bg-sheet-2 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gold">Then add this sentence</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-cream">
            “Ask me anything you&apos;re missing before you start.”
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-soft">
            That one line is worth more than every prompt template on the internet. It turns a
            machine that guesses into one that interviews you.
          </p>
        </div>
        <Note>
          <span className="font-bold text-soft">The rule that never changes:</span> never let AI
          say a number you can&apos;t defend. If it gives you a figure, ask it which line of your
          source that came from. If it can&apos;t point at one, it doesn&apos;t go in front of a
          client. And nothing you produce with it ever describes people, schools, or
          neighborhoods in terms that touch a protected class — that is the law, and it does
          not bend for convenience.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- MLS */}
      <Section id="mls" n="3" title="Connect your MLS">
        <p className="text-[17px] leading-relaxed text-soft">
          This is the one most agents don&apos;t know exists. Flexmls publishes an{" "}
          <span className="font-semibold text-cream">MCP server</span> — a secure connector that
          lets the AI client of your choice query <em>your</em> MLS data, live, under your own
          login and permissions. Market statistics, listing search, open houses, photos, and
          your own listings.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-rule bg-sheet-2 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gold">In Flexmls</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-soft">
              <li>Menu → <span className="text-cream">Preferences</span> → <span className="text-cream">AI Settings</span></li>
              <li>Toggle the MCP server on</li>
              <li>Accept the Terms of Use</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-rule bg-sheet-2 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gold">In Claude</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-soft">
              <li>Settings → <span className="text-cream">Connectors</span> → add a custom connector</li>
              <li>
                Server URL:{" "}
                <code className="rounded bg-sheet px-1.5 py-0.5 text-[13px] text-gold-bright">
                  https://mcp.fbsdata.com/mcp
                </code>
              </li>
              <li>Sign in with your normal Flexmls username and password</li>
            </ol>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-rule bg-sheet-2 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gold">
            Ask it these six the minute you&apos;re in
          </p>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-soft">
            <li>“What&apos;s the median sold price in [my farm] each month for the last year?”</li>
            <li>“How does that compare to the median price of what&apos;s active right now?”</li>
            <li>“What&apos;s the sale-to-original-list ratio, and what does the gap tell me?”</li>
            <li>“How many months of supply are we at, and which way is it moving?”</li>
            <li>“Show me everything that expired in [area] in the last 30 days.”</li>
            <li>“What open houses are scheduled near [address] this weekend?”</li>
          </ul>
        </div>
        <Note>
          <span className="font-bold text-soft">Straight from Flexmls, and it&apos;s the same
          rule from section 2:</span> the MCP server delivers live MLS data accurately, but the
          AI client&apos;s interpretation and presentation of that data may contain errors.
          Verify anything client-facing — listing details, market statistics, anything that
          informs a transaction — against Flexmls directly.{" "}
          <a
            className="text-gold underline-offset-2 hover:underline"
            href="https://help.flexmls.com/en/ai-settings--enable-the-mcp-server.html"
            target="_blank"
            rel="noreferrer"
          >
            Flexmls setup docs
          </a>
          {" · "}
          <a
            className="text-gold underline-offset-2 hover:underline"
            href="https://help.flexmls.com/en/ai-settings--mcp-server-faqs.html"
            target="_blank"
            rel="noreferrer"
          >
            FAQs
          </a>
          . No AI Settings in your menu? Your MLS either hasn&apos;t enabled it or enables it per
          member — call them, it&apos;s a five-minute ask.
        </Note>
      </Section>

      {/* ---------------------------------------------------------- connect */}
      <Section id="connect" n="4" title="Connect everything">
        <p className="text-[17px] leading-relaxed text-soft">
          The MLS is the big one, but it isn&apos;t the only one. In Claude, open{" "}
          <span className="text-cream">Settings → Connectors</span> — the same place you added the
          MLS. What&apos;s available there depends on your plan, so go look at what&apos;s on your
          account rather than taking my word for it.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            [
              "Gmail",
              "It reads the thread you're actually in — not a summary you typed out for it.",
              [
                "“Draft the reply to the Hendersons, matching how I've written to them.”",
                "“Summarize every email from this lender since we went under contract.”",
                "“Which of my threads from last week never got a response from me?”",
              ],
            ],
            [
              "Calendar",
              "“Thursday” stops being hypothetical and starts meaning your actual Thursday.",
              [
                "“Three 45-minute showing blocks this week that don't collide with anything.”",
                "“Block prep time the day before every listing appointment on my calendar.”",
                "“What does my week look like if the inspection lands Tuesday?”",
              ],
            ],
            [
              "Drive",
              "The fact sheets, disclosures and CMAs already sitting in your folders.",
              [
                "“Read the disclosure in this folder and list what a buyer will ask about.”",
                "“Turn this MLS sheet into the fact sheet format from card 3.”",
                "“Find every listing packet I made last year and tell me what they had in common.”",
              ],
            ],
          ].map(([name, blurb, asks]) => (
            <article key={name as string} className="rounded-3xl border border-rule bg-sheet-2 p-5">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-cream">
                {name as string}
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-soft">{blurb as string}</p>
              <ul className="mt-3 space-y-1.5">
                {(asks as string[]).map((a) => (
                  <li key={a} className="text-[13px] leading-snug text-faint">
                    {a}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <Note>
          <span className="font-bold text-soft">Now it can see your clients&apos; actual
          information — so the rules get stricter, not looser.</span> Treat it like your CRM, not
          like a search box. It <em>drafts</em>; you read it and you send it — every time, with no
          exceptions for the ones you&apos;re sure about. Don&apos;t paste social security numbers,
          bank details, or full account numbers into a chat, connected or not. And anything it
          summarizes from a document still gets checked against the document before it reaches a
          client — a confident summary of a disclosure is still a summary.
        </Note>
      </Section>

      {/* ------------------------------------------------------------ cards */}
      <Section id="cards" n="5" title="The cards">
        <p className="text-[17px] leading-relaxed text-soft">
          Nine complete prompts. Screenshot one and paste the picture straight into Claude — it
          reads the image and runs. Anything in <span className="text-cream">[BRACKETS]</span> is
          the part only you have.
        </p>
        <CardList cards={CARDS} />
      </Section>

      {/* ------------------------------------------------------------ tools */}
      <Section id="tools" n="6" title="The tools">
        <div className="grid gap-4 md:grid-cols-2">
          <Tool
            href="/t2k"
            title="Track to Keys"
            body="Two dates and your contract terms in; every deadline out, with what each one costs if it slips — plus a plain-English version you can text your client. The deal rides in the link, so sending it IS sending the deal."
          />
          <Tool
            href="/social"
            title="The Content Machine"
            body="One listing, a platform, an angle — out comes a post that leads with a hook instead of an adjective, stays inside your facts, and stays fair-housing clean. The full prompt is card 'The post that doesn't sound like a post' above, so it works in your own Claude forever."
          />
          <Tool
            href="/val"
            title="Meet Val"
            body="The library every one of these came out of: what it is, the rules that are always on, and the nine patterns already built for real estate."
          />
          <Tool
            href="/room"
            title="Your listing assistant"
            body="The assistant you built in the room, its QR, its lead inbox, and the switchboard — where you watch real conversations happen on your listing and step in when it's worth your voice."
          />
        </div>
      </Section>

      {/* ------------------------------------------------------------- week */}
      <Section id="week" n="7" title="The week">
        <ol className="space-y-2">
          {[
            ["Monday", "Pick the farm. One neighborhood. Not a city, not a zip — a neighborhood you could drive blindfolded."],
            ["Tuesday", "Connect your MLS (section 3) and ask it the six questions. Write down what surprised you."],
            ["Wednesday", "Build the fact sheet for one listing using the card in section 4."],
            ["Thursday", "Deploy that listing's assistant. Put the QR on a rider. It answers at 11pm."],
            ["Friday", "Ten rounds with the objection card before your next appointment. Ten. Not two."],
          ].map(([d, t]) => (
            <li key={d} className="flex gap-4 rounded-2xl border border-rule bg-sheet-2 p-4">
              <span className="w-24 shrink-0 text-sm font-bold uppercase tracking-wider text-gold">{d}</span>
              <span className="text-[15px] leading-relaxed text-soft">{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      <footer className="mt-14 border-t border-rule pt-6">
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-cream">
          Mike Olson
        </p>
        <p className="mt-1 text-[15px] text-soft">
          Director of AI Strategy &amp; Innovation · The AGENT Connection™
          <br />
          REALTOR® · eXp Realty · Charleston, SC
        </p>
        <p className="mt-3 text-sm leading-relaxed text-faint">
          Everything on this page you can build yourself, and some of you will. If you&apos;d
          rather build it with people who&apos;ve already done it — that&apos;s what The AGENT
          Connection is, and I&apos;m the one who sits down with you and does it.
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Smarter tools · Stronger agents · Bigger opportunities · Real impact
        </p>
      </footer>
    </main>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-gold">{n}</span>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-cream sm:text-4xl">
          {title}
        </h2>
      </div>
      <span className="mt-2 block h-[3px] w-24 rounded-full bg-gold" />
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TwoUp({
  left, right,
}: { left: { tag: string; items: string[] }; right: { tag: string; items: string[] } }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[left, right].map((lane) => (
        <div key={lane.tag} className="rounded-2xl border border-rule bg-sheet-2 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gold">{lane.tag}</p>
          <ul className="mt-2 space-y-2">
            {lane.items.map((i) => (
              <li key={i} className="text-[15px] leading-relaxed text-soft">{i}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-2xl border border-rule bg-sheet-2 p-4 text-sm leading-relaxed text-faint">
      {children}
    </p>
  );
}

function Tool({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <a href={href} className="block rounded-3xl border border-gold/40 bg-sheet-2 p-5 hover:border-gold">
      <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-cream">{title} →</p>
      <p className="mt-2 text-[15px] leading-relaxed text-soft">{body}</p>
    </a>
  );
}
