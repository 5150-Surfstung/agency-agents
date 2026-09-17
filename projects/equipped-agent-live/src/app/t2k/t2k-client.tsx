"use client";

// TRACK TO KEYS. Two dates and six terms in; the whole chain out, twice —
// once the way an agent needs to see it (what needs a human TODAY, worst
// first) and once the way a client should hear it (a porch light, not a
// password).
//
// The deal lives in the URL. That is the feature: the link you copy IS the
// deal, so it demos from the stage, texts to a client, and still works
// tomorrow morning on a real file with nothing installed and no login.

import { useEffect, useMemo, useState } from "react";
import {
  attentionQueue, buildChain, DEFAULT_DEAL, fmtDay, prettyDate, toQuery,
  type DealInput, type Milestone, type Urgency,
} from "@/lib/t2k";

const TONE: Record<Urgency, { ring: string; text: string; chip: string; word: string }> = {
  past: { ring: "border-clay/70", text: "text-clay", chip: "bg-clay/15 text-clay", word: "behind" },
  today: { ring: "border-gold", text: "text-gold-bright", chip: "bg-gold/20 text-gold-bright", word: "today" },
  soon: { ring: "border-gold/60", text: "text-gold", chip: "bg-gold/10 text-gold", word: "this week" },
  ahead: { ring: "border-rule", text: "text-soft", chip: "bg-sheet text-faint", word: "ahead" },
};

const TERMS: { field: keyof DealInput; label: string; hint: string }[] = [
  { field: "emDays", label: "Earnest money", hint: "days after binding" },
  { field: "loanAppDays", label: "Loan application", hint: "days after binding" },
  { field: "ddDays", label: "Due diligence", hint: "days after binding" },
  { field: "apprDays", label: "Appraisal ordered", hint: "days after binding" },
  { field: "commitDays", label: "Loan commitment", hint: "days after binding" },
  { field: "insuranceDaysBefore", label: "Insurance binder", hint: "days BEFORE closing" },
  { field: "walkDaysBefore", label: "Walk-through", hint: "days BEFORE closing" },
];

export function T2kClient({ initial }: { initial: DealInput }) {
  const [deal, setDeal] = useState<DealInput>(initial);
  const [view, setView] = useState<"agent" | "client">("agent");
  const [openTerms, setOpenTerms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const chain = useMemo(() => buildChain(deal), [deal]);
  const queue = useMemo(() => attentionQueue(chain), [chain]);
  const next = queue.find((m) => m.urgency !== "past") ?? queue[0] ?? null;
  const ready = Boolean(deal.binding && deal.closing && chain.milestones.length);

  // Keep the address bar in step with the form, so the link is always current.
  useEffect(() => {
    if (!ready) return;
    const q = toQuery(deal);
    window.history.replaceState(null, "", `/t2k?${q}`);
  }, [deal, ready]);

  function set<K extends keyof DealInput>(k: K, v: DealInput[K]) {
    setDeal((d) => ({ ...d, [k]: v }));
    setCopied(false);
  }

  /** A deal shaped like a real one, anchored to today so it is never stale. */
  function loadSample() {
    const today = new Date();
    const back = new Date(today); back.setDate(back.getDate() - 7);
    const fwd = new Date(today); fwd.setDate(fwd.getDate() + 37);
    setDeal({ ...DEFAULT_DEAL, address: "214 Demo Oak Ln, Johns Island SC", binding: fmtDay(back), closing: fmtDay(fwd) });
    setCopied(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8 sm:px-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          The Equipped Agent · a working tool, not a slide
        </p>
        <h1 className="mt-2 display text-4xl font-extrabold text-cream sm:text-5xl">
          Track to Keys
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-soft">
          Two dates and the terms you actually agreed to. Out comes the whole chain — with what each
          date costs if it slips, a queue of what needs you today, and a version you can send your
          client that reads like a person wrote it.
        </p>
      </header>

      {/* ---- the deal ---- */}
      <section className="mt-6 rounded-3xl border border-rule bg-sheet-2 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Property (optional)" className="sm:col-span-3">
            <input
              value={deal.address}
              onChange={(e) => set("address", e.target.value.slice(0, 80))}
              placeholder="214 Demo Oak Ln, Johns Island SC"
              className="w-full rounded-xl border border-rule bg-sheet px-3 py-2.5 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
            />
          </Field>
          <Field label="Binding agreement">
            <input
              type="date" value={deal.binding} onChange={(e) => set("binding", e.target.value)}
              className="w-full rounded-xl border border-rule bg-sheet px-3 py-2.5 text-[15px] text-cream focus:border-gold focus:outline-none"
            />
          </Field>
          <Field label="Closing">
            <input
              type="date" value={deal.closing} onChange={(e) => set("closing", e.target.value)}
              className="w-full rounded-xl border border-rule bg-sheet px-3 py-2.5 text-[15px] text-cream focus:border-gold focus:outline-none"
            />
          </Field>
          <div className="flex items-end">
            <button
              onClick={loadSample}
              className="w-full rounded-xl border border-gold/60 bg-sheet px-3 py-2.5 text-sm font-bold text-gold hover:bg-gold hover:text-sheet"
            >
              Load a sample deal
            </button>
          </div>
        </div>

        <button
          onClick={() => setOpenTerms((v) => !v)}
          className="mt-4 text-xs font-bold uppercase tracking-wider text-faint hover:text-gold"
        >
          {openTerms ? "▾" : "▸"} adjust the terms — these are common lengths, not required ones
        </button>
        {openTerms && (
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {TERMS.map((t) => (
              <Field key={String(t.field)} label={t.label} hint={t.hint}>
                <input
                  type="number" min={0} max={365}
                  value={String(deal[t.field])}
                  onChange={(e) => set(t.field, Math.max(0, Math.min(365, Number(e.target.value) || 0)) as never)}
                  className="w-full rounded-xl border border-rule bg-sheet px-3 py-2 text-[15px] text-cream focus:border-gold focus:outline-none"
                />
              </Field>
            ))}
          </div>
        )}
      </section>

      {!ready && (
        <p className="mt-6 rounded-2xl border border-rule bg-sheet-2 p-5 text-center text-sm text-faint">
          Put in a binding date and a closing date — or tap <span className="font-bold text-gold">Load a sample deal</span>{" "}
          to watch the whole chain build itself.
        </p>
      )}

      {ready && (
        <>
          {/* ---- the headline: what's next, and how long the promise is ---- */}
          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-gold/50 bg-sheet-2 p-5 sm:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Next up</p>
              {next ? (
                <>
                  <p className="mt-1 display text-3xl font-extrabold text-cream">
                    {next.label}
                  </p>
                  <p className={`mt-1 text-sm font-bold ${TONE[next.urgency].text}`}>
                    {prettyDate(next.date)} ·{" "}
                    {next.daysOut === 0 ? "today" : next.daysOut > 0 ? `in ${next.daysOut} days` : `${-next.daysOut} days ago`}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-soft">{next.stake}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-soft">Everything on the chain is behind you.</p>
              )}
            </div>
            <div className="rounded-3xl border border-rule bg-sheet-2 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Under contract</p>
              <p className="mt-1 display text-5xl font-extrabold text-cream">
                {chain.span}
              </p>
              <p className="text-sm text-soft">days, binding to keys</p>
              <p className="mt-2 text-xs text-faint">
                {queue.filter((m) => m.urgency === "past").length} behind ·{" "}
                {queue.filter((m) => m.urgency === "soon" || m.urgency === "today").length} inside a week
              </p>
            </div>
          </section>

          {chain.problems.length > 0 && (
            <ul className="mt-4 space-y-1.5 rounded-2xl border border-clay/50 bg-sheet-2 p-4">
              {chain.problems.map((p, i) => (
                <li key={i} className="text-sm text-clay">⚠ {p}</li>
              ))}
            </ul>
          )}

          {/* ---- two ways to read the same chain ---- */}
          <div className="mt-7 flex items-center gap-2">
            <Tab on={view === "agent"} onClick={() => setView("agent")}>Agent view</Tab>
            <Tab on={view === "client"} onClick={() => setView("client")}>Client view</Tab>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => void copyLink()}
                className="rounded-full border border-rule px-4 py-2 text-xs font-bold text-soft hover:border-gold hover:text-gold"
              >
                {copied ? "link copied ✓" : "Copy link"}
              </button>
              <button
                onClick={() => setShowQr((v) => !v)}
                className="rounded-full border border-rule px-4 py-2 text-xs font-bold text-soft hover:border-gold hover:text-gold"
              >
                QR
              </button>
            </div>
          </div>

          {showQr && (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-gold/40 bg-sheet-2 p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr?u=${encodeURIComponent(`/t2k?${toQuery(deal)}`)}`}
                alt="QR code for this deal"
                className="w-56 rounded-xl"
              />
              <p className="text-xs text-faint">point a phone at it — the whole deal is in the link</p>
            </div>
          )}

          {view === "agent" ? (
            <section className="mt-4">
              <p className="mb-3 text-sm text-faint">
                Worst first. This is the order to work the file in, not the order the contract lists.
              </p>
              <ul className="space-y-2">
                {queue.map((m, i) => <AgentRow key={m.key} m={m} i={i} />)}
              </ul>
            </section>
          ) : (
            <ClientView deal={deal} milestones={chain.milestones} />
          )}

          <p className="mt-8 rounded-2xl border border-rule bg-sheet-2 p-4 text-xs leading-relaxed text-faint">
            <span className="font-bold text-soft">Your executed contract governs.</span> These are calendar
            dates produced from the terms you typed — not legal advice, and not a substitute for reading the
            contract. Check every date against the signed document, and confirm how your form counts weekends
            and holidays.
          </p>
        </>
      )}
    </main>
  );
}

function Field({
  label, hint, children, className = "",
}: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-faint">{label}</span>
      {hint && <span className="ml-1.5 text-[11px] text-faint/70">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold ${
        on ? "bg-gold text-sheet" : "border border-rule text-soft hover:border-gold hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

function AgentRow({ m, i }: { m: Milestone; i: number }) {
  const tone = TONE[m.urgency];
  return (
    <li
      className={`pop-in rounded-2xl border bg-sheet-2 p-4 ${tone.ring}`}
      style={{ animationDelay: `${Math.min(i, 8) * 0.045}s` }}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="display text-xl font-extrabold text-cream">{m.label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.chip}`}>
          {tone.word}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">{m.who}</span>
        <span className={`ml-auto text-sm font-bold ${tone.text}`}>
          {prettyDate(m.date)}
          <span className="ml-2 text-xs font-semibold text-faint">
            {m.daysOut === 0 ? "today" : m.daysOut > 0 ? `+${m.daysOut}d` : `${m.daysOut}d`}
          </span>
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-soft">{m.stake}</p>
      {m.weekend && (
        <p className="mt-1 text-[11px] font-semibold text-gold">lands on a weekend — check how your contract counts it</p>
      )}
    </li>
  );
}

/** The porch light. No jargon, no stakes language, no countdown anxiety —
 *  just what is happening, in order, in a voice a buyer can read at night. */
function ClientView({ deal, milestones }: { deal: DealInput; milestones: Milestone[] }) {
  return (
    <section className="mt-4 rounded-3xl border border-rule bg-sheet-2 p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Your home, step by step</p>
      {deal.address && (
        <h2 className="mt-1 display text-2xl font-extrabold text-cream">
          {deal.address}
        </h2>
      )}
      <ol className="mt-5 space-y-0">
        {milestones.map((m, i) => (
          <li key={m.key} className="relative flex gap-4 pb-6 last:pb-0">
            {i < milestones.length - 1 && (
              <span className="absolute left-[7px] top-4 h-full w-px bg-rule" aria-hidden />
            )}
            <span
              className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                m.urgency === "past" ? "border-moss bg-moss" : "border-gold bg-sheet-2"
              }`}
              aria-hidden
            />
            <div className="pop-in min-w-0" style={{ animationDelay: `${Math.min(i, 9) * 0.05}s` }}>
              <p className="text-sm font-bold text-gold-bright">{prettyDate(m.date)}</p>
              <p className="display text-lg font-extrabold text-cream">{m.label}</p>
              <p className="mt-0.5 text-[15px] leading-relaxed text-soft">{m.client}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-rule pt-4 text-xs text-faint">
        Dates can move — if one does, you&apos;ll hear it from your agent before you read it here.
      </p>
    </section>
  );
}
