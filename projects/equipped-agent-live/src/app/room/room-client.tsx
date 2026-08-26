"use client";

// The attendee's whole night. Every slide MIRRORS the projector — eyebrow,
// heading, stats, lines — so a phone or a laptop anywhere in the world rides
// along. On top of the mirror, the games take over when they open:
//   jersey gate   → pick initials + emoji once; the whole night wears it
//   poll open     → big buttons (+10 on THE BOARD)   revealed → bars + you
//   price open    → the slider     revealed → YOUR result card (rank, machine)
//   build slide   → deploy YOUR real assistant; QR + lead inbox come back
//   duel slide    → attack a rival's real assistant; refusals pay its builder
//   leaderboard   → THE BOARD + post your ring score
//   ladder reveal → name + cell → Mike's phone, then make-it-official email
// Phones poll every 1.5s. A dropped request just means the next one catches up.

import { useCallback, useEffect, useRef, useState } from "react";
import { signupMailto } from "@/lib/signup";
import { BuildScreen } from "./build-screen";
import { DuelScreen } from "./duel-screen";

interface BoardRow {
  initials: string;
  emoji: string;
  points: number;
  me: boolean;
}

interface StatePayload {
  ok: boolean;
  step: number;
  total: number;
  slide: {
    id: string;
    kind: string;
    eyebrow: string | null;
    heading: string;
    lines: string[] | null;
    stats: { value: string; label: string }[] | null;
    quote: string | null;
    poll: { key: string; question: string; options: string[]; capture: boolean } | null;
    price: { key: string; facts: string[]; minK: number; maxK: number; stepK: number } | null;
  };
  pollState: "closed" | "open" | "revealed";
  me: { initials: string; emoji: string } | null;
  myVote: number | null;
  counts: number[] | null;
  priceReveal: {
    values: { value: number; n: number }[];
    soldK: number | null;
    soldLabel: string;
    anchorK: number | null;
    anchorLabel: string;
    source: string | null;
    aiGuess: { guessK: number; reasoning: string } | null;
    myRank: number | null;
    guessers: number;
  } | null;
  duelStats: { fired: number; held: number; flagged: number; built: number } | null;
  board: { top: BoardRow[]; myPoints: number; myRank: number | null } | null;
  engineOnline: boolean;
}

const fmtK = (k: number) => `$${k.toLocaleString()}K`;

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not every phone hums. Fine.
  }
}

const CONFETTI_COLORS = ["#d9ae64", "#d0a050", "#f2efe7", "#7d9b76", "#b46a55"];

function Confetti() {
  return (
    <div className="confetti-stage" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: `${(i * 137) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 12) * 0.09}s`,
            transform: `rotate(${(i * 47) % 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

const JERSEY_EMOJI = ["🦈", "🔥", "👑", "🚀", "🌊", "⚡", "🏆", "🍀", "🌴", "💎", "🐎", "🎯"];

export function RoomClient() {
  const [state, setState] = useState<StatePayload | null>(null);
  const [lost, setLost] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [party, setParty] = useState(0);
  const voteInFlight = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }, []);

  const celebrate = useCallback(() => setParty((n) => n + 1), []);

  async function castVote(pollKey: string, choice: number, firstTime: boolean) {
    if (voteInFlight.current) return;
    voteInFlight.current = true;
    setState((s) => (s ? { ...s, myVote: choice } : s));
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollKey, choice }),
      });
      if (firstTime) {
        buzz(30);
        showToast("+10 on THE BOARD");
      }
    } catch {
      // The next tick restores the truth.
    }
    voteInFlight.current = false;
    void tick();
  }

  if (!state) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-soft">Joining the room…</p>
      </main>
    );
  }

  const { slide, pollState } = state;

  // Suit up once — everything after wears the jersey.
  if (!state.me) {
    return <JerseyScreen onDone={() => void tick()} />;
  }

  const gameOn =
    (slide.poll && pollState !== "closed") ||
    (slide.price && pollState !== "closed") ||
    slide.kind === "build" ||
    slide.kind === "duel" ||
    slide.kind === "leaderboard";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-5">
      {party > 0 && <Confetti key={party} />}
      <header className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
          The Equipped Agent
        </span>
        <span className="flex items-center gap-2">
          {lost && <span className="text-[10px] font-semibold text-clay">reconnecting…</span>}
          <span className="rounded-full border border-rule bg-sheet-2 px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] text-cream">
            {state.me.emoji} {state.me.initials}
          </span>
        </span>
      </header>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center">
          <span className="toast-pts rounded-full border border-gold bg-sheet-2 px-4 py-2 text-sm font-bold text-gold-bright shadow-lg">
            {toast}
          </span>
        </div>
      )}

      {slide.poll && pollState !== "closed" ? (
        <PollScreen state={state} onVote={castVote} onRefresh={() => void tick()} />
      ) : slide.price && pollState !== "closed" ? (
        <PriceScreen state={state} onVote={castVote} onPodium={celebrate} />
      ) : slide.kind === "build" ? (
        <BuildScreen
          onBuilt={() => {
            showToast("+25 · it's LIVE");
            celebrate();
            void tick();
          }}
        />
      ) : slide.kind === "duel" ? (
        <DuelScreen
          engineOnline={state.engineOnline}
          stats={state.duelStats}
          onFired={(refused) => {
            buzz(25);
            showToast(refused ? "It held \u2014 +15 to the builder" : "+10 fired");
          }}
        />
      ) : slide.kind === "leaderboard" ? (
        <BoardScreen state={state} onPosted={() => { showToast("Ring score on THE BOARD"); void tick(); }} />
      ) : (
        <MirrorScreen state={state} />
      )}

      {!gameOn && slide.kind !== "title" && (
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-faint">
          live · slide {state.step + 1}/{state.total} · your phone fires when it&apos;s game time
        </p>
      )}
    </main>
  );
}

// ------------------------------------------------------------ jersey gate

function JerseyScreen({ onDone }: { onDone: () => void }) {
  const [initials, setInitials] = useState("");
  const [emoji, setEmoji] = useState<string>("🦈");
  const [busy, setBusy] = useState(false);

  async function suitUp() {
    if (busy || initials.length < 2) return;
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initials, emoji }),
      });
      if (res.ok) {
        buzz([20, 40, 20]);
        onDone();
        return;
      }
    } catch {
      // tap again
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">You&apos;re in · suit up</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-cream">
        Pick your jersey.
      </h1>
      <p className="mt-2 text-sm text-soft">
        Tonight is a game — polls, a pricing showdown, a machine to stump, a board to climb. Everything you do scores
        under these three letters.
      </p>
      <input
        value={initials}
        onChange={(e) => setInitials(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase())}
        placeholder="ABC"
        aria-label="Your initials"
        maxLength={3}
        autoFocus
        className="mt-6 w-full rounded-2xl border border-rule bg-sheet-2 px-4 py-4 text-center text-4xl font-bold tracking-[0.5em] text-cream placeholder:text-2xl placeholder:tracking-[0.3em] placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <div className="mt-4 grid grid-cols-6 gap-2">
        {JERSEY_EMOJI.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            aria-label={`Pick ${e}`}
            className={`rounded-xl border py-3 text-2xl transition-transform ${
              emoji === e ? "scale-110 border-gold bg-sheet-2" : "border-rule bg-sheet-2/50"
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <button
        onClick={() => void suitUp()}
        disabled={busy || initials.length < 2}
        className="mt-6 rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet disabled:opacity-40"
      >
        {busy ? "…" : `Play as ${emoji} ${initials || "———"}`}
      </button>
      <p className="mt-3 text-center text-[11px] text-faint">Two or three letters. The crown is decided tonight.</p>
    </main>
  );
}

// ------------------------------------------------------------ the mirror

function MirrorScreen({ state }: { state: StatePayload }) {
  const { slide } = state;
  return (
    <section key={slide.id} className="mt-8 flex flex-1 flex-col">
      {slide.eyebrow && (
        <p className="pop-in text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{slide.eyebrow}</p>
      )}
      <h1 className="pop-in pop-d1 mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-cream">
        {slide.heading}
      </h1>

      {slide.stats && (
        <div className="pop-in pop-d2 mt-6 grid grid-cols-2 gap-3">
          {slide.stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-rule bg-sheet-2 p-4">
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-gold-bright">{s.value}</p>
              <p className="mt-1 text-[11px] leading-snug text-soft">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {slide.lines && (
        <div className="pop-in pop-d2 mt-5 flex flex-col gap-2.5">
          {slide.lines.map((l) => (
            <p key={l} className="text-[15px] leading-relaxed text-soft">
              {l}
            </p>
          ))}
        </div>
      )}

      {slide.quote && (
        <blockquote className="pop-in pop-d3 mt-6 border-l-2 border-gold pl-4 font-[family-name:var(--font-display)] text-lg italic leading-snug text-cream">
          “{slide.quote}”
        </blockquote>
      )}

      {/* A game slide that hasn't been opened yet says so — armed, not dead. */}
      {(slide.poll || slide.price) && (
        <div className="pop-in pop-d3 mt-6 rounded-2xl border border-gold/50 bg-sheet-2 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-gold-bright">
            <span className="ring-pulse inline-block h-2.5 w-2.5 rounded-full bg-moss" />
            {slide.price ? "Game armed — sliders drop any second." : "Poll armed — buttons drop any second."}
          </p>
          {slide.price && (
            <ul className="mt-2 flex flex-col gap-1 text-[13px] text-soft">
              {slide.price.facts.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-faint">
            The host opens the floor from the console — this phone fires the moment it happens.
            {slide.poll ? " 🔒 Voting is anonymous." : " Closest three take 100 · 50 · 25."}
          </p>
        </div>
      )}

      {slide.kind === "close" && state.board && state.board.top.length > 0 && (
        <div className="pop-in pop-d3 mt-6 rounded-2xl border border-gold/50 bg-sheet-2 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Final board</p>
          {state.board.top.slice(0, 3).map((r, i) => (
            <p key={r.initials + i} className={`mt-2 text-sm font-semibold ${r.me ? "text-gold-bright" : "text-cream"}`}>
              {["👑", "🥈", "🥉"][i]} {r.emoji} {r.initials} — {r.points} pts{r.me ? " · you" : ""}
            </p>
          ))}
          {state.board.myRank !== null && state.board.myRank > 3 && (
            <p className="mt-2 text-sm text-soft">
              You: #{state.board.myRank} · {state.board.myPoints} pts — screenshot it, run it back next class.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ polls

function PollScreen({
  state,
  onVote,
  onRefresh,
}: {
  state: StatePayload;
  onVote: (pollKey: string, choice: number, firstTime: boolean) => Promise<void>;
  onRefresh: () => void;
}) {
  const poll = state.slide.poll!;
  const { pollState, myVote, counts } = state;
  const total = counts?.reduce((a, b) => a + b, 0) ?? 0;
  const winner = counts ? counts.indexOf(Math.max(...counts)) : -1;

  const [leadSent, setLeadSent] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadCell, setLeadCell] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);

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
    onRefresh();
  }

  return (
    <section className="mt-8 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        {pollState === "open" ? "Vote now — it counts on THE BOARD" : "The room has spoken"}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        {poll.question}
      </h1>

      {pollState === "open" && (
        <div className="mt-6 flex flex-col gap-3">
          {poll.options.map((opt, i) => {
            const n = counts?.[i] ?? 0;
            const pct = myVote !== null && total ? Math.round((n / total) * 100) : null;
            return (
              <button
                key={opt}
                onClick={() => void onVote(poll.key, i, myVote === null)}
                className={`relative overflow-hidden rounded-2xl border px-5 py-4 text-left transition-colors ${
                  myVote === i ? "border-gold" : "border-rule active:border-gold-bright"
                } bg-sheet-2`}
              >
                {/* Live fill: the room's percentage climbs behind the label
                    once you've cast — the game-show bar, on your phone. */}
                {pct !== null && (
                  <span
                    className={`absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${
                      myVote === i ? "bg-gold/30" : "bg-gold/10"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <span className="relative flex items-baseline justify-between gap-3">
                  <span className={`text-[15px] font-semibold ${myVote === i ? "text-gold-bright" : "text-cream"}`}>
                    {opt}
                    {myVote === i ? " · you" : ""}
                  </span>
                  {pct !== null && <span className="text-sm font-bold text-soft">{pct}%</span>}
                </span>
              </button>
            );
          })}
          <p className="mt-2 text-center text-xs text-faint">
            {myVote !== null
              ? `${total} in — watch the room move. You can change your pick until the reveal.`
              : "Tap one to see the room live."}
          </p>
          <p className="text-center text-[11px] text-faint">🔒 Voting is anonymous — your pick is yours alone.</p>
        </div>
      )}

      {pollState === "revealed" && counts && (
        <div className="mt-6 flex flex-col gap-3">
          {poll.options.map((opt, i) => {
            const n = counts[i] ?? 0;
            const pct = total ? Math.round((n / total) * 100) : 0;
            const mine = myVote === i;
            return (
              <div
                key={opt}
                className={`rounded-2xl border px-4 py-3 ${i === winner ? "border-gold/70 bg-sheet-2" : "border-rule bg-sheet-2"}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-sm font-semibold ${mine ? "text-gold-bright" : "text-cream"}`}>
                    {i === winner ? "👑 " : ""}
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

          {poll.capture && myVote !== null && !leadSent && (
            <div className="mt-4 rounded-2xl border border-gold/50 bg-sheet-2 p-4">
              <p className="text-sm font-semibold text-cream">Put a name on it and it happens today.</p>
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
            <div className="mt-3 rounded-2xl border border-moss/50 bg-sheet-2 p-4 text-center">
              <p className="text-sm font-semibold text-moss">Got it. Watch your phone — the first reply is the demo.</p>
              <a
                href={signupMailto({
                  name: leadName.trim(),
                  cell: leadCell.trim(),
                  rung: myVote !== null ? poll.options[myVote] : "",
                  source: "ladder",
                })}
                className="mt-3 block rounded-xl bg-gold px-4 py-3 text-sm font-bold text-sheet"
              >
                ✉️ Make it official — email Mike (one tap)
              </a>
              <p className="mt-2 text-[11px] text-faint">Opens pre-written. Your send button is the signature.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------- price game

function PriceScreen({
  state,
  onVote,
  onPodium,
}: {
  state: StatePayload;
  onVote: (pollKey: string, choice: number, firstTime: boolean) => Promise<void>;
  onPodium: () => void;
}) {
  const price = state.slide.price!;
  const reveal = state.priceReveal;
  const mid = Math.round((price.minK + price.maxK) / 2 / price.stepK) * price.stepK;
  const [guess, setGuess] = useState<number>(state.myVote ?? mid);
  const [locked, setLocked] = useState(state.myVote !== null);
  const celebrated = useRef(false);

  const podium = reveal?.myRank !== null && reveal !== null && reveal.myRank <= 3;
  useEffect(() => {
    if (state.pollState === "revealed" && podium && !celebrated.current) {
      celebrated.current = true;
      buzz([40, 60, 40, 60, 120]);
      onPodium();
    }
  }, [state.pollState, podium, onPodium]);

  if (state.pollState === "revealed") {
    const mine = state.myVote;
    const sold = reveal?.soldK ?? null;
    const target = sold ?? reveal?.anchorK ?? null;
    const medal = reveal?.myRank === 1 ? "🥇" : reveal?.myRank === 2 ? "🥈" : reveal?.myRank === 3 ? "🥉" : null;
    return (
      <section className="mt-6 flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">The reveal</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight">
          {sold !== null ? reveal!.soldLabel : "The room vs. the arithmetic"}
        </h1>
        {sold !== null && (
          <p className="pop-in mt-2 font-[family-name:var(--font-display)] text-6xl font-bold text-gold-bright">
            {fmtK(sold)}
          </p>
        )}

        {/* THE CARD — the one they screenshot. */}
        {mine !== null && target !== null && (
          <div className="result-card pop-in pop-d1 mt-5 rounded-3xl bg-sheet-2 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
              The Equipped Agent · pricing showdown
            </p>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-soft">
                {state.me?.emoji} {state.me?.initials} called it
              </span>
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-cream">{fmtK(mine)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm text-soft">{Math.abs(mine - target) <= price.stepK ? "Dead on" : "Off by"}</span>
              <span className="text-xl font-bold text-gold-bright">
                {Math.abs(mine - target) <= price.stepK ? "🎯" : fmtK(Math.abs(mine - target))}
              </span>
            </div>
            {reveal?.myRank !== null && (
              <div className="mt-3 rounded-2xl border border-gold/40 bg-sheet px-4 py-3 text-center">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-gold-bright">
                  {medal ? `${medal} ` : ""}#{reveal!.myRank} of {reveal!.guessers}
                </p>
                <p className="mt-0.5 text-[11px] text-faint">
                  {medal ? `podium — +${[100, 50, 25][reveal!.myRank - 1]} on THE BOARD` : "in the room tonight"}
                </p>
              </div>
            )}
          </div>
        )}

        {reveal?.aiGuess && (
          <div className="pop-in pop-d2 mt-4 rounded-2xl border border-rule bg-sheet-2 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay">🤖 The machine called</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-cream">
              {fmtK(reveal.aiGuess.guessK)}
              {target !== null && (
                <span className="ml-2 text-sm font-semibold text-soft">
                  (off by {fmtK(Math.abs(reveal.aiGuess.guessK - target))})
                </span>
              )}
            </p>
            <p className="mt-1 text-xs italic text-soft">“{reveal.aiGuess.reasoning}”</p>
          </div>
        )}

        {reveal?.anchorK != null && sold !== null && (
          <p className="pop-in pop-d3 mt-4 rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-sm text-soft">
            {reveal.anchorLabel}: <b className="text-cream">{fmtK(reveal.anchorK)}</b> —{" "}
            <b className="text-gold-bright">{fmtK(Math.abs(sold - reveal.anchorK))}</b> apart. The record beats the
            arithmetic.
          </p>
        )}
        {reveal?.source && <p className="mt-3 text-[10px] text-faint">{reveal.source}</p>}
      </section>
    );
  }

  return (
    <section className="mt-8 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        Game one — the machine already locked its call
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        What does it actually close at?
      </h1>
      <ul className="mt-4 flex flex-col gap-1 text-sm text-soft">
        {price.facts.map((f) => (
          <li key={f}>· {f}</li>
        ))}
      </ul>
      <p className="mt-8 text-center font-[family-name:var(--font-display)] text-6xl font-bold text-gold-bright">
        {fmtK(guess)}
      </p>
      <input
        type="range"
        min={price.minK}
        max={price.maxK}
        step={price.stepK}
        value={guess}
        onChange={(e) => {
          setGuess(Number(e.target.value));
          setLocked(false);
        }}
        aria-label="Your price guess"
        className="mt-4 w-full accent-[#d0a050]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-faint">
        <span>{fmtK(price.minK)}</span>
        <span>{fmtK(price.maxK)}</span>
      </div>
      <button
        onClick={() => {
          void onVote(price.key, guess, state.myVote === null);
          setLocked(true);
        }}
        disabled={locked}
        className="mt-5 rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet disabled:opacity-50"
      >
        {locked ? `Locked: ${fmtK(guess)} — slide to change` : "Lock it in"}
      </button>
      <p className="mt-2 text-center text-[11px] text-faint">Closest three take 100 · 50 · 25 on THE BOARD.</p>
    </section>
  );
}

// ---------------------------------------------------------- THE BOARD + the ring

function BoardScreen({ state, onPosted }: { state: StatePayload; onPosted: () => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const board = state.board;

  async function post() {
    if (busy || score === null) return;
    setBusy(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initials: state.me?.initials ?? "", score }),
      });
      if (res.ok) {
        setSent(true);
        buzz([30, 50, 30]);
        onPosted();
      }
    } catch {
      // tap again
    }
    setBusy(false);
  }

  return (
    <section className="mt-6 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">THE BOARD · whole-night standings</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        Somebody&apos;s leaving with the crown.
      </h1>

      {board && board.myRank !== null && (
        <div className="result-card pop-in mt-4 rounded-3xl bg-sheet-2 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Your night so far</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold text-gold-bright">
            #{board.myRank} <span className="text-2xl text-cream">· {board.myPoints} pts</span>
          </p>
          <p className="mt-1 text-[11px] text-faint">
            {state.me?.emoji} {state.me?.initials} · The Equipped Agent
          </p>
        </div>
      )}

      {board && board.top.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          {board.top.map((r, i) => (
            <div
              key={r.initials + i}
              className={`flex items-baseline justify-between rounded-xl border px-4 py-2 ${
                r.me ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2/60"
              }`}
            >
              <span className={`text-sm font-bold ${r.me ? "text-gold-bright" : "text-cream"}`}>
                {i === 0 ? "👑" : `${i + 1}.`} {r.emoji} <span className="tracking-[0.25em]">{r.initials}</span>
                {r.me ? " · you" : ""}
              </span>
              <span className="text-sm font-bold text-soft">{r.points}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-rule bg-sheet-2 p-4">
        <p className="text-sm font-semibold text-cream">
          Final move: your ring score — best round × 10 goes on the board.
        </p>
        <p className="mt-1 text-xs text-soft">
          From YOUR assistant (say <b className="text-cream">spar</b>). On your honor — it&apos;s a lunch table, not the
          SEC.
        </p>
        {sent ? (
          <p className="mt-3 rounded-xl border border-moss/50 bg-sheet px-4 py-3 text-center text-sm font-semibold text-moss">
            Counted. Watch the standings move. 👑
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i + 1)}
                  className={`rounded-xl border py-2.5 text-lg font-bold ${
                    score === i + 1 ? "border-gold bg-gold text-sheet" : "border-rule bg-sheet text-cream"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => void post()}
              disabled={busy || score === null}
              className="mt-3 w-full rounded-xl bg-gold px-4 py-3 font-bold text-sheet disabled:opacity-40"
            >
              {busy ? "Posting…" : `Post ${score !== null ? `${score}/10` : "my round"} as ${state.me?.emoji} ${state.me?.initials}`}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
