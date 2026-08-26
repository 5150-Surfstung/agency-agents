// The seed, in the open. Anyone with this link — the room, the FB group, a
// colleague on Monday — can build their own assistant on their own Claude
// account. That generosity is the ad, courtesy of The AGENT Connection.

import type { Metadata } from "next";
import { SEED_PROMPT } from "@/lib/prompts";
import { SeedActions } from "./seed-actions";

export const metadata: Metadata = {
  title: "The Assistant Seed",
  description:
    "Paste one message into your own free Claude app; it interviews you and becomes your personal real-estate assistant. Courtesy of The AGENT Connection.",
};

export default function SeedPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-16 pt-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
        The Equipped Agent · courtesy of The AGENT Connection™
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-cream">
        The Assistant Seed
      </h1>
      <p className="mt-3 max-w-xl text-soft">
        One paste into your own <span className="font-semibold text-cream">free</span> Claude app. It
        interviews you — six questions — then becomes your personal real-estate assistant: your name,
        your market, your voice, with the grounding rules built in (never invents a number, grounded
        listings, fair housing always). Yours forever.
      </p>

      <div className="mt-6 rounded-2xl border border-gold/40 bg-sheet-2 p-5">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-soft">
          <li>Tap <b className="text-cream">Copy the seed</b> below.</li>
          <li>
            Open <b className="text-cream">claude.ai</b> or the Claude app — a free account works —
            and paste it into a new chat.
          </li>
          <li>Answer its six questions. Then take it for a sparring round.</li>
        </ol>
        <p className="mt-3 text-xs text-faint">
          Claude Pro? Create a Project and paste the seed into its instructions — permanent, no
          re-pasting.
        </p>
      </div>

      <SeedActions />

      <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-rule bg-sheet-2 p-5 font-mono text-[12.5px] leading-relaxed text-soft">
        {SEED_PROMPT}
      </pre>

      <footer className="mt-10 border-t border-rule pt-5 text-xs text-faint">
        <p>The AGENT Connection™ × Surfstung Systems · built live at The Equipped Agent.</p>
      </footer>
    </main>
  );
}
