"use client";

// The projector view and the driver's seat, one screen.
//   → / ←   move slides (polls reset to closed on arrival)
//   space   on a poll slide: open → reveal
//   L       leads drawer
//   Q       QR overlay (join code, PIN baked in)
// The HUD whispers what the room is doing: phones present, votes on the
// current poll, arcade spend against the cap, engine status.

import { useCallback, useEffect, useState } from "react";
import { DECK } from "@/lib/deck";
import type { Lead } from "@/lib/types";

interface Snapshot {
  ok: boolean;
  step: number;
  total: number;
  pollState: "closed" | "open" | "revealed";
  counts: number[] | null;
  leads: Lead[];
  present: number;
  spendUsd: number;
  arcadeOpen: boolean;
  engineOnline: boolean;
}

export function PresentClient({ presenterKey }: { presenterKey: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [showLeads, setShowLeads] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/control?key=${encodeURIComponent(presenterKey)}`, { cache: "no-store" });
      if (res.ok) setSnap((await res.json()) as Snapshot);
    } catch {
      // next tick catches up
    }
  }, [presenterKey]);

  const act = useCallback(
    async (action: string, step?: number) => {
      try {
        const res = await fetch("/api/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: presenterKey, action, step }),
        });
        if (res.ok) setSnap((await res.json()) as Snapshot);
      } catch {
        // keyboard mash tolerant — the polling loop restores truth
      }
    },
    [presenterKey]
  );

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 1500);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") void act("next");
      else if (e.key === "ArrowLeft") void act("prev");
      else if (e.key === " ") {
        e.preventDefault();
        void act("poll");
      } else if (e.key.toLowerCase() === "l") setShowLeads((v) => !v);
      else if (e.key.toLowerCase() === "q") setShowQr((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act]);

  if (!snap) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-soft">Console connecting…</p>
      </main>
    );
  }

  const slide = DECK[snap.step] ?? DECK[0];
  const poll = slide.poll;
  const total = snap.counts?.reduce((a, b) => a + b, 0) ?? 0;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-[6vw] py-[5vh]">
      {/* ——— slide ——— */}
      <section className="flex flex-1 flex-col justify-center">
        {slide.eyebrow && (
          <p className="text-[clamp(12px,1.2vw,18px)] font-semibold uppercase tracking-[0.22em] text-gold">
            {slide.eyebrow}
          </p>
        )}
        <h1 className="mt-[1.5vh] max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(34px,5.2vw,84px)] font-semibold leading-[1.06] text-cream [text-wrap:balance]">
          {slide.heading}
        </h1>

        {slide.stats && (
          <div className="mt-[4vh] flex flex-wrap gap-[3vw]">
            {slide.stats.map((s) => (
              <div key={s.label} className="min-w-[16vw]">
                <p className="font-[family-name:var(--font-display)] text-[clamp(36px,4.6vw,72px)] font-bold text-gold-bright">
                  {s.value}
                </p>
                <p className="mt-1 max-w-[24ch] text-[clamp(13px,1.15vw,18px)] leading-snug text-soft">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {slide.lines && (
          <div className="mt-[3.5vh] flex max-w-[62ch] flex-col gap-[1.2vh]">
            {slide.lines.map((l) => (
              <p key={l} className="text-[clamp(16px,1.6vw,26px)] leading-relaxed text-soft">
                {l}
              </p>
            ))}
          </div>
        )}

        {slide.quote && (
          <blockquote className="mt-[4vh] max-w-[46ch] border-l-2 border-gold pl-[1.4vw] font-[family-name:var(--font-display)] text-[clamp(18px,2vw,32px)] italic leading-snug text-cream">
            “{slide.quote}”
          </blockquote>
        )}

        {/* poll canvas */}
        {poll && (
          <div className="mt-[4vh] max-w-[70ch]">
            {snap.pollState === "closed" && (
              <p className="text-[clamp(15px,1.4vw,22px)] text-faint">
                Poll armed — <span className="font-bold text-soft">space</span> opens it.
              </p>
            )}
            {snap.pollState === "open" && (
              <div className="flex items-center gap-[1.5vw]">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-moss" />
                <p className="text-[clamp(18px,2vw,32px)] font-semibold text-cream">
                  Voting live — <span className="text-gold-bright">{total}</span> in ·{" "}
                  <span className="text-faint">space reveals</span>
                </p>
              </div>
            )}
            {snap.pollState === "revealed" && snap.counts && (
              <div className="flex flex-col gap-[1.4vh]">
                {poll.options.map((opt, i) => {
                  const n = snap.counts?.[i] ?? 0;
                  const pct = total ? Math.round((n / total) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[clamp(15px,1.5vw,24px)] font-semibold text-cream">{opt}</span>
                        <span className="text-[clamp(15px,1.5vw,24px)] font-bold text-gold-bright">{pct}%</span>
                      </div>
                      <div className="mt-[0.5vh] h-[1.6vh] overflow-hidden rounded-full bg-sheet-3">
                        <div className="bar-fill h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[clamp(12px,1vw,16px)] text-faint">{total} votes</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ——— presenter cue (small, bottom, yours not theirs) ——— */}
      {slide.cue && (
        <p className="max-w-[80ch] border-t border-rule pt-[1.5vh] text-[clamp(11px,0.95vw,15px)] text-faint">
          {slide.cue}
        </p>
      )}

      {/* ——— HUD ——— */}
      <div className="absolute right-[2vw] top-[3vh] flex items-center gap-[1.2vw] text-[clamp(11px,0.9vw,14px)] font-semibold text-faint">
        <span>
          {snap.step + 1}/{snap.total}
        </span>
        <span>📱 {snap.present}</span>
        <span className={snap.engineOnline ? "text-moss" : "text-clay"}>
          {snap.engineOnline ? `engine on · $${snap.spendUsd.toFixed(2)}` : "engine off"}
        </span>
        {snap.arcadeOpen && <span className="text-gold">arcade open</span>}
      </div>

      {/* ——— leads drawer (L) ——— */}
      {showLeads && (
        <aside className="absolute bottom-0 right-0 top-0 w-[26rem] overflow-y-auto border-l border-rule bg-sheet-2/95 p-6 backdrop-blur">
          <div className="flex items-baseline justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-cream">Leads</h2>
            <a
              href={`/api/leads.csv?key=${encodeURIComponent(presenterKey)}`}
              className="text-xs font-bold text-gold underline-offset-2 hover:underline"
            >
              CSV ↓
            </a>
          </div>
          {snap.leads.length === 0 ? (
            <p className="mt-4 text-sm text-faint">The ladder poll fills this live.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {snap.leads.map((l) => (
                <li key={l.deviceId} className="rounded-xl border border-rule bg-sheet p-3">
                  <p className="font-semibold text-cream">
                    {l.name} <span className="text-soft">· {l.cell}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gold-bright">{l.rung}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {/* ——— QR overlay (Q) ——— */}
      {showQr && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh] bg-sheet/95 backdrop-blur"
          onClick={() => setShowQr(false)}
        >
          <p className="text-[clamp(16px,1.6vw,26px)] font-semibold uppercase tracking-[0.2em] text-gold">
            Scan in · your phone is part of the show
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?key=${encodeURIComponent(presenterKey)}`}
            alt="Join QR code"
            className="w-[min(46vh,80vw)] rounded-2xl"
          />
          <p className="text-[clamp(13px,1.2vw,18px)] text-faint">Q closes this</p>
        </div>
      )}
    </main>
  );
}
