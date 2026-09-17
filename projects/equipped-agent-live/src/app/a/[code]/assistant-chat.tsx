"use client";

// The conversation a stranger has with an agent's assistant.
//
// It is a THREAD, not a series of one-shots: it remembers what was already
// said, it survives a page reload, and — the part that makes it feel like a
// real front desk — the agent can reach in and take over mid-conversation.
// When that happens the visitor is TOLD, in the transcript, by name. We never
// pass a human off as the assistant or the assistant off as a human.
//
// Honest throughout: a refusal renders as a refusal, an offline engine says so.

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThreadMsg } from "@/lib/types";

/** One thread per assistant per browser. Losing it loses the history and
 *  nothing else, so a browser that blocks storage still works fine. */
function threadFor(code: string): string {
  const k = `ea_thread_${code}`;
  try {
    const found = window.localStorage.getItem(k);
    if (found) return found;
    const made = crypto.randomUUID();
    window.localStorage.setItem(k, made);
    return made;
  } catch {
    return crypto.randomUUID();
  }
}

export function AssistantChat({ code, agentName }: { code: string; agentName: string }) {
  const [thread, setThread] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  const [msgs, setMsgs] = useState<ThreadMsg[]>([]);
  const [operator, setOperator] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [sent, setSent] = useState(false);
  const [timeline, setTimeline] = useState("");
  const [financing, setFinancing] = useState("");
  const [hasAgent, setHasAgent] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const lastId = useRef(0);

  useEffect(() => setThread(threadFor(code)), [code]);

  const pull = useCallback(async () => {
    if (!thread) return;
    try {
      const res = await fetch(`/api/thread?t=${thread}&after=${lastId.current}`, { cache: "no-store" });
      const data = await res.json();
      if (!data?.ok) return;
      if (Array.isArray(data.messages) && data.messages.length) {
        lastId.current = data.messages[data.messages.length - 1].id;
        setMsgs((m) => [...m, ...(data.messages as ThreadMsg[])]);
      }
      if (typeof data.operator === "string") setOperator(data.operator);
    } catch {
      // a dropped poll is not an error the visitor needs to see
    }
  }, [thread]);

  // Slow while the machine is answering; brisk once a human is on the line,
  // because then somebody is actually typing to them.
  useEffect(() => {
    if (!thread) return;
    void pull();
    const every = operator ? 2000 : 5000;
    const h = setInterval(() => void pull(), every);
    return () => clearInterval(h);
  }, [thread, operator, pull]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy, pending]);

  async function ask() {
    const question = q.trim();
    if (!question || busy || !thread) return;
    setBusy(true);
    setNotice(null);
    setQ("");
    setPending(question);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, question, thread }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.held) setOperator(String(data.operator || ""));
      } else {
        setNotice(
          data?.error === "offline"
            ? "The assistant is resting right now — leave your number below and the agent will jump on it."
            : "Something hiccuped. Try that once more?"
        );
      }
    } catch {
      setNotice("No connection — try again in a moment.");
    }
    // The thread is the source of truth: pull, then drop the local bubble.
    await pull();
    setPending("");
    setBusy(false);
  }

  async function leaveDetails() {
    if (!name.trim() || !cell.trim()) return;
    try {
      const lastAsk = [...msgs].reverse().find((m) => m.role === "visitor");
      const res = await fetch("/api/ask", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, thread, name: name.trim(), cell: cell.trim(),
          question: lastAsk?.body ?? "",
          timeline, financing, hasAgent,
        }),
      });
      if (res.ok) setSent(true);
    } catch {
      // they can tap again
    }
  }

  const asked = msgs.filter((m) => m.role === "visitor").length;

  return (
    <section className="mt-6 flex flex-1 flex-col">
      {msgs.length === 0 && !pending && (
        <div className="rounded-2xl border border-rule bg-sheet-2 p-4">
          <p className="text-sm text-soft">
            Ask me anything about this home — beds, baths, square footage, showings. If it isn&apos;t on
            the fact sheet, I&apos;ll tell you straight instead of guessing, and {agentName} will get you
            the real answer.
          </p>
        </div>
      )}

      {/* A human has the wheel. Say so plainly and keep saying it. */}
      {operator && (
        <div className="pop-in mt-3 flex items-center gap-2 rounded-2xl border border-moss/60 bg-sheet-2 px-4 py-3">
          <span className="live-dot" aria-hidden />
          <p className="text-sm font-semibold text-moss">
            {operator} is on the line with you now — you&apos;re talking to a person.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {msgs.map((m) => <Bubble key={m.id} m={m} />)}
        {pending && (
          <p className="self-end rounded-2xl rounded-br-sm bg-gold px-4 py-2.5 text-[15px] font-semibold text-sheet opacity-70">
            {pending}
          </p>
        )}
        {busy && !operator && <p className="self-start text-sm text-faint">typing…</p>}
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
          placeholder={operator ? `Message ${operator}…` : "How many bedrooms? When can I see it?"}
          aria-label="Your question"
          className="w-full resize-none rounded-2xl border border-rule bg-sheet-2 px-4 py-3 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <button
          onClick={() => void ask()}
          disabled={busy || !q.trim()}
          className="shrink-0 rounded-2xl bg-gold px-5 py-3 text-sm font-bold text-sheet disabled:opacity-40"
        >
          Send
        </button>
      </div>

      {/* The hand-off — the whole reason this page exists. */}
      {asked >= 2 && !sent && (
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
          {/* One tap each, all optional — it reaches the agent's phone with
              the lead so the callback starts informed instead of cold. */}
          <Chips label="Looking to move" value={timeline} onPick={setTimeline} options={["ASAP", "1–3 months", "3–6 months", "Just looking"]} />
          <Chips label="Financing" value={financing} onPick={setFinancing} options={["Pre-approved", "Need a lender", "Cash"]} />
          <Chips label="Working with an agent?" value={hasAgent} onPick={setHasAgent} options={["No", "Yes"]} />
          <button
            onClick={() => void leaveDetails()}
            disabled={!name.trim() || !cell.trim()}
            className="mt-4 w-full rounded-xl bg-gold px-4 py-3 font-bold text-sheet disabled:opacity-40"
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

/** Four kinds of line, and they never look alike: the visitor, the assistant,
 *  a human who broke in, and the handoff note itself. */
function Bubble({ m }: { m: ThreadMsg }) {
  if (m.role === "system") {
    return (
      <p className="pop-in self-center rounded-full border border-rule bg-sheet px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
        {m.body}
      </p>
    );
  }
  if (m.role === "visitor") {
    return (
      <p className="pop-in self-end rounded-2xl rounded-br-sm bg-gold px-4 py-2.5 text-[15px] font-semibold text-sheet">
        {m.body}
      </p>
    );
  }
  const human = m.role === "agent";
  return (
    <div
      className={`pop-in self-start rounded-2xl rounded-bl-sm border px-4 py-3 text-[15px] leading-relaxed ${
        human ? "border-moss/60 bg-moss/10 text-cream" : "border-rule bg-sheet-2 text-cream"
      }`}
    >
      {human && (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-moss">from the agent</p>
      )}
      {m.body}
      {m.refused && !human && (
        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gold-bright">
          straight answer · no guessing
        </p>
      )}
    </div>
  );
}

/** Optional one-tap qualification. Nothing here is required — a lead with a
 *  name and a number still goes through. */
function Chips({
  label, value, onPick, options,
}: { label: string; value: string; onPick: (v: string) => void; options: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(value === o ? "" : o)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              value === o ? "border-gold bg-gold text-sheet" : "border-rule bg-sheet text-soft"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
