"use client";

// THE DUEL. Pick a rival's real assistant and try to make it invent something.
// Every honest refusal pays the agent who BUILT it — defending your own fact
// sheet is the skill being taught. "I BROKE IT" is a claim, not a verdict:
// it goes to the stage to be judged out loud.

import { useCallback, useEffect, useState } from "react";
import type { RosterEntry } from "@/lib/types";

interface Shot {
  q: string;
  a: string;
  refused: boolean;
  attackId: number | null;
  target: string;
  flagged: boolean;
}

export function DuelScreen({
  engineOnline,
  stats,
  onFired,
}: {
  engineOnline: boolean;
  stats: { fired: number; held: number; flagged: number; built: number } | null;
  onFired: (refused: boolean) => void;
}) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [target, setTarget] = useState<RosterEntry | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Shot[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const loadRoster = useCallback(async () => {
    try {
      const res = await fetch("/api/duel", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        const list: RosterEntry[] = data.roster ?? [];
        setRoster(list);
        // Never leave them staring at a screen with nothing to type in:
        // if they haven't chosen, aim at the first target for them.
        setTarget((t) => t ?? list[0] ?? null);
      }
    } catch {
      // next tick
    }
  }, []);

  useEffect(() => {
    void loadRoster();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void loadRoster();
    }, 5000);
    return () => clearInterval(id);
  }, [loadRoster]);

  async function fire() {
    const question = q.trim();
    if (!question || !target || busy) return;
    setBusy(true);
    setNotice(null);
    setQ("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: target.code, question, duel: true }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLog((l) => [
          { q: question, a: data.answer, refused: data.refused, attackId: data.attackId, target: target.agentName, flagged: false },
          ...l,
        ].slice(0, 6));
        onFired(data.refused);
      } else {
        setNotice(
          data?.error === "offline"
            ? "The engine isn't switched on — watch the screen."
            : data?.error === "not_duel_time"
              ? "The duel isn't open yet — eyes up front."
              : "Hiccup — fire again."
        );
      }
    } catch {
      setNotice("Hiccup — fire again.");
    }
    setBusy(false);
  }

  async function flag(i: number) {
    const shot = log[i];
    if (!shot?.attackId || shot.flagged) return;
    try {
      const res = await fetch("/api/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attackId: shot.attackId }),
      });
      if (res.ok) {
        setLog((l) => l.map((s, j) => (j === i ? { ...s, flagged: true } : s)));
      }
    } catch {
      // tap again
    }
  }

  return (
    <section className="mt-6 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Game two · the room vs. the room</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        Break somebody&apos;s assistant.
      </h1>

      {stats && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-sheet-2 px-4 py-2.5 text-sm font-semibold text-cream">
          🛡 {stats.held} of {stats.fired} shots held the line
          {stats.built > 0 && (
            <span className="text-soft">
              {" "}· {stats.built} agent assistant{stats.built === 1 ? "" : "s"} live in this room
            </span>
          )}
        </p>
      )}

      {!engineOnline && (
        <p className="mt-3 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">
          The engine isn&apos;t switched on tonight — watch the screen.
        </p>
      )}

      {roster.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-rule bg-sheet-2 p-4 text-sm text-soft">
          Nobody else has deployed one yet. Give it a second — the room is still building.
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm font-semibold text-cream">
            Firing at <span className="text-gold-bright">{target?.initials || target?.agentName || "—"}</span>
            <span className="font-normal text-faint"> · tap to switch</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roster.map((r) => (
              <button
                key={r.code}
                onClick={() => setTarget(r)}
                className={`rounded-xl border px-3 py-2 text-left ${
                  target?.code === r.code ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2/60"
                }`}
              >
                <span className="text-sm font-bold text-cream">
                  {r.emoji} {r.initials || r.agentName}
                </span>
                {r.headline && <span className="ml-2 text-[11px] text-faint">{r.headline}</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {target && (
        <>
          <div className="mt-4 flex items-end gap-2">
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void fire();
                }
              }}
              rows={2}
              placeholder={`Ask ${target.initials || target.agentName}'s assistant something its sheet can't cover…`}
              aria-label="Your question"
              className="w-full resize-none rounded-2xl border border-rule bg-sheet-2 px-4 py-3 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
            />
            <button
              onClick={() => void fire()}
              disabled={busy || !q.trim()}
              className="shrink-0 rounded-2xl bg-gold px-4 py-3 text-sm font-bold text-sheet disabled:opacity-40"
            >
              {busy ? "…" : "Fire"}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-faint">
            {q.trim()
              ? "Enter to fire."
              : "Type a question to light up Fire — try the water heater, the schools, or what the sellers will take."}
          </p>
        </>
      )}

      {notice && <p className="mt-3 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{notice}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {log.map((s, i) => (
          <div
            key={i}
            className={`pop-in rounded-2xl border p-4 ${s.refused ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2"}`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">vs. {s.target}</p>
            <p className="mt-1 text-sm font-semibold text-cream">“{s.q}”</p>
            <p className="mt-1 text-sm text-soft">{s.a}</p>
            {s.refused ? (
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gold-bright">
                held the line ✓ — +15 to whoever built it
              </p>
            ) : s.flagged ? (
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-clay">
                flagged — the stage will rule on it
              </p>
            ) : (
              <button
                onClick={() => void flag(i)}
                className="mt-2 rounded-lg border border-clay/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-clay"
              >
                I broke it — it made that up
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
