"use client";

// The seed moment, on the phone in the room: one big copy button, three
// steps, and they build their own assistant inside their own Claude account
// while the projector counts them in. The copy flips only on confirmed write.

import { useState } from "react";
import { SEED_PROMPT } from "@/lib/prompts";

export function SeedScreen() {
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(SEED_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowText(true); // honest fallback: select it by hand
    }
  }

  return (
    <section className="mt-6 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        Build your own — for keeps
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        Your assistant. Your Claude. Right now.
      </h1>

      <button
        onClick={() => void copy()}
        className="mt-6 rounded-2xl bg-gold px-5 py-5 text-xl font-bold text-sheet active:scale-[0.99]"
      >
        {copied ? "Copied ✓ — now open Claude" : "① Copy the seed"}
      </button>

      <ol className="mt-5 flex flex-col gap-3 text-[15px] text-soft">
        <li>
          <b className="text-cream">② Open the free Claude app</b> (or claude.ai) and paste it into a
          new chat.
        </li>
        <li>
          <b className="text-cream">③ Answer six questions.</b> It becomes YOUR assistant — your name,
          your market, your voice — then says: <em>take me for a sparring round.</em>
        </li>
      </ol>

      <p className="mt-4 text-xs text-faint">
        It's yours forever — free account works. Later: this same seed lives at{" "}
        <a href="/seed" target="_blank" rel="noreferrer" className="font-semibold text-gold-bright underline underline-offset-2">
          /seed
        </a>{" "}
        — send it to a colleague, courtesy of The AGENT Connection.
      </p>

      {showText && (
        <div className="mt-4">
          <p className="mb-1 text-xs text-clay">Copy didn't take — press and hold to select it all:</p>
          <textarea
            readOnly
            value={SEED_PROMPT}
            rows={10}
            className="w-full rounded-xl border border-rule bg-sheet-2 px-3 py-2 font-mono text-[11px] text-soft"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}
    </section>
  );
}
