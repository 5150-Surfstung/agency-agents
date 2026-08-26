"use client";

// The projector. Every slide is staged like a card from the Big REveal deck:
// entrance choreography, a gold wipe under the headline, stats that count up,
// reveals where the bars arrive one at a time and the winner breathes. The
// presenter drives blind-simple:
//   → / ←   slides (polls re-arm on arrival)
//   space   poll & price: open → reveal
//   L       leads drawer      Q  join QR overlay
// The HUD whispers: phones present, backend, engine, sms, spend.

import { useCallback, useEffect, useRef, useState } from "react";
import { DECK } from "@/lib/deck";
import type { Attack, Lead, Player, ScoreRow } from "@/lib/types";

interface Snapshot {
  ok: boolean;
  step: number;
  total: number;
  pollState: "closed" | "open" | "revealed";
  counts: number[] | null;
  priceValues: { value: number; n: number }[] | null;
  aiGuess: { guessK: number; reasoning: string } | null;
  podium: { initials: string; emoji: string; value: number; offBy: number; points: number }[] | null;
  attackFeed: Attack[] | null;
  duelStats: { fired: number; held: number; flagged: number; built: number } | null;
  scoreboard: ScoreRow[] | null;
  standings: Player[] | null;
  leads: Lead[];
  present: number;
  spendUsd: number;
  pin: string | null;
  engineOnline: boolean;
  smsOnline: boolean;
  backend: string;
}

const fmtK = (k: number) => `$${k.toLocaleString()}K`;

/** Counts up on mount; sits still for reduced-motion viewers. */
function CountUp({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const m = text.match(/^([^0-9]*)([\d,.]+)(.*)$/);
    if (!m || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = parseFloat(m[2].replaceAll(",", ""));
    if (!Number.isFinite(target)) return;
    const decimals = m[2].includes(".") ? m[2].split(".")[1].length : 0;
    const t0 = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = (target * eased).toFixed(decimals);
      setShown(`${m[1]}${Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals })}${m[3]}`);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [text]);
  return <>{shown}</>;
}

export function PresentClient({ presenterKey }: { presenterKey: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [showLeads, setShowLeads] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [presentPop, setPresentPop] = useState(false);
  const prevPresent = useRef(0);

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
    if (!snap) return;
    if (snap.present > prevPresent.current) {
      setPresentPop(true);
      const t = setTimeout(() => setPresentPop(false), 500);
      prevPresent.current = snap.present;
      return () => clearTimeout(t);
    }
    prevPresent.current = snap.present;
  }, [snap]);

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
  const price = slide.price;
  const total = snap.counts?.reduce((a, b) => a + b, 0) ?? 0;
  const priceTotal = snap.priceValues?.reduce((s, v) => s + v.n, 0) ?? 0;
  const winner =
    snap.pollState === "revealed" && snap.counts ? snap.counts.indexOf(Math.max(...snap.counts)) : -1;

  return (
    <main className="stage relative flex min-h-dvh flex-col overflow-hidden px-[6vw] py-[5vh]">
      {/* ——— slide (keyed remount = entrance choreography) ——— */}
      <section key={snap.step} className="slide-enter flex flex-1 flex-col justify-center">
        {slide.eyebrow && (
          <p className="rise text-[clamp(12px,1.2vw,18px)] font-semibold uppercase tracking-[0.22em] text-gold">
            {slide.eyebrow}
          </p>
        )}
        <h1 className="rise d1 mt-[1.5vh] max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(34px,5.2vw,84px)] font-semibold leading-[1.06] text-cream [text-wrap:balance]">
          {slide.heading}
          <span className="wipe mt-[1.2vh] block h-[0.6vh] w-[16vw] rounded-full bg-gold" />
        </h1>

        {slide.kind === "title" && (
          <p className="rise d2 mt-[3vh] text-[clamp(18px,2vw,32px)] font-semibold text-soft">
            <span className={`inline-block text-gold-bright transition-transform ${presentPop ? "scale-125" : ""}`}>
              📱 {snap.present}
            </span>{" "}
            in the room and counting
          </p>
        )}

        {slide.stats && (
          <div className="rise d2 mt-[4vh] flex flex-wrap gap-[3vw]">
            {slide.stats.map((s) => (
              <div key={s.label} className="min-w-[16vw]">
                <p className="font-[family-name:var(--font-display)] text-[clamp(36px,4.6vw,72px)] font-bold text-gold-bright">
                  <CountUp text={s.value} />
                </p>
                <p className="mt-1 max-w-[24ch] text-[clamp(13px,1.15vw,18px)] leading-snug text-soft">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {slide.lines && (
          <div className="rise d3 mt-[3.5vh] flex max-w-[64ch] flex-col gap-[1.2vh]">
            {slide.lines.map((l) => (
              <p key={l} className="text-[clamp(16px,1.6vw,26px)] leading-relaxed text-soft">
                {l}
              </p>
            ))}
          </div>
        )}

        {slide.quote && (
          <blockquote className="rise d3 mt-[4vh] max-w-[46ch] border-l-2 border-gold pl-[1.4vw] font-[family-name:var(--font-display)] text-[clamp(18px,2vw,32px)] italic leading-snug text-cream">
            “{slide.quote}”
          </blockquote>
        )}

        {/* ——— classic poll canvas ——— */}
        {poll && (
          <div className="rise d2 mt-[4vh] w-full max-w-[72ch]">
            {/* Question and answers live on screen together, always readable
                from the back row. Bars climb while the room votes; the reveal
                crowns the winner. */}
            <div className="flex flex-col gap-[1.5vh]">
              {poll.options.map((opt, i) => {
                const n = snap.counts?.[i] ?? 0;
                const pct = total ? Math.round((n / total) * 100) : 0;
                const isWin = snap.pollState === "revealed" && i === winner && total > 0;
                const dim = snap.pollState === "closed";
                return (
                  <div key={opt}>
                    <div className="flex items-baseline justify-between gap-[2vw]">
                      <span
                        className={`text-[clamp(18px,1.9vw,32px)] font-semibold ${
                          isWin ? "text-gold-bright" : dim ? "text-soft" : "text-cream"
                        }`}
                      >
                        <span className="mr-[0.8vw] font-bold text-faint">{i + 1}</span>
                        {opt} {isWin && "👑"}
                      </span>
                      {snap.pollState !== "closed" && (
                        <span
                          className={`shrink-0 text-[clamp(18px,1.9vw,32px)] font-bold ${
                            isWin ? "text-gold-bright" : "text-soft"
                          }`}
                        >
                          {pct}%
                        </span>
                      )}
                    </div>
                    <div className="mt-[0.6vh] h-[1.7vh] overflow-hidden rounded-full bg-sheet-3">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                          isWin ? "winner-pulse bg-gold-bright" : "bg-gold/80"
                        }`}
                        style={{ width: snap.pollState === "closed" ? "0%" : `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="mt-[0.8vh] flex items-center gap-[1.2vw]">
                {snap.pollState === "open" && (
                  <span className="ring-pulse inline-block h-[1.6vh] w-[1.6vh] rounded-full bg-moss" />
                )}
                <p className="text-[clamp(15px,1.5vw,24px)] font-semibold text-cream">
                  <span className="font-[family-name:var(--font-display)] text-[clamp(22px,2.6vw,42px)] font-bold text-gold-bright">
                    {total}
                  </span>{" "}
                  {snap.pollState === "revealed" ? "votes in" : "voting live"} ·{" "}
                  <span className="text-faint">🔒 anonymous, always</span>
                  {snap.pollState === "open" && <span className="text-faint"> · tap REVEAL to crown it</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ——— price game canvas ——— */}
        {price && (
          <div className="rise d2 mt-[3vh] w-full max-w-[80ch]">
            {snap.pollState !== "revealed" && (
              <ul className="flex flex-col gap-[0.6vh] text-[clamp(15px,1.5vw,24px)] text-soft">
                {price.facts.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            )}
            {snap.pollState === "closed" && (
              <p className="mt-[2vh] text-[clamp(15px,1.4vw,22px)] text-faint">
                Sliders armed — <span className="font-bold text-soft">space</span> opens the floor.
              </p>
            )}
            {snap.pollState === "open" && (
              <div className="mt-[2.5vh] flex items-center gap-[1.5vw]">
                <span className="ring-pulse inline-block h-[2vh] w-[2vh] rounded-full bg-moss" />
                <p className="text-[clamp(20px,2.4vw,40px)] font-semibold text-cream">
                  <span className="font-[family-name:var(--font-display)] text-[clamp(28px,3.4vw,56px)] font-bold text-gold-bright">
                    {priceTotal}
                  </span>{" "}
                  guesses locked · <span className="text-faint">space reveals</span>
                </p>
              </div>
            )}
            {snap.pollState === "revealed" && (
              <>
                <PriceHistogram
                  values={snap.priceValues ?? []}
                  minK={price.minK}
                  maxK={price.maxK}
                  soldK={price.soldK}
                  soldLabel={price.soldLabel}
                  anchorK={price.anchorK}
                  anchorLabel={price.anchorLabel}
                  source={price.source}
                  aiGuess={snap.aiGuess}
                />
                {snap.podium && snap.podium.length > 0 && (
                  <div className="mt-[2vh] flex flex-wrap items-center gap-[1.6vw]">
                    {snap.podium.map((p, i) => (
                      <div
                        key={p.initials + i}
                        className="bar-row flex items-baseline gap-[0.8vw] rounded-2xl border border-gold/60 bg-sheet-2 px-[1.4vw] py-[1vh]"
                        style={{ animationDelay: `${1 + i * 0.25}s` }}
                      >
                        <span className="text-[clamp(20px,2.2vw,36px)]">{["🥇", "🥈", "🥉"][i]}</span>
                        <span className="font-[family-name:var(--font-display)] text-[clamp(18px,2vw,32px)] font-bold text-cream">
                          {p.emoji} <span className="tracking-[0.2em]">{p.initials}</span>
                        </span>
                        <span className="text-[clamp(13px,1.2vw,19px)] font-semibold text-soft">
                          {fmtK(p.value)} · off {fmtK(p.offBy)}
                        </span>
                        <span className="text-[clamp(14px,1.3vw,21px)] font-bold text-gold-bright">+{p.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ——— the build: a counter that climbs as the room ships ——— */}
        {slide.kind === "build" && (
          <div className="rise d2 mt-[3vh] w-full max-w-[90ch]">
            <div className="flex items-baseline gap-[1.5vw]">
              <span className="font-[family-name:var(--font-display)] text-[clamp(48px,7vw,120px)] font-bold text-gold-bright">
                {snap.duelStats?.built ?? 0}
              </span>
              <span className="text-[clamp(18px,2vw,34px)] font-semibold text-cream">
                assistants live in this room
                <span className="block text-[clamp(13px,1.2vw,19px)] text-faint">
                  each one a real page, a real QR, a real fact sheet
                </span>
              </span>
            </div>
          </div>
        )}

        {/* ——— the duel: shots fired at the room's real assistants ——— */}
        {slide.kind === "duel" && (
          <div className="rise d2 mt-[2vh] w-full max-w-[110ch]">
            {snap.duelStats && snap.duelStats.fired > 0 && (
              <div className="mb-[2vh] flex items-baseline gap-[1.5vw]">
                <span className="font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,76px)] font-bold text-gold-bright">
                  {snap.duelStats.held}
                </span>
                <span className="text-[clamp(16px,1.7vw,28px)] font-semibold text-cream">
                  of {snap.duelStats.fired} shots held the line
                  {snap.duelStats.flagged > 0 && (
                    <span className="ml-[1vw] text-clay">· {snap.duelStats.flagged} flagged for your ruling</span>
                  )}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-[1.2vh] lg:grid-cols-2">
              {!snap.engineOnline && (
                <p className="rounded-xl border border-clay/60 bg-sheet-2 px-[1.2vw] py-[1.2vh] text-[clamp(14px,1.3vw,20px)] text-clay">
                  Engine key not loaded — this game sits out tonight, honestly.
                </p>
              )}
              {(snap.attackFeed ?? []).map((e) => (
                <div
                  key={e.id}
                  className={`stump-in rounded-2xl border px-[1.2vw] py-[1.2vh] ${
                    e.flagged ? "border-clay bg-sheet-2" : e.refused ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2"
                  }`}
                >
                  <p className="text-[clamp(11px,1vw,15px)] font-bold uppercase tracking-wider text-faint">
                    {e.emoji} {e.initials || "someone"} → {e.agentName}&apos;s assistant
                  </p>
                  <p className="mt-[0.3vh] text-[clamp(14px,1.3vw,21px)] font-semibold text-cream">“{e.question}”</p>
                  <p className="mt-[0.4vh] text-[clamp(13px,1.15vw,18px)] leading-snug text-soft">
                    {e.answer || "…thinking"}
                  </p>
                  {e.flagged ? (
                    <p className="mt-[0.4vh] text-[clamp(11px,0.95vw,15px)] font-bold uppercase tracking-widest text-clay">
                      ⚑ claimed broken — your call
                    </p>
                  ) : e.refused ? (
                    <p className="mt-[0.4vh] text-[clamp(11px,0.95vw,15px)] font-bold uppercase tracking-widest text-gold-bright">
                      held the line ✓
                    </p>
                  ) : null}
                </div>
              ))}
              {snap.engineOnline && (snap.attackFeed ?? []).length === 0 && (
                <p className="text-[clamp(15px,1.4vw,22px)] text-faint">Targets are up. First shot incoming…</p>
              )}
            </div>
          </div>
        )}

        {/* ——— THE BOARD: whole-night standings + the ring feeding them ——— */}
        {slide.kind === "leaderboard" && (
          <div className="rise d2 mt-[2.5vh] grid w-full max-w-[120ch] grid-cols-1 gap-[3vw] lg:grid-cols-2">
            <div>
              <p className="text-[clamp(13px,1.2vw,19px)] font-bold uppercase tracking-[0.2em] text-gold">
                The board · the whole night
              </p>
              {(snap.standings ?? []).length === 0 ? (
                <p className="mt-[1.5vh] text-[clamp(15px,1.4vw,22px)] text-faint">
                  Nobody's suited up yet — jerseys go on at the door.
                </p>
              ) : (
                <div className="mt-[1.2vh] flex flex-col gap-[0.8vh]">
                  {(snap.standings ?? []).slice(0, 8).map((r, i) => (
                    <div
                      key={r.deviceId}
                      className={`bar-row flex items-baseline justify-between rounded-xl border px-[1.4vw] py-[0.9vh] ${
                        i === 0 ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2"
                      }`}
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <span className="font-[family-name:var(--font-display)] text-[clamp(18px,2vw,32px)] font-bold text-cream">
                        {i === 0 ? "👑 " : `${i + 1}. `}
                        {r.emoji} <span className="tracking-[0.25em]">{r.initials}</span>
                      </span>
                      <span className={`text-[clamp(17px,1.9vw,30px)] font-bold ${i === 0 ? "winner-pulse text-gold-bright" : "text-gold-bright"}`}>
                        {r.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[clamp(13px,1.2vw,19px)] font-bold uppercase tracking-[0.2em] text-gold">
                The ring · best round × 10
              </p>
              {(snap.scoreboard ?? []).length === 0 ? (
                <p className="mt-[1.5vh] text-[clamp(15px,1.4vw,22px)] text-faint">
                  Post your sparring score from your phone — it's your final move.
                </p>
              ) : (
                <div className="mt-[1.2vh] flex flex-col gap-[0.8vh]">
                  {(snap.scoreboard ?? []).slice(0, 8).map((r, i) => (
                    <div
                      key={r.initials + i}
                      className="bar-row flex items-baseline justify-between rounded-xl border border-rule bg-sheet-2 px-[1.4vw] py-[0.9vh]"
                      style={{ animationDelay: `${0.3 + i * 0.08}s` }}
                    >
                      <span className="font-[family-name:var(--font-display)] text-[clamp(18px,2vw,32px)] font-bold text-cream">
                        <span className="tracking-[0.25em]">{r.initials}</span>
                      </span>
                      <span className="text-[clamp(16px,1.8vw,28px)] font-bold text-gold-bright">
                        {r.best}/10{" "}
                        <span className="text-[clamp(11px,1vw,15px)] font-semibold text-faint">· {r.rounds} rounds</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ——— presenter cue ——— */}
      {slide.cue && (
        <p className="relative z-10 max-w-[85ch] border-t border-rule pt-[1.2vh] text-[clamp(11px,0.95vw,15px)] text-faint">
          {slide.cue}
        </p>
      )}

      {/* ——— progress rail ——— */}
      <div className="relative z-10 mt-[1.2vh] flex items-center gap-[0.5vw]">
        {DECK.map((s, i) => (
          <span
            key={s.id}
            className={`h-[0.8vh] rounded-full transition-all ${
              i === snap.step ? "w-[3vw] bg-gold" : i < snap.step ? "w-[1vw] bg-gold/40" : "w-[1vw] bg-sheet-3"
            }`}
          />
        ))}
      </div>

      {/* ——— HUD ——— */}
      <div className="absolute right-[2vw] top-[3vh] z-10 flex items-center gap-[1.2vw] text-[clamp(11px,0.9vw,14px)] font-semibold text-faint">
        <span>
          {snap.step + 1}/{snap.total}
        </span>
        <span className={presentPop ? "scale-125 text-gold-bright transition-transform" : "transition-transform"}>
          📱 {snap.present}
        </span>
        <span className={snap.engineOnline ? "text-moss" : "text-clay"}>
          {snap.engineOnline ? `engine on · $${snap.spendUsd.toFixed(2)}` : "engine off"}
        </span>
        <span className={snap.smsOnline ? "text-moss" : "text-faint"}>{snap.smsOnline ? "sms on" : "sms off"}</span>
      </div>

      {/* ——— touch controls: the console drives from ANY device — laptop,
             iPad, or a phone with no keyboard. The big button is the space
             bar: it arms, opens, and reveals whatever game is on screen. ——— */}
      <div className="absolute bottom-[3vh] left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
        <button
          onClick={() => void act("prev")}
          aria-label="Previous slide"
          className="rounded-2xl border border-rule bg-sheet-2/90 px-5 py-3 text-xl font-bold text-cream backdrop-blur active:border-gold"
        >
          ◀
        </button>
        {(poll || price) && (
          <button
            onClick={() => void act("poll")}
            className={`rounded-2xl px-6 py-3 text-base font-bold tracking-wide backdrop-blur ${
              snap.pollState === "closed"
                ? "bg-gold text-sheet"
                : snap.pollState === "open"
                  ? "border border-gold bg-sheet-2/90 text-gold-bright"
                  : "border border-rule bg-sheet-2/90 text-faint"
            }`}
          >
            {snap.pollState === "closed"
              ? price
                ? "🎬 OPEN THE FLOOR"
                : "🎬 OPEN THE POLL"
              : snap.pollState === "open"
                ? "👑 REVEAL"
                : "revealed"}
          </button>
        )}
        <button
          onClick={() => void act("next")}
          aria-label="Next slide"
          className="rounded-2xl border border-rule bg-sheet-2/90 px-5 py-3 text-xl font-bold text-cream backdrop-blur active:border-gold"
        >
          ▶
        </button>
        <button
          onClick={() => setShowQr((v) => !v)}
          aria-label="Join QR"
          className="rounded-2xl border border-rule bg-sheet-2/90 px-4 py-3 text-sm font-bold text-soft backdrop-blur"
        >
          QR
        </button>
        <button
          onClick={() => setShowLeads((v) => !v)}
          aria-label="Leads drawer"
          className="rounded-2xl border border-rule bg-sheet-2/90 px-4 py-3 text-sm font-bold text-soft backdrop-blur"
        >
          L{snap.leads.length > 0 ? ` ${snap.leads.length}` : ""}
        </button>
      </div>

      {/* ——— always-on join badge: scan from any slide, in person or on a
             shared screen, and you're in — the QR carries the PIN. ——— */}
      {!showQr && !showLeads && (
        <div className="absolute bottom-[3vh] right-[2vw] z-10 flex flex-col items-center gap-[0.6vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?key=${encodeURIComponent(presenterKey)}`}
            alt="Scan to join the room"
            className="w-[clamp(72px,9vw,150px)] rounded-lg"
          />
          <p className="text-[clamp(10px,0.85vw,13px)] font-bold uppercase tracking-[0.18em] text-gold">
            scan · jump in
          </p>
          {snap.pin && (
            <p className="text-[clamp(10px,0.85vw,13px)] font-semibold tracking-[0.25em] text-faint">
              PIN {snap.pin}
            </p>
          )}
        </div>
      )}

      {/* ——— leads drawer (L) ——— */}
      {showLeads && (
        <aside className="absolute bottom-0 right-0 top-0 z-20 w-[26rem] overflow-y-auto border-l border-rule bg-sheet-2/95 p-6 backdrop-blur">
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
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-[3vh] bg-sheet/95 backdrop-blur"
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
          {snap.pin && (
            <p className="text-[clamp(18px,2vw,32px)] font-bold tracking-[0.3em] text-cream">
              PIN <span className="text-gold-bright">{snap.pin}</span>
            </p>
          )}
          <p className="text-[clamp(13px,1.2vw,18px)] text-faint">the scan already carries it · Q closes this</p>
        </div>
      )}
    </main>
  );
}

// -------------------------------------------------------- price histogram

function PriceHistogram({
  values,
  minK,
  maxK,
  soldK,
  soldLabel,
  anchorK,
  anchorLabel,
  source,
  aiGuess,
}: {
  values: { value: number; n: number }[];
  minK: number;
  maxK: number;
  soldK: number | null;
  soldLabel: string;
  anchorK: number | null;
  anchorLabel: string;
  source?: string;
  aiGuess: { guessK: number; reasoning: string } | null;
}) {
  const BUCKETS = 24;
  const span = maxK - minK;
  const buckets = new Array<number>(BUCKETS).fill(0);
  let totalGuesses = 0;
  let weighted = 0;
  for (const v of values) {
    const idx = Math.min(BUCKETS - 1, Math.max(0, Math.floor(((v.value - minK) / span) * BUCKETS)));
    buckets[idx] += v.n;
    totalGuesses += v.n;
    weighted += v.value * v.n;
  }
  const roomAvg = totalGuesses ? Math.round(weighted / totalGuesses) : null;
  const peak = Math.max(1, ...buckets);
  const xOf = (k: number) => `${Math.min(100, Math.max(0, ((k - minK) / span) * 100))}%`;

  return (
    <div className="mt-[2vh]">
      <div className="relative h-[26vh] w-full">
        {/* the room's guesses */}
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {buckets.map((n, i) => (
            <div
              key={i}
              className="bar-grow flex-1 rounded-t-[4px] bg-gold/70"
              style={{ height: `${(n / peak) * 100}%`, animationDelay: `${i * 0.03}s` }}
            />
          ))}
        </div>
        {/* the record's answer */}
        {soldK !== null && (
          <div className="marker absolute bottom-0 top-0" style={{ left: xOf(soldK) }}>
            <div className="h-full w-[3px] rounded bg-gold-bright shadow-[0_0_18px_rgba(217,174,100,0.9)]" />
            <p className="absolute -top-[3.4vh] -translate-x-1/2 whitespace-nowrap font-[family-name:var(--font-display)] text-[clamp(20px,2.4vw,40px)] font-bold text-gold-bright">
              {soldLabel} {fmtK(soldK)}
            </p>
          </div>
        )}
        {/* the homework's anchor */}
        {anchorK !== null && (
          <div className="marker absolute bottom-0 top-[15%]" style={{ left: xOf(anchorK), animationDelay: "0.5s" }}>
            <div className="h-full w-[2px] rounded bg-moss" />
            <p className="absolute -bottom-[3vh] -translate-x-1/2 whitespace-nowrap text-[clamp(11px,1vw,15px)] font-semibold text-moss">
              {anchorLabel}: {fmtK(anchorK)}
            </p>
          </div>
        )}
        {/* the machine's locked call */}
        {aiGuess && (
          <div className="marker absolute bottom-0 top-[28%]" style={{ left: xOf(aiGuess.guessK), animationDelay: "0.75s" }}>
            <div className="h-full w-[2px] rounded bg-clay" />
            <p className="absolute -top-[2.6vh] -translate-x-1/2 whitespace-nowrap text-[clamp(12px,1.1vw,17px)] font-bold text-clay">
              🤖 {fmtK(aiGuess.guessK)}
            </p>
          </div>
        )}
      </div>
      <div className="mt-[4vh] flex flex-wrap items-baseline gap-[3vw] text-[clamp(14px,1.3vw,21px)] text-soft">
        <span>
          <b className="text-cream">{totalGuesses}</b> guesses
        </span>
        {roomAvg !== null && (
          <span>
            room average <b className="text-cream">{fmtK(roomAvg)}</b>
          </span>
        )}
        {soldK !== null && anchorK !== null && (
          <span>
            the gap <b className="text-gold-bright">{fmtK(Math.abs(soldK - anchorK))}</b>
          </span>
        )}
        {soldK === null && (
          <span className="rounded-lg border border-rule bg-sheet-2 px-3 py-1 text-clay">
            the answer isn't loaded yet — the reveal stays honest until it is
          </span>
        )}
      </div>
      {aiGuess && (
        <p className="mt-[1.2vh] text-[clamp(13px,1.2vw,19px)] text-soft">
          <b className="text-clay">🤖 the machine called {fmtK(aiGuess.guessK)}</b> — “{aiGuess.reasoning}”
        </p>
      )}
      {source && (
        <p className="mt-[1.5vh] text-[clamp(11px,0.95vw,15px)] text-faint">Source: {source}</p>
      )}
    </div>
  );
}
