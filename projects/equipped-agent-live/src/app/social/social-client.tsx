"use client";

// THE CONTENT MACHINE, live in the room.
//
// The demo beat this is built for: the room picks the platform and the angle
// out loud, somebody shouts an angle nobody prepared for, and content that is
// actually good comes out in eight seconds — grounded in a fact sheet they
// watched get pasted in, with a NEEDS FROM YOU section proving it didn't
// invent the parts it wasn't given.
//
// The rhythm below the generator is deterministic on purpose. A posting
// cadence is not a thing worth spending a model call on, and putting it on
// screen makes the point that most of "social media strategy" is just a
// schedule somebody actually kept.

import { useState } from "react";
import { STUMP_FACTS } from "@/lib/deck";
import { ANGLES, PLATFORMS, type Angle, type Platform } from "@/lib/prompts";

const RHYTHM: { day: string; post: string; why: string }[] = [
  { day: "Mon", post: "Neighborhood story", why: "You're the local, not the listing. Earn the follow before you need it." },
  { day: "Tue", post: "Just listed / active", why: "The one post that's actually about inventory. One per week is plenty." },
  { day: "Wed", post: "Buyer or seller education", why: "Answer the question you got asked twice last week." },
  { day: "Thu", post: "Behind the scenes", why: "An inspection, a walk-through, a Tuesday. People follow people." },
  { day: "Fri", post: "Open house / weekend", why: "Post it Friday morning. Sunday morning is too late to matter." },
  { day: "Sat", post: "Story only — no feed post", why: "Be present without producing. Rest is part of a cadence." },
  { day: "Sun", post: "Just sold / result", why: "Proof, with the client's blessing. Never a price with no context." },
];

export function SocialClient() {
  const [facts, setFacts] = useState("");
  const [agentName, setAgentName] = useState("");
  const [market, setMarket] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [angle, setAngle] = useState<Angle>("Just listed");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function run() {
    if (facts.trim().length < 40 || busy) return;
    setBusy(true);
    setErr("");
    setOut("");
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts, platform, angle, agentName, market }),
      });
      const d = await res.json();
      if (d?.ok) setOut(d.content);
      else
        setErr(
          d?.error === "join_first"
            ? "Join the room from your phone first — this one runs on the room's engine during class."
            : d?.error === "offline"
              ? "The engine is offline right now. The full prompt is on the kit page — run it in your own Claude."
              : d?.error === "need_facts"
                ? "Paste a real fact sheet first. With nothing to stand on it would just invent a house."
                : "That didn't go through. Try once more."
        );
    } catch {
      setErr("No connection — try again in a moment.");
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8 sm:px-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          The Equipped Agent · live tool
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold text-cream sm:text-5xl">
          The Content Machine
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-soft">
          One listing in. Pick a platform and an angle. Out comes a post that leads with a hook
          instead of &ldquo;check out this stunning home,&rdquo; stays inside your facts, and stays
          fair-housing clean — because that part is not optional.
        </p>
      </header>

      <section className="mt-6 rounded-3xl border border-rule bg-sheet-2 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-faint">Your name</span>
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value.slice(0, 60))}
              placeholder="Mike Olson"
              className="mt-1 w-full rounded-xl border border-rule bg-sheet px-3 py-2.5 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-faint">Market</span>
            <input
              value={market}
              onChange={(e) => setMarket(e.target.value.slice(0, 80))}
              placeholder="Johns Island, Charleston SC"
              className="mt-1 w-full rounded-xl border border-rule bg-sheet px-3 py-2.5 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-faint">
            The listing facts — paste the real thing
          </span>
          <textarea
            value={facts}
            onChange={(e) => setFacts(e.target.value.slice(0, 4000))}
            rows={7}
            placeholder="Paste the MLS sheet, your notes, the disclosure — raw is fine."
            className="mt-1 w-full resize-y rounded-xl border border-rule bg-sheet px-3 py-2.5 text-[14px] leading-relaxed text-cream placeholder:text-faint focus:border-gold focus:outline-none"
          />
        </label>
        <button
          onClick={() => setFacts(STUMP_FACTS)}
          className="mt-1.5 text-xs font-bold text-gold underline-offset-2 hover:underline"
        >
          load the demo listing
        </button>

        <Picker label="Platform" value={platform} options={PLATFORMS} onPick={(v) => setPlatform(v as Platform)} />
        <Picker label="Angle" value={angle} options={ANGLES} onPick={(v) => setAngle(v as Angle)} />

        <button
          onClick={() => void run()}
          disabled={busy || facts.trim().length < 40}
          className="mt-5 w-full rounded-2xl bg-gold px-4 py-3.5 text-base font-bold text-sheet disabled:opacity-40"
        >
          {busy ? "writing…" : `Write the ${angle} ${platform} post`}
        </button>
        {facts.trim().length < 40 && (
          <p className="mt-1.5 text-center text-[11px] text-faint">
            Paste a fact sheet to light this up — it won&apos;t write about a house it can&apos;t see.
          </p>
        )}
      </section>

      {err && (
        <p className="mt-4 rounded-2xl border border-clay/50 bg-sheet-2 p-4 text-sm text-clay">{err}</p>
      )}

      {out && (
        <section className="pop-in mt-5 rounded-3xl border border-gold/50 bg-sheet-2 p-5">
          <div className="flex items-baseline gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
              {angle} · {platform}
            </p>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(out);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setCopied(false);
                }
              }}
              className="ml-auto rounded-full border border-rule px-3 py-1.5 text-[11px] font-bold text-soft hover:border-gold hover:text-gold"
            >
              {copied ? "copied ✓" : "Copy"}
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-cream">{out}</pre>
          <p className="mt-4 border-t border-rule pt-3 text-[11px] text-faint">
            Read the NEEDS FROM YOU section before you post. That list is the machine telling you
            exactly where it refused to make something up.
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-cream">
          The week, if you want the boring truth
        </h2>
        <p className="mt-1 text-sm text-soft">
          Most &ldquo;social media strategy&rdquo; is a schedule somebody actually kept. One listing
          post a week. Everything else is you.
        </p>
        <ul className="mt-4 space-y-2">
          {RHYTHM.map((r) => (
            <li key={r.day} className="flex gap-4 rounded-2xl border border-rule bg-sheet-2 p-4">
              <span className="w-12 shrink-0 text-sm font-bold uppercase tracking-wider text-gold">{r.day}</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-cream">{r.post}</span>
                <span className="mt-0.5 block text-[14px] leading-relaxed text-soft">{r.why}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 rounded-2xl border border-rule bg-sheet-2 p-4 text-xs leading-relaxed text-faint">
        <span className="font-bold text-soft">Fair housing isn&apos;t a setting.</span> This tool is
        instructed never to describe who a home is right for — no &ldquo;perfect for families,&rdquo;
        no &ldquo;safe neighborhood,&rdquo; no schools as a selling point aimed at a type of buyer.
        You are still the one who hits post. Read it before you do.
      </p>
    </main>
  );
}

function Picker({
  label, value, options, onPick,
}: { label: string; value: string; options: readonly string[]; onPick: (v: string) => void }) {
  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold ${
              value === o ? "border-gold bg-gold text-sheet" : "border-rule bg-sheet text-soft hover:border-gold"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
