"use client";

// THE TROPHY, on the attendee's phone. Three taps and ninety seconds: who you
// are, what the house is, how you sound — then Deploy. What comes back is not
// a prompt. It is a live page, a QR built to screenshot, and (the part that
// makes it real) a lead inbox that fills with strangers.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Assistant, AssistantLead } from "@/lib/types";

const DEMO_FACTS = `Address: 214 Demo Oak Ln, Johns Island
Asking price: $612,000
Bedrooms: 4 · Bathrooms: 2.5 · Square feet: 2,240
Built: 2016 · HOA: $95/mo
Showings: Sat–Sun 11–4 by appointment`;

const VOICES: { id: Assistant["voice"]; label: string; blurb: string }[] = [
  { id: "warm", label: "Warm", blurb: "a sharp friend who knows the house" },
  { id: "luxury", label: "Polished", blurb: "unhurried, precise, never pushy" },
  { id: "energy", label: "High energy", blurb: "verbs first, momentum, no overselling" },
];

export function BuildScreen({ onBuilt }: { onBuilt: () => void }) {
  const [mine, setMine] = useState<Assistant | null>(null);
  const [leads, setLeads] = useState<AssistantLead[]>([]);
  const [loading, setLoading] = useState(true);

  const [agentName, setAgentName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [cell, setCell] = useState("");
  const [headline, setHeadline] = useState("");
  const [facts, setFacts] = useState("");
  const [voice, setVoice] = useState<Assistant["voice"]>("warm");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/assistant", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        setMine(data.assistant ?? null);
        setLeads(data.leads ?? []);
      }
    } catch {
      // the next poll catches up
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Once it's live, keep watching for the first stranger to land.
  useEffect(() => {
    if (!mine) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 4000);
    return () => clearInterval(id);
  }, [mine, load]);

  async function deploy() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName, brokerage, cell, headline, facts, voice }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        try {
          navigator.vibrate?.([40, 60, 40, 60, 140]);
        } catch {
          /* not every phone hums */
        }
        await load();
        onBuilt();
      } else {
        setErr(
          data?.error === "need_facts"
            ? "Paste a real fact sheet — a few lines at least. An assistant with nothing to stand on would have to guess, and that's the one thing yours will never do."
            : data?.error === "need_name"
              ? "Your name goes on this thing — put it in."
              : "Hiccup. Tap deploy again."
        );
      }
    } catch {
      setErr("No connection — try that again.");
    }
    setBusy(false);
  }

  if (loading) {
    return <p className="mt-10 text-center text-sm text-soft">Loading your workshop…</p>;
  }

  // ---- it's live: the trophy screen -----------------------------------
  if (mine) {
    const url = `${window.location.origin}/a/${mine.code}`;
    return (
      <section className="mt-6 flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">It&apos;s live. That&apos;s yours.</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-cream">
          {mine.headline || "Your listing assistant"}
        </h1>

        <div className="result-card pop-in mt-5 rounded-3xl bg-sheet-2 p-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
            {mine.brokerage || mine.agentName}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?a=${mine.code}`}
            alt="QR code for your assistant"
            className="mx-auto mt-3 w-52 rounded-2xl"
          />
          <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.2em] text-gold-bright">
            {mine.code}
          </p>
          <p className="mt-1 break-all text-[11px] text-faint">{url}</p>
          <p className="mt-3 text-[11px] font-semibold text-cream">
            Screenshot this. Print it on a rider. It answers at 11pm.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="rounded-2xl border border-rule bg-sheet-2 px-4 py-3 text-sm font-bold text-cream"
          >
            {copied ? "Copied ✓" : "Copy my link"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-gold px-4 py-3 text-center text-sm font-bold text-sheet"
          >
            Open it →
          </a>
        </div>

        <div className="mt-5 rounded-2xl border border-rule bg-sheet-2 p-4">
          <p className="text-sm font-semibold text-cream">
            Your inbox {leads.length > 0 && <span className="text-gold-bright">· {leads.length}</span>}
          </p>
          {leads.length === 0 ? (
            <p className="mt-1 text-xs text-soft">
              Empty for now. Hand your phone to the person next to you and have them scan it — watch a
              real lead land.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {leads.map((l, i) => (
                <li key={i} className="pop-in rounded-xl border border-gold/40 bg-sheet p-3">
                  <p className="text-sm font-semibold text-cream">
                    {l.name} <span className="text-soft">· {l.cell}</span>
                  </p>
                  {l.question && <p className="mt-0.5 text-xs italic text-soft">“{l.question}”</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  // ---- the build form --------------------------------------------------
  return (
    <section className="mt-6 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Ninety seconds</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-cream">
        Build your listing&apos;s assistant.
      </h1>
      <p className="mt-2 text-sm text-soft">
        You&apos;re not getting a prompt. You&apos;re getting a live page and a QR code with your name on
        it — courtesy of The Agent Connection.
      </p>

      <input
        value={agentName}
        onChange={(e) => setAgentName(e.target.value)}
        placeholder="Your name"
        aria-label="Your name"
        autoComplete="name"
        className="mt-5 w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          value={brokerage}
          onChange={(e) => setBrokerage(e.target.value)}
          placeholder="Brokerage"
          aria-label="Brokerage"
          className="w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <input
          value={cell}
          onChange={(e) => setCell(e.target.value)}
          placeholder="Your cell"
          aria-label="Your cell"
          inputMode="tel"
          autoComplete="tel"
          className="w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
      </div>
      <input
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        placeholder="The address (e.g. 42 Marsh Wren Ln)"
        aria-label="Listing address"
        className="mt-2 w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
      />

      <div className="mt-4 flex items-baseline justify-between">
        <label htmlFor="facts" className="text-sm font-semibold text-cream">
          The fact sheet
        </label>
        <button onClick={() => setFacts(DEMO_FACTS)} className="text-xs font-bold text-gold underline-offset-2">
          use the demo listing
        </button>
      </div>
      <textarea
        id="facts"
        value={facts}
        onChange={(e) => setFacts(e.target.value)}
        rows={7}
        placeholder={"Paste your listing's facts — one per line.\nBeds, baths, sqft, year, HOA, showing times…"}
        className="mt-2 w-full resize-none rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-[15px] leading-relaxed text-cream placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-faint">
        This is the whole game: your assistant will speak these lines exactly and refuse everything else.
      </p>

      <p className="mt-4 text-sm font-semibold text-cream">How does it sound?</p>
      <div className="mt-2 flex flex-col gap-2">
        {VOICES.map((v) => (
          <button
            key={v.id}
            onClick={() => setVoice(v.id)}
            className={`rounded-xl border px-4 py-3 text-left ${
              voice === v.id ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2/60"
            }`}
          >
            <span className={`text-sm font-bold ${voice === v.id ? "text-gold-bright" : "text-cream"}`}>{v.label}</span>
            <span className="ml-2 text-xs text-soft">{v.blurb}</span>
          </button>
        ))}
      </div>

      {err && <p className="mt-3 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{err}</p>}

      <button
        onClick={() => void deploy()}
        disabled={busy || agentName.trim().length < 2 || facts.trim().length < 40}
        className="mt-5 rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet disabled:opacity-40"
      >
        {busy ? "Deploying…" : "🚀 Deploy my assistant"}
      </button>
      <p className="mt-2 text-center text-[11px] text-faint">+25 on THE BOARD the second it goes live.</p>
    </section>
  );
}
