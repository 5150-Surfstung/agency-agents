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
import type { Lead, ScoreRow, StumpEntry } from "@/lib/types";

interface Snapshot {
  ok: boolean;
  step: number;
  total: number;
  pollState: "closed" | "open" | "revealed";
  counts: number[] | null;
  priceValues: { value: number; n: number }[] | null;
  stumpFeed: StumpEntry[] | null;
  scoreboard: ScoreRow[] | null;
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
            {snap.pollState === "closed" && (
              <p className="text-[clamp(15px,1.4vw,22px)] text-faint">
                Poll armed — <span className="font-bold text-soft">space</span> opens it.
              </p>
            )}
            {snap.pollState === "open" && (
              <div className="flex items-center gap-[1.5vw]">
                <span className="ring-pulse inline-block h-[2vh] w-[2vh] rounded-full bg-moss" />
                <p className="text-[clamp(20px,2.4vw,40px)] font-semibold text-cream">
                  <span className="font-[family-name:var(--font-display)] text-[clamp(28px,3.4vw,56px)] font-bold text-gold-bright">
                    {total}
                  </span>{" "}
                  voting · <span className="text-faint">space reveals</span>
                </p>
              </div>
            )}
            {snap.pollState === "revealed" && snap.counts && (
              <div className="flex flex-col gap-[1.6vh]">
                {poll.options.map((opt, i) => {
                  const n = snap.counts?.[i] ?? 0;
                  const pct = total ? Math.round((n / total) * 100) : 0;
                  const isWin = i === winner && total > 0;
                  return (
                    <div key={opt} className="bar-row" style={{ animationDelay: `${i * 0.18}s` }}>
                      <div className="flex items-baseline justify-between">
                        <span className={`text-[clamp(15px,1.5vw,24px)] font-semibold ${isWin ? "text-gold-bright" : "text-cream"}`}>
                          {opt} {isWin && "👑"}
                        </span>
                        <span className="text-[clamp(15px,1.5vw,24px)] font-bold text-gold-bright">{pct}%</span>
                      </div>
                      <div className="mt-[0.5vh] h-[1.8vh] overflow-hidden rounded-full bg-sheet-3">
                        <div
                          className={`bar-fill h-full rounded-full ${isWin ? "winner-pulse bg-gold-bright" : "bg-gold"}`}
                          style={{ width: `${pct}%`, transitionDelay: `${0.2 + i * 0.18}s` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[clamp(12px,1vw,16px)] text-faint">{total} votes</p>
              </div>
            )}
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
              <PriceHistogram
                values={snap.priceValues ?? []}
                minK={price.minK}
                maxK={price.maxK}
                soldK={price.soldK}
                soldLabel={price.soldLabel}
                anchorK={price.anchorK}
                anchorLabel={price.anchorLabel}
                source={price.source}
              />
            )}
          </div>
        )}

        {/* ——— stump feed ——— */}
        {slide.kind === "stump" && (
          <div className="rise d2 mt-[3vh] grid w-full max-w-[110ch] grid-cols-1 gap-[1.2vh] lg:grid-cols-2">
            {!snap.engineOnline && (
              <p className="rounded-xl border border-clay/60 bg-sheet-2 px-[1.2vw] py-[1.2vh] text-[clamp(14px,1.3vw,20px)] text-clay">
                Engine key not loaded — this game sits out tonight, honestly.
              </p>
            )}
            {(snap.stumpFeed ?? []).map((e) => (
              <div
                key={e.id}
                className={`stump-in rounded-2xl border px-[1.2vw] py-[1.2vh] ${
                  e.refused ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2"
                }`}
              >
                <p className="text-[clamp(14px,1.3vw,21px)] font-semibold text-cream">“{e.question}”</p>
                <p className="mt-[0.4vh] text-[clamp(13px,1.15vw,18px)] leading-snug text-soft">
                  {e.answer || "…thinking"}
                </p>
                {e.refused && (
                  <p className="mt-[0.4vh] text-[clamp(11px,0.95vw,15px)] font-bold uppercase tracking-widest text-gold-bright">
                    honest refusal ✓
                  </p>
                )}
              </div>
            ))}
            {snap.engineOnline && (snap.stumpFeed ?? []).length === 0 && (
              <p className="text-[clamp(15px,1.4vw,22px)] text-faint">Phones are loaded. First question incoming…</p>
            )}
          </div>
        )}

        {/* ——— leaderboard ——— */}
        {slide.kind === "leaderboard" && (
          <div className="rise d2 mt-[3vh] w-full max-w-[60ch]">
            {(snap.scoreboard ?? []).length === 0 ? (
              <p className="text-[clamp(15px,1.4vw,22px)] text-faint">
                The board is empty — post your ring score from your phone. Three letters, one number.
              </p>
            ) : (
              <div className="flex flex-col gap-[1vh]">
                {(snap.scoreboard ?? []).map((r, i) => (
                  <div
                    key={r.initials + i}
                    className="bar-row flex items-baseline justify-between rounded-xl border border-rule bg-sheet-2 px-[1.4vw] py-[1vh]"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="font-[family-name:var(--font-display)] text-[clamp(20px,2.2vw,36px)] font-bold text-cream">
                      {i === 0 ? "👑 " : `${i + 1}. `}
                      <span className="tracking-[0.3em]">{r.initials}</span>
                    </span>
                    <span className="text-[clamp(18px,2vw,32px)] font-bold text-gold-bright">
                      {r.best}/10 <span className="text-[clamp(11px,1vw,15px)] font-semibold text-faint">· {r.rounds} rounds</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
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
}: {
  values: { value: number; n: number }[];
  minK: number;
  maxK: number;
  soldK: number | null;
  soldLabel: string;
  anchorK: number | null;
  anchorLabel: string;
  source?: string;
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
      {source && (
        <p className="mt-[1.5vh] text-[clamp(11px,0.95vw,15px)] text-faint">Source: {source}</p>
      )}
    </div>
  );
}
