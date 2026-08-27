"use client";

// THE PRESENTER'S CONSOLE — his laptop, never the projector. It carries the
// things the room must not see: the cue script, what's coming next, the leads
// as they land, spend, and the controls. The audience screen (/screen/<key>)
// renders the same slide from the same snapshot, minus all of it.
//
//   → / ←   slides        space   open → reveal
//   L       leads         Q       big join QR        S  open the audience screen

import { useCallback, useEffect, useState } from "react";
import { DECK } from "@/lib/deck";
import { type Snapshot } from "@/app/stage/slide-stage";

export function PresentClient({ presenterKey }: { presenterKey: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [showLeads, setShowLeads] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

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
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const openScreen = useCallback(() => {
    window.open(`/screen/${encodeURIComponent(presenterKey)}`, "_blank", "noopener");
  }, [presenterKey]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") void act("next");
      else if (e.key === "ArrowLeft") void act("prev");
      else if (e.key === " ") {
        e.preventDefault();
        void act("poll");
      } else if (e.key.toLowerCase() === "l") setShowLeads((v) => !v);
      else if (e.key.toLowerCase() === "q") setShowQr((v) => !v);
      else if (e.key.toLowerCase() === "s") openScreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, openScreen]);

  if (!snap) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-soft">Console connecting…</p>
      </main>
    );
  }

  const slide = DECK[snap.step] ?? DECK[0];
  const next = DECK[snap.step + 1];
  const isGame = Boolean(slide.poll || slide.price);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <main className="flex min-h-dvh flex-col bg-sheet px-6 py-5 lg:px-10">
      {/* ——— top strip: where we are, how long we've been at it ——— */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
        <div className="flex items-center gap-4">
          <span className="rounded-lg border border-rule bg-sheet-2 px-3 py-1.5 text-sm font-bold text-cream">
            {snap.step + 1}/{snap.total}
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">{slide.eyebrow ?? slide.kind}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="tabular-nums text-soft">⏱ {mins}:{secs}</span>
          <span className="text-cream">📱 {snap.present}</span>
          <span className={snap.engineOnline ? "text-moss" : "text-clay"}>
            {snap.engineOnline ? `engine on · $${snap.spendUsd.toFixed(2)}` : "engine off"}
          </span>
          <span className={snap.smsOnline ? "text-moss" : "text-faint"}>{snap.smsOnline ? "sms on" : "sms off"}</span>
          <button onClick={openScreen} className="rounded-lg border border-gold bg-sheet-2 px-3 py-1.5 font-bold text-gold-bright">
            Audience screen ↗
          </button>
        </div>
      </header>

      <div className="mt-5 grid flex-1 gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* ——— left: what the room is seeing, and what's live on it ——— */}
        <section className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-faint">On the screen now</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-cream">
            {slide.heading}
          </h1>

          {isGame && (
            <div className="mt-4 rounded-2xl border border-gold/50 bg-sheet-2 p-4">
              <p className="text-sm font-bold uppercase tracking-wider text-gold">
                {snap.pollState === "closed" ? "Armed" : snap.pollState === "open" ? "● Live — taking answers" : "Revealed"}
              </p>
              {slide.poll && snap.counts && (
                <div className="mt-3 flex flex-col gap-2">
                  {slide.poll.options.map((opt, i) => {
                    const n = snap.counts?.[i] ?? 0;
                    const t = snap.counts?.reduce((a, b) => a + b, 0) ?? 0;
                    const pct = t ? Math.round((n / t) * 100) : 0;
                    return (
                      <div key={opt} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-cream">
                          <b className="mr-2 text-faint">{i + 1}</b>
                          {opt}
                        </span>
                        <span className="shrink-0 font-bold text-gold-bright">
                          {pct}% <span className="text-xs font-semibold text-faint">({n})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {slide.price && (
                <p className="mt-2 text-sm text-soft">
                  <b className="text-cream">{snap.priceValues?.reduce((s, v) => s + v.n, 0) ?? 0}</b> guesses in
                  {snap.aiGuess && <span className="text-clay"> · 🤖 locked at ${snap.aiGuess.guessK}K</span>}
                </p>
              )}
            </div>
          )}

          {slide.kind === "build" && (
            <p className="mt-4 rounded-2xl border border-gold/50 bg-sheet-2 p-4 text-sm text-cream">
              <b className="text-2xl text-gold-bright">{snap.duelStats?.built ?? 0}</b> assistants deployed
            </p>
          )}
          {slide.kind === "duel" && snap.duelStats && (
            <p className="mt-4 rounded-2xl border border-gold/50 bg-sheet-2 p-4 text-sm text-cream">
              <b className="text-2xl text-gold-bright">{snap.duelStats.held}</b> of {snap.duelStats.fired} held
              {snap.duelStats.flagged > 0 && <span className="text-clay"> · ⚑ {snap.duelStats.flagged} to rule on</span>}
            </p>
          )}

          <div className="mt-auto pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-faint">Up next</p>
            <p className="mt-1 text-lg font-semibold text-soft">{next ? next.heading : "— end of deck —"}</p>
          </div>
        </section>

        {/* ——— right: THE SCRIPT. The reason this screen exists. ——— */}
        <section className="flex flex-col rounded-3xl border border-gold/40 bg-sheet-2 p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Your cue</p>
          <p className="mt-3 text-[17px] leading-relaxed text-cream lg:text-lg">
            {slide.cue ?? "—"}
          </p>
          {slide.lines && (
            <div className="mt-5 border-t border-rule pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-faint">Points on screen</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {slide.lines.map((l) => (
                  <li key={l} className="text-sm leading-snug text-soft">
                    · {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* ——— controls: work by touch, so an iPad or a phone can drive ——— */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 border-t border-rule pt-4">
        <button
          onClick={() => void act("prev")}
          className="rounded-2xl border border-rule bg-sheet-2 px-6 py-4 text-xl font-bold text-cream active:border-gold"
        >
          ◀
        </button>
        {isGame && (
          <button
            onClick={() => void act("poll")}
            className={`rounded-2xl px-8 py-4 text-base font-bold tracking-wide ${
              snap.pollState === "open" ? "bg-gold text-sheet" : "border border-gold bg-sheet-2 text-gold-bright"
            }`}
          >
            {snap.pollState === "open" ? "👑 REVEAL" : snap.pollState === "closed" ? "🎬 OPEN THE FLOOR" : "↻ RUN IT AGAIN"}
          </button>
        )}
        <button
          onClick={() => void act("next")}
          className="rounded-2xl bg-gold px-10 py-4 text-xl font-bold text-sheet"
        >
          ▶
        </button>
        <button
          onClick={() => setShowQr((v) => !v)}
          className="rounded-2xl border border-rule bg-sheet-2 px-5 py-4 text-sm font-bold text-soft"
        >
          QR
        </button>
        <button
          onClick={() => setShowLeads((v) => !v)}
          className="rounded-2xl border border-rule bg-sheet-2 px-5 py-4 text-sm font-bold text-soft"
        >
          Leads{snap.leads.length > 0 ? ` ${snap.leads.length}` : ""}
        </button>
      </div>

      {/* ——— leads drawer (L) ——— */}
      {showLeads && (
        <aside className="fixed bottom-0 right-0 top-0 z-20 w-[26rem] overflow-y-auto border-l border-rule bg-sheet-2/97 p-6 backdrop-blur">
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
          <button onClick={() => setShowLeads(false)} className="mt-6 text-xs font-bold text-faint">
            close (L)
          </button>
        </aside>
      )}

      {/* ——— big join QR (Q) — for holding up mid-room ——— */}
      {showQr && (
        <div
          className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-sheet/97 backdrop-blur"
          onClick={() => setShowQr(false)}
        >
          <p className="text-lg font-semibold uppercase tracking-[0.2em] text-gold">Scan to join</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/qr?key=${encodeURIComponent(presenterKey)}`} alt="Join QR code" className="w-[min(52vh,80vw)] rounded-2xl" />
          {snap.pin && (
            <p className="text-3xl font-bold tracking-[0.3em] text-cream">
              PIN <span className="text-gold-bright">{snap.pin}</span>
            </p>
          )}
          <p className="text-sm text-faint">the scan already carries it · Q closes</p>
        </div>
      )}
    </main>
  );
}
