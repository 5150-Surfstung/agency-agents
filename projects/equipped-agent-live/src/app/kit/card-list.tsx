"use client";

// The cards, on a page you keep. Two ways to use one: screenshot it and drop
// the PICTURE into Claude (works on a phone, in a parking lot, with no typing),
// or copy the text. Both are here because the first one is what people
// actually do and the second is what people say they'll do.

import { useState } from "react";
import type { Card } from "@/lib/cards";

export function CardList({ cards }: { cards: Card[] }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {cards.map((c) => <One key={c.id} c={c} />)}
    </div>
  );
}

function One({ c }: { c: Card }) {
  const [copied, setCopied] = useState(false);
  return (
    <article id={`card-${c.id}`} className="flex flex-col rounded-3xl border border-rule bg-sheet-2 p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="display text-xl font-extrabold text-cream">{c.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-soft">{c.payoff}</p>
        </div>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(c.body);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className="shrink-0 rounded-full border border-rule px-3 py-1.5 text-[11px] font-bold text-soft hover:border-gold hover:text-gold"
        >
          {copied ? "copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 flex-1 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-rule bg-sheet p-4 text-[13px] leading-relaxed text-cream">
        {c.body}
      </pre>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gold">
        📸 screenshot this card · paste the picture into Claude · it runs
      </p>
    </article>
  );
}
