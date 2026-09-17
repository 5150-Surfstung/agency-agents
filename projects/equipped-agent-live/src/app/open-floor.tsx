"use client";

// THE OPEN FLOOR, on the console.
//
// This is the only place the pile exists. Every brag and every confession the
// room types lands here and nowhere else until Mike taps one — which is the
// whole reason people will type an honest fail in a room full of colleagues.
//
// Two states per row, and they matter: "Send to Val" puts the words on the
// wall and starts her thinking, and the row shows THINKING until the answer
// comes back. If the model can't be reached the row says so in plain words and
// the wall keeps the quote up with nothing invented under it.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Brag } from "@/lib/types";

export function OpenFloor({ presenterKey }: { presenterKey: string }) {
  const [brags, setBrags] = useState<Brag[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const seen = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/brag?key=${encodeURIComponent(presenterKey)}`, { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { brags?: Brag[] };
      setBrags(body.brags ?? []);
      seen.current = body.brags?.length ?? 0;
    } catch {
      // the next tick catches up
    }
  }, [presenterKey]);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 2000);
    return () => clearInterval(id);
  }, [load]);

  const send = useCallback(
    async (id: number) => {
      setBusyId(id);
      setErr("");
      // The words go up immediately; the answer follows when it exists.
      void load();
      try {
        const res = await fetch("/api/brag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: presenterKey, id }),
        });
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          setErr(
            b.error === "offline"
              ? "The engine is not reachable — the quote is on the wall, and nothing was invented under it."
              : b.error === "room_cap" || b.error === "device_cap"
                ? "Spend cap reached for the room. The quote is up; read your own answer."
                : "That didn't go through. The quote is up; tap again or read your own answer."
          );
        }
      } catch {
        setErr("That didn't go through. The quote is up; tap again or read your own answer.");
      } finally {
        setBusyId(null);
        void load();
      }
    },
    [presenterKey, load]
  );

  const clear = useCallback(async () => {
    await fetch("/api/brag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: presenterKey, action: "clear" }),
    }).catch(() => null);
    void load();
  }, [presenterKey, load]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-baseline gap-3 pb-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          {brags.length} in · console only
        </p>
        <button onClick={() => void clear()} className="ml-auto text-xs font-bold text-faint hover:text-soft">
          clear the wall
        </button>
      </div>
      {err && <p className="pb-2 text-sm font-semibold text-clay">{err}</p>}
      {brags.length === 0 ? (
        <p className="text-sm text-faint">
          Nothing yet. The screen is telling them Val is listening — give it sixty seconds.
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {brags.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border p-3 ${
                b.shown ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2/70"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                    b.kind === "confess" ? "text-clay" : "text-moss"
                  }`}
                >
                  {b.kind === "confess" ? "fail" : "win"}
                </span>
                {b.shown && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                    {b.reply ? "on the wall" : "thinking…"}
                  </span>
                )}
                <button
                  onClick={() => void send(b.id)}
                  disabled={busyId !== null}
                  className="ml-auto rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-sheet disabled:opacity-40"
                >
                  {busyId === b.id ? "sending…" : b.shown ? "send again" : "Send to Val"}
                </button>
              </div>
              <p className="mt-1.5 text-sm leading-snug text-cream">{b.body}</p>
              {b.reply && <p className="mt-2 text-xs leading-relaxed text-soft">{b.reply}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
