"use client";

// THE SWITCHBOARD — every live conversation, and the button that puts a human
// in one. Built once and worn by two very different people:
//
//   · the PRESENTER, at the console, watching the whole room's assistants take
//     questions in real time and breaking into any of them from the stage;
//   · the ATTENDEE, on their phone, watching the assistant THEY built field a
//     real question and reaching in when it matters.
//
// The name shown as "answering as" is the name the visitor will see attached
// to the takeover, so it is always on screen before anything is sent. The
// visitor is told a person joined — we never quietly swap a human in.

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThreadMsg, ThreadRow } from "@/lib/types";

interface Stats {
  threads: number;
  waiting: number;
  taken: number;
  msgs: number;
}

export function Switchboard({
  seatKey = "",
  fallbackName = "",
  emptyLine = "No conversations yet. The moment somebody scans a QR and asks a question, it lands here.",
}: {
  /** Presenter key. Empty means "use my session cookie" — the attendee case. */
  seatKey?: string;
  /** Pre-fills "answering as" when a thread doesn't name its own agent. */
  fallbackName?: string;
  emptyLine?: string;
}) {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [stats, setStats] = useState<Stats>({ threads: 0, waiting: 0, taken: 0, msgs: 0 });
  const [pick, setPick] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ThreadMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [as, setAs] = useState(fallbackName);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const qs = seatKey ? `key=${encodeURIComponent(seatKey)}` : "";

  const pullList = useCallback(async () => {
    try {
      const res = await fetch(`/api/switchboard?${qs}`, { cache: "no-store" });
      const d = await res.json();
      if (d?.ok) {
        setThreads(d.threads ?? []);
        setStats(d.stats ?? { threads: 0, waiting: 0, taken: 0, msgs: 0 });
        setErr("");
      } else if (d?.error === "no_seat") {
        setErr("Join the room from your phone first — that's what proves this desk is yours.");
      }
    } catch {
      /* a dropped poll is not news */
    }
  }, [qs]);

  const pullThread = useCallback(async () => {
    if (!pick) return;
    try {
      const res = await fetch(`/api/switchboard?${qs}${qs ? "&" : ""}t=${pick}`, { cache: "no-store" });
      const d = await res.json();
      if (d?.ok) setMsgs(d.messages ?? []);
    } catch {
      /* ditto */
    }
  }, [pick, qs]);

  useEffect(() => {
    void pullList();
    const h = setInterval(() => void pullList(), 4000);
    return () => clearInterval(h);
  }, [pullList]);

  useEffect(() => {
    void pullThread();
    if (!pick) return;
    const h = setInterval(() => void pullThread(), 2500);
    return () => clearInterval(h);
  }, [pick, pullThread]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  // Opening a thread pre-fills the name the visitor will see.
  const current = threads.find((t) => t.id === pick) ?? null;
  useEffect(() => {
    if (current) setAs((a) => a || current.agentName || fallbackName);
  }, [current, fallbackName]);

  async function send() {
    const body = draft.trim();
    if (!body || !pick || sending) return;
    setSending(true);
    try {
      await fetch("/api/switchboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: seatKey, t: pick, body, who: as.trim() || fallbackName }),
      });
      setDraft("");
      await Promise.all([pullThread(), pullList()]);
    } catch {
      setErr("That didn't send. Try again.");
    }
    setSending(false);
  }

  async function handBack() {
    if (!pick) return;
    await fetch("/api/switchboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: seatKey, t: pick, release: true }),
    });
    await Promise.all([pullThread(), pullList()]);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
      {/* ---- the board of live conversations ---- */}
      <aside className="flex min-h-0 shrink-0 flex-col lg:w-[22rem]">
        <div className="flex items-baseline gap-3 px-1 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-gold">The switchboard</h3>
          <p className="text-xs text-faint">
            {stats.threads} live · {stats.msgs} messages
            {stats.waiting > 0 && <span className="ml-2 font-bold text-gold-bright">{stats.waiting} waiting on you</span>}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-rule bg-sheet-2 p-2">
          {threads.length === 0 && <p className="p-3 text-sm leading-relaxed text-faint">{emptyLine}</p>}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => { setPick(t.id); setMsgs([]); setAs(t.agentName || fallbackName); }}
              className={`mb-1.5 w-full rounded-xl border px-3 py-2.5 text-left transition ${
                pick === t.id ? "border-gold bg-sheet" : "border-transparent bg-sheet/60 hover:border-rule"
              }`}
            >
              <div className="flex items-center gap-2">
                {t.waiting && <span className="waiting-dot" aria-hidden />}
                {!t.waiting && t.operator && <span className="live-dot" aria-hidden />}
                <span className="truncate text-sm font-bold text-cream">
                  {t.visitorLabel || "Someone on the QR"}
                </span>
                <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-faint">
                  {t.msgs} msg
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-soft">
                <span className="text-gold">{t.agentName}</span>
                {t.headline ? ` · ${t.headline}` : ""}
              </p>
              <p className="mt-1 truncate text-xs text-faint">
                {t.lastRole === "visitor" ? "› " : ""}
                {t.lastBody}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* ---- the conversation, and the wheel ---- */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-rule bg-sheet-2">
        {!pick && (
          <p className="m-auto max-w-sm p-6 text-center text-sm leading-relaxed text-faint">
            Pick a conversation to read it live. You can answer inside it at any time — the visitor
            is told by name that a person joined.
          </p>
        )}
        {pick && (
          <>
            <header className="flex items-center gap-2 border-b border-rule px-4 py-2.5">
              <p className="truncate text-sm font-bold text-cream">
                {current?.visitorLabel || "Someone on the QR"}
              </p>
              <p className="truncate text-xs text-faint">· {current?.agentName}</p>
              <div className="ml-auto flex items-center gap-2">
                {current?.operator ? (
                  <>
                    <span className="live-dot" aria-hidden />
                    <span className="text-xs font-semibold text-moss">{current.operator} has the wheel</span>
                    <button
                      onClick={() => void handBack()}
                      className="rounded-full border border-rule px-3 py-1 text-xs font-bold text-soft hover:border-gold hover:text-gold"
                    >
                      Hand it back
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-faint">the assistant is answering</span>
                )}
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {msgs.map((m) => (
                <div key={m.id}>
                  {m.role === "system" ? (
                    <p className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-faint">
                      {m.body}
                    </p>
                  ) : m.role === "visitor" ? (
                    <p className="max-w-[80%] rounded-2xl rounded-bl-sm border border-rule bg-sheet px-3 py-2 text-sm text-cream">
                      {m.body}
                    </p>
                  ) : (
                    <div
                      className={`ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-sm ${
                        m.role === "agent"
                          ? "bg-moss/20 text-cream ring-1 ring-moss/50"
                          : "bg-sheet text-soft ring-1 ring-rule"
                      }`}
                    >
                      {m.role === "agent" && (
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-moss">human</p>
                      )}
                      {m.body}
                      {m.refused && m.role === "assistant" && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gold-bright">
                          declined · held the line
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottom} />
            </div>

            <footer className="border-t border-rule p-3">
              <div className="mb-2 flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-faint" htmlFor="sb-as">
                  answering as
                </label>
                <input
                  id="sb-as"
                  value={as}
                  onChange={(e) => setAs(e.target.value)}
                  className="w-44 rounded-lg border border-rule bg-sheet px-2 py-1 text-xs font-semibold text-cream focus:border-gold focus:outline-none"
                />
                <span className="text-[10px] text-faint">— this name is what the visitor sees</span>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={2}
                  placeholder="Type to take over the conversation…"
                  className="w-full resize-none rounded-xl border border-rule bg-sheet px-3 py-2 text-sm text-cream placeholder:text-faint focus:border-gold focus:outline-none"
                />
                <button
                  onClick={() => void send()}
                  disabled={sending || !draft.trim()}
                  className="shrink-0 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-sheet disabled:opacity-40"
                >
                  {current?.operator ? "Send" : "Break in"}
                </button>
              </div>
            </footer>
          </>
        )}
        {err && <p className="border-t border-clay/40 px-4 py-2 text-xs text-clay">{err}</p>}
      </section>
    </div>
  );
}
