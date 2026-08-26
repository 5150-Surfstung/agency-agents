"use client";

// The attendee's whole night, one state machine driven by /api/state:
//   content slide  → eyes up front
//   poll open      → four big buttons
//   voted          → locked in, watch the screen
//   revealed       → the same bars the projector shows
//   ladder poll    → vote, then (optionally) a name and cell
//   arcade slides  → the two tools
// Phones poll every 1.5s. A dropped request just means the next one catches up.

import { useCallback, useEffect, useRef, useState } from "react";
import { Arcade } from "./arcade";

interface StatePayload {
  ok: boolean;
  step: number;
  slide: {
    id: string;
    kind: string;
    eyebrow: string | null;
    heading: string;
    poll: { key: string; question: string; options: string[]; capture: boolean } | null;
  };
  pollState: "closed" | "open" | "revealed";
  myVote: number | null;
  counts: number[] | null;
  arcadeOpen: boolean;
  engineOnline: boolean;
}

export function RoomClient() {
  const [state, setState] = useState<StatePayload | null>(null);
  const [lost, setLost] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadCell, setLeadCell] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const voteInFlight = useRef(false);

  const tick = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as StatePayload;
      setState(data);
      setLost(false);
    } catch {
      setLost(true);
    }
  }, []);

  useEffect(() => {
    void tick();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void tick();
    }, 1500);
    return () => clearInterval(id);
  }, [tick]);

  async function vote(choice: number) {
    if (!state?.slide.poll || voteInFlight.current) return;
    voteInFlight.current = true;
    // Optimistic: the button lights now; the next tick confirms.
    setState((s) => (s ? { ...s, myVote: choice } : s));
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollKey: state.slide.poll.key, choice }),
      });
    } catch {
      // The next tick restores the truth.
    }
    voteInFlight.current = false;
    void tick();
  }

  async function sendLead(rungLabel: string) {
    if (leadBusy || !leadName.trim() || !leadCell.trim()) return;
    setLeadBusy(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadName.trim(), cell: leadCell.trim(), rung: rungLabel }),
      });
      if (res.ok) setLeadSent(true);
    } catch {
      // Leave the form; they can tap again.
    }
    setLeadBusy(false);
  }

  if (!state) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-soft">Joining the room…</p>
      </main>
    );
  }

  const { slide, pollState, myVote, counts } = state;
  const poll = slide.poll;
  const total = counts?.reduce((a, b) => a + b, 0) ?? 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
          The Equipped Agent · Live
        </span>
        {lost && <span className="text-[10px] font-semibold text-clay">reconnecting…</span>}
      </header>

      {/* ——— Poll live ——— */}
      {poll && pollState !== "closed" ? (
        <section className="mt-8 flex flex-1 flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            {pollState === "open" ? "Vote now" : "The room has spoken"}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
            {poll.question}
          </h1>

          {pollState === "open" && (
            <div className="mt-6 flex flex-col gap-3">
              {poll.options.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => void vote(i)}
                  className={`rounded-2xl border px-5 py-4 text-left text-[15px] font-semibold transition-colors ${
                    myVote === i
                      ? "border-gold bg-gold text-sheet"
                      : "border-rule bg-sheet-2 text-cream active:border-gold-bright"
                  }`}
                >
                  {opt}
                </button>
              ))}
              <p className="mt-2 text-center text-xs text-faint">
                {myVote !== null ? "Locked in — you can still change it until the reveal." : "Tap one."}
              </p>
            </div>
          )}

          {pollState === "revealed" && counts && (
            <div className="mt-6 flex flex-col gap-3">
              {poll.options.map((opt, i) => {
                const n = counts[i] ?? 0;
                const pct = total ? Math.round((n / total) * 100) : 0;
                const mine = myVote === i;
                return (
                  <div key={opt} className="rounded-2xl border border-rule bg-sheet-2 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={`text-sm font-semibold ${mine ? "text-gold-bright" : "text-cream"}`}>
                        {opt}
                        {mine ? " · you" : ""}
                      </span>
                      <span className="text-sm font-bold text-soft">{pct}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sheet-3">
                      <div
                        className={`bar-fill h-full rounded-full ${mine ? "bg-gold-bright" : "bg-gold"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="mt-1 text-center text-xs text-faint">{total} votes</p>

              {/* The ladder: a vote becomes a lead the moment it has a name. */}
              {poll.capture && myVote !== null && !leadSent && (
                <div className="mt-4 rounded-2xl border border-gold/50 bg-sheet-2 p-4">
                  <p className="text-sm font-semibold text-cream">
                    Put a name on it and it happens today.
                  </p>
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="First name"
                    aria-label="First name"
                    autoComplete="given-name"
                    className="mt-3 w-full rounded-xl border border-rule bg-sheet px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
                  />
                  <input
                    value={leadCell}
                    onChange={(e) => setLeadCell(e.target.value)}
                    placeholder="Best cell"
                    aria-label="Best cell"
                    inputMode="tel"
                    autoComplete="tel"
                    className="mt-2 w-full rounded-xl border border-rule bg-sheet px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
                  />
                  <button
                    onClick={() => void sendLead(poll.options[myVote] ?? "")}
                    disabled={leadBusy || !leadName.trim() || !leadCell.trim()}
                    className="mt-3 w-full rounded-xl bg-gold px-4 py-3 font-bold text-sheet disabled:opacity-40"
                  >
                    {leadBusy ? "Sending…" : "Text me — same hour"}
                  </button>
                </div>
              )}
              {poll.capture && leadSent && (
                <p className="mt-3 rounded-2xl border border-moss/50 bg-sheet-2 p-4 text-center text-sm font-semibold text-moss">
                  Got it. Watch your phone — the first reply is the demo.
                </p>
              )}
            </div>
          )}
        </section>
      ) : state.arcadeOpen ? (
        /* ——— Arcade ——— */
        <Arcade engineOnline={state.engineOnline} />
      ) : (
        /* ——— Content slide: eyes up front ——— */
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          {slide.eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{slide.eyebrow}</p>
          )}
          <h1 className="mt-3 max-w-xs font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-cream">
            {slide.heading}
          </h1>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-faint">Eyes up front 👆</p>
          <p className="mt-1 text-xs text-faint">Your phone will light up when it's your turn.</p>
        </section>
      )}
    </main>
  );
}
