"use client";

// The attendee's whole night, one state machine driven by /api/state:
//   poll open      → four big buttons        poll revealed → the same bars
//   price open     → the guess slider        price revealed → you vs. the room vs. the closing
//   stump slide    → interrogate the fact sheet
//   seed slide     → copy the seed, build on YOUR Claude
//   leaderboard    → post your ring score
//   ladder reveal  → name + cell → Mike's phone, then make-it-official email
//   anything else  → eyes up front
// Phones poll every 1.5s. A dropped request just means the next one catches up.

import { useCallback, useEffect, useRef, useState } from "react";
import { signupMailto } from "@/lib/signup";
import { SeedScreen } from "./seed-screen";

interface StatePayload {
  ok: boolean;
  step: number;
  slide: {
    id: string;
    kind: string;
    eyebrow: string | null;
    heading: string;
    poll: { key: string; question: string; options: string[]; capture: boolean } | null;
    price: { key: string; facts: string[]; minK: number; maxK: number; stepK: number } | null;
  };
  pollState: "closed" | "open" | "revealed";
  myVote: number | null;
  counts: number[] | null;
  priceReveal: {
    values: { value: number; n: number }[];
    soldK: number | null;
    soldLabel: string;
    anchorK: number | null;
    anchorLabel: string;
  } | null;
  engineOnline: boolean;
}

const fmtK = (k: number) => `$${k.toLocaleString()}K`;

export function RoomClient() {
  const [state, setState] = useState<StatePayload | null>(null);
  const [lost, setLost] = useState(false);
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

  async function castVote(pollKey: string, choice: number) {
    if (voteInFlight.current) return;
    voteInFlight.current = true;
    setState((s) => (s ? { ...s, myVote: choice } : s));
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollKey, choice }),
      });
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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
          The Equipped Agent · The Claude Course
        </span>
        {lost && <span className="text-[10px] font-semibold text-clay">reconnecting…</span>}
      </header>

      {slide.poll && pollState !== "closed" ? (
        <PollScreen state={state} onVote={castVote} onRefresh={() => void tick()} />
      ) : slide.price && pollState !== "closed" ? (
        <PriceScreen state={state} onVote={castVote} />
      ) : slide.kind === "stump" ? (
        <StumpScreen engineOnline={state.engineOnline} />
      ) : slide.kind === "seed" ? (
        <SeedScreen />
      ) : slide.kind === "leaderboard" ? (
        <ScoreScreen />
      ) : (
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

// ------------------------------------------------------------------ polls

function PollScreen({
  state,
  onVote,
  onRefresh,
}: {
  state: StatePayload;
  onVote: (pollKey: string, choice: number) => Promise<void>;
  onRefresh: () => void;
}) {
  const poll = state.slide.poll!;
  const { pollState, myVote, counts } = state;
  const total = counts?.reduce((a, b) => a + b, 0) ?? 0;

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
              onClick={() => void onVote(poll.key, i)}
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
}: {
  state: StatePayload;
  onVote: (pollKey: string, choice: number) => Promise<void>;
}) {
  const price = state.slide.price!;
  const reveal = state.priceReveal;
  const mid = Math.round((price.minK + price.maxK) / 2 / price.stepK) * price.stepK;
  const [guess, setGuess] = useState<number>(state.myVote ?? mid);
  const [locked, setLocked] = useState(state.myVote !== null);

  if (state.pollState === "revealed") {
    const values = reveal?.values ?? [];
    const total = values.reduce((s, v) => s + v.n, 0);
    const mine = state.myVote;
    const sold = reveal?.soldK ?? null;
    return (
      <section className="mt-8 flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">The reveal</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
          {sold !== null ? "The record says" : "The room has guessed"}
        </h1>
        {sold !== null ? (
          <p className="mt-3 font-[family-name:var(--font-display)] text-6xl font-bold text-gold-bright">{fmtK(sold)}</p>
        ) : (
          <p className="mt-3 rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-sm text-soft">
            The answer loads on the big screen — eyes up front.
          </p>
        )}
        {mine !== null && (
          <p className="mt-4 text-lg text-cream">
            Your guess: <b className="text-gold-bright">{fmtK(mine)}</b>
            {sold !== null && (
              <span className="text-soft">
                {" "}
                — {Math.abs(mine - sold) <= price.stepK ? "dead on. Go buy a lottery ticket." : `off by ${fmtK(Math.abs(mine - sold))}`}
              </span>
            )}
          </p>
        )}
        <p className="mt-2 text-xs text-faint">{total} guesses in the room · full picture on the projector</p>
        {reveal?.anchorK != null && (
          <p className="mt-4 rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-sm text-soft">
            And {reveal.anchorLabel}: <b className="text-cream">{fmtK(reveal.anchorK)}</b>
            {sold !== null && (
              <span>
                {" "}
                — <b className="text-gold-bright">{fmtK(Math.abs(sold - reveal.anchorK))}</b> apart. The record beats
                the arithmetic.
              </span>
            )}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="mt-8 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Game one — price it</p>
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
          void onVote(price.key, guess);
          setLocked(true);
        }}
        disabled={locked}
        className="mt-5 rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet disabled:opacity-50"
      >
        {locked ? `Locked: ${fmtK(guess)} — slide to change` : "Lock it in"}
      </button>
    </section>
  );
}

// ------------------------------------------------------------------ stump

function StumpScreen({ engineOnline }: { engineOnline: boolean }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ q: string; a: string; refused: boolean }[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  async function ask() {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setNotice(null);
    setQ("");
    try {
      const res = await fetch("/api/stump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLog((l) => [{ q: question, a: data.answer, refused: data.refused }, ...l].slice(0, 5));
      } else {
        setNotice(
          data?.error === "offline"
            ? "The engine isn't switched on — this game needs the key."
            : data?.error === "not_stump_time"
              ? "The game's not open yet — eyes up front."
              : "Hiccup — try again."
        );
      }
    } catch {
      setNotice("Hiccup — try again.");
    }
    setBusy(false);
  }

  return (
    <section className="mt-6 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Game two — try to break it</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        Stump the assistant.
      </h1>
      <p className="mt-2 text-sm text-soft">
        It only knows the fact sheet on screen. Ask it something that isn't there — make it guess. It won't.
      </p>
      {!engineOnline && (
        <p className="mt-3 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">
          The engine isn't switched on tonight — watch the screen.
        </p>
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
          placeholder="What year was the roof replaced?"
          aria-label="Your question"
          className="w-full resize-none rounded-2xl border border-rule bg-sheet-2 px-4 py-3 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <button
          onClick={() => void ask()}
          disabled={busy || !q.trim()}
          className="shrink-0 rounded-2xl bg-gold px-4 py-3 text-sm font-bold text-sheet disabled:opacity-40"
        >
          {busy ? "…" : "Fire"}
        </button>
      </div>
      {notice && <p className="mt-2 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{notice}</p>}
      <div className="mt-4 flex flex-col gap-3">
        {log.map((e, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${e.refused ? "border-gold bg-sheet-2" : "border-rule bg-sheet-2"}`}>
            <p className="text-sm font-semibold text-cream">“{e.q}”</p>
            <p className="mt-1 text-sm text-soft">{e.a}</p>
            {e.refused && <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-gold-bright">honest refusal ✓ — that's the feature</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------ leaderboard

function ScoreScreen() {
  const [initials, setInitials] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function post() {
    if (busy || initials.trim().length < 2 || score === null) return;
    setBusy(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initials: initials.trim(), score }),
      });
      if (res.ok) setSent(true);
    } catch {
      // tap again
    }
    setBusy(false);
  }

  return (
    <section className="mt-8 flex flex-1 flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">The board</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        Post your best round.
      </h1>
      <p className="mt-2 text-sm text-soft">
        Your ring score from YOUR assistant (the seed's <b className="text-cream">spar</b> move). On your honor — it's
        a lunch table, not the SEC.
      </p>
      {sent ? (
        <p className="mt-6 rounded-2xl border border-moss/50 bg-sheet-2 p-4 text-center text-sm font-semibold text-moss">
          On the board. Eyes up front 👆
        </p>
      ) : (
        <>
          <input
            value={initials}
            onChange={(e) => setInitials(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase())}
            placeholder="Initials (3 letters)"
            aria-label="Initials"
            className="mt-5 w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-cream placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-faint focus:border-gold focus:outline-none"
          />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                onClick={() => setScore(i + 1)}
                className={`rounded-xl border py-3 text-lg font-bold ${
                  score === i + 1 ? "border-gold bg-gold text-sheet" : "border-rule bg-sheet-2 text-cream"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => void post()}
            disabled={busy || initials.length < 2 || score === null}
            className="mt-5 rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet disabled:opacity-40"
          >
            {busy ? "Posting…" : "Put me on the board"}
          </button>
        </>
      )}
    </section>
  );
}
