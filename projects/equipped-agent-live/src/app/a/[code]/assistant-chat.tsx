"use client";

// The conversation a stranger has with an agent's assistant. Two beats in,
// it asks for a name and cell — that hand-off is the entire product. Honest
// throughout: a refusal renders as a refusal, an offline engine says so.

import { useEffect, useRef, useState } from "react";

interface Turn {
  q: string;
  a: string;
  refused: boolean;
}

export function AssistantChat({ code, agentName }: { code: string; agentName: string }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Turn[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [sent, setSent] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log, busy]);

  async function ask() {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setNotice(null);
    setQ("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, question }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLog((l) => [...l, { q: question, a: data.answer, refused: data.refused }]);
      } else {
        setNotice(
          data?.error === "offline"
            ? "The assistant is resting right now — text the agent directly and they'll jump on it."
            : "Something hiccuped. Try that once more?"
        );
      }
    } catch {
      setNotice("No connection — try again in a moment.");
    }
    setBusy(false);
  }

  async function leaveDetails() {
    if (!name.trim() || !cell.trim()) return;
    try {
      const res = await fetch("/api/ask", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name: name.trim(), cell: cell.trim(), question: log[log.length - 1]?.q ?? "" }),
      });
      if (res.ok) setSent(true);
    } catch {
      // they can tap again
    }
  }

  return (
    <section className="mt-6 flex flex-1 flex-col">
      {log.length === 0 && (
        <div className="rounded-2xl border border-rule bg-sheet-2 p-4">
          <p className="text-sm text-soft">
            Ask me anything about this home — beds, baths, square footage, showings. If it isn&apos;t on
            the fact sheet, I&apos;ll tell you straight instead of guessing, and {agentName} will get you
            the real answer.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {log.map((t, i) => (
          <div key={i} className="pop-in flex flex-col gap-2">
            <p className="self-end rounded-2xl rounded-br-sm bg-gold px-4 py-2.5 text-[15px] font-semibold text-sheet">
              {t.q}
            </p>
            <div
              className={`self-start rounded-2xl rounded-bl-sm border px-4 py-3 text-[15px] leading-relaxed ${
                t.refused ? "border-gold/60 bg-sheet-2 text-cream" : "border-rule bg-sheet-2 text-cream"
              }`}
            >
              {t.a}
              {t.refused && (
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gold-bright">
                  straight answer · no guessing
                </p>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="self-start text-sm text-faint">typing…</p>}
        <div ref={bottom} />
      </div>

      {notice && (
        <p className="mt-3 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{notice}</p>
      )}

      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask();
            }
          }}
          rows={2}
          placeholder="How many bedrooms? When can I see it?"
          aria-label="Your question"
          className="w-full resize-none rounded-2xl border border-rule bg-sheet-2 px-4 py-3 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <button
          onClick={() => void ask()}
          disabled={busy || !q.trim()}
          className="shrink-0 rounded-2xl bg-gold px-5 py-3 text-sm font-bold text-sheet disabled:opacity-40"
        >
          Ask
        </button>
      </div>

      {/* The hand-off — the whole reason this page exists. */}
      {log.length >= 2 && !sent && (
        <div className="pop-in mt-5 rounded-2xl border border-gold/50 bg-sheet-2 p-4">
          <p className="text-sm font-semibold text-cream">
            Want {agentName} to answer the rest personally?
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            aria-label="First name"
            autoComplete="given-name"
            className="mt-3 w-full rounded-xl border border-rule bg-sheet px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
          />
          <input
            value={cell}
            onChange={(e) => setCell(e.target.value)}
            placeholder="Best cell"
            aria-label="Best cell"
            inputMode="tel"
            autoComplete="tel"
            className="mt-2 w-full rounded-xl border border-rule bg-sheet px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
          />
          <button
            onClick={() => void leaveDetails()}
            disabled={!name.trim() || !cell.trim()}
            className="mt-3 w-full rounded-xl bg-gold px-4 py-3 font-bold text-sheet disabled:opacity-40"
          >
            Have {agentName} reach out
          </button>
        </div>
      )}
      {sent && (
        <p className="mt-5 rounded-2xl border border-moss/50 bg-sheet-2 p-4 text-center text-sm font-semibold text-moss">
          Got it — {agentName} has your number and will be in touch.
        </p>
      )}
    </section>
  );
}
