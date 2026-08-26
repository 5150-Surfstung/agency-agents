"use client";

// The tool arcade: two working AI tools on the attendee's phone.
// Honesty rules baked in: an offline engine says so (never a canned reply
// dressed as live), caps say so, and sparring scores render only when the
// model actually emitted one.

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; score?: number | null; coach?: string | null };

const ERRORS: Record<string, string> = {
  offline: "The arcade engine isn't switched on — grab your host.",
  device_cap: "You've hit tonight's message limit on this phone. The prompts in the toolkit run at home!",
  room_cap: "The room hit its spend cap for tonight — the toolkit has everything to run this at home.",
  arcade_locked: "The arcade unlocks later in the hour. Eyes up front 👆",
  error: "The engine hiccuped — try that again.",
};

function errorText(code: string): string {
  return ERRORS[code] ?? ERRORS.error;
}

export function Arcade({ engineOnline }: { engineOnline: boolean }) {
  const [tool, setTool] = useState<"menu" | "listing" | "sparring">("menu");

  return (
    <section className="mt-6 flex flex-1 flex-col">
      {tool === "menu" && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Your turn</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
            Build one right now.
          </h1>
          {!engineOnline && (
            <p className="mt-3 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">
              {errorText("offline")}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-4">
            <button
              onClick={() => setTool("listing")}
              className="rounded-2xl border border-rule bg-sheet-2 p-5 text-left active:border-gold"
            >
              <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-cream">
                Build your listing's assistant
              </p>
              <p className="mt-1 text-sm text-soft">
                Paste the facts from a listing you have right now. Ninety seconds later it answers
                questions — and refuses to guess.
              </p>
            </button>
            <button
              onClick={() => setTool("sparring")}
              className="rounded-2xl border border-rule bg-sheet-2 p-5 text-left active:border-gold"
            >
              <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-cream">
                Step into the ring
              </p>
              <p className="mt-1 text-sm text-soft">
                Ten rounds against the toughest seller you'll meet this year. Every answer scored.
              </p>
            </button>
          </div>
        </>
      )}
      {tool === "listing" && <ListingBuilder onBack={() => setTool("menu")} />}
      {tool === "sparring" && <SparringRing onBack={() => setTool("menu")} />}
    </section>
  );
}

function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onBack} aria-label="Back to arcade" className="text-soft">
        ←
      </button>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{title}</p>
    </div>
  );
}

function ChatLog({ msgs, thinking }: { msgs: Msg[]; thinking: boolean }) {
  return (
    <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
      {msgs.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
              m.role === "user" ? "bg-gold text-sheet" : "border border-rule bg-sheet-2 text-cream"
            }`}
          >
            {m.content}
            {typeof m.score === "number" && (
              <p className="mt-2 border-t border-rule pt-2 text-[12px] font-bold text-gold-bright">
                {m.score}/10{m.coach ? ` — ${m.coach}` : ""}
              </p>
            )}
          </div>
        </div>
      ))}
      {thinking && <p className="px-1 text-xs text-faint">thinking…</p>}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <div className="sticky bottom-0 mt-3 flex items-end gap-2 bg-sheet/95 py-2 backdrop-blur">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={2}
        placeholder={placeholder}
        aria-label="Your message"
        className="w-full resize-none rounded-2xl border border-rule bg-sheet-2 px-4 py-3 text-[15px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-2xl bg-gold px-4 py-3 text-sm font-bold text-sheet disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}

// ------------------------------------------------------ Listing Builder

function ListingBuilder({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"facts" | "chat">("facts");
  const [facts, setFacts] = useState("");
  const [agentLabel, setAgentLabel] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const factsRef = useRef("");

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setNotice(null);
    const nextMsgs: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(nextMsgs);
    setDraft("");
    try {
      const res = await fetch("/api/tool/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facts: factsRef.current,
          agentLabel,
          messages: nextMsgs.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
      } else {
        setNotice(errorText(String(data?.error ?? "error")));
      }
    } catch {
      setNotice(errorText("error"));
    }
    setBusy(false);
  }

  if (phase === "facts") {
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Your listing's assistant" onBack={onBack} />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug">
          Paste the facts. Only the facts.
        </h2>
        <p className="mt-2 text-sm text-soft">
          Address, price, beds, baths, square footage, HOA, showing notes — whatever you'd defend on
          your licence. The assistant will speak these exactly and refuse everything else.
        </p>
        <input
          value={agentLabel}
          onChange={(e) => setAgentLabel(e.target.value)}
          placeholder="Your name (how the assistant refers to you)"
          aria-label="Your name"
          className="mt-4 w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <textarea
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          rows={8}
          placeholder={"123 Palmetto Ln, Johns Island\n$589,000 · 4 bed · 2.5 bath · 2,140 sqft\nHOA $85/mo · built 2004\nShowings: Sat–Sun 11–4"}
          aria-label="Listing facts"
          className="mt-2 w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 font-mono text-[13px] text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <button
          onClick={() => {
            factsRef.current = facts;
            setPhase("chat");
            setMsgs([]);
          }}
          disabled={!facts.trim()}
          className="mt-4 rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet disabled:opacity-40"
        >
          Build it
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <BackBar title="Your listing's assistant — live" onBack={() => setPhase("facts")} />
      <p className="mt-2 text-xs text-faint">
        Ask it what a buyer at the sign would ask. Try one it can't know — the refusal is the feature.
      </p>
      <ChatLog msgs={msgs} thinking={busy} />
      {notice && <p className="mt-2 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{notice}</p>}
      <Composer value={draft} onChange={setDraft} onSend={() => void send()} disabled={busy} placeholder="Is the HOA really only $85?" />
    </div>
  );
}

// ------------------------------------------------------ Sparring Ring

const SCENARIOS = [
  { key: "interview", label: "Seller interviewing 3 agents" },
  { key: "fsbo", label: "FSBO who doesn't need you" },
  { key: "expired", label: "Expired — burned last time" },
];

function SparringRing({ onBack }: { onBack: () => void }) {
  const [scenario, setScenario] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function exchange(history: Msg[]) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/tool/sparring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsgs((m) => [...m, { role: "assistant", content: data.reply, score: data.score, coach: data.coach }]);
      } else {
        setNotice(errorText(String(data?.error ?? "error")));
      }
    } catch {
      setNotice(errorText("error"));
    }
    setBusy(false);
  }

  async function start(key: string) {
    setScenario(key);
    setMsgs([]);
    // Empty history: the server asks the persona for its opening objection.
    await exchange([]);
  }

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setDraft("");
    await exchange(next);
  }

  if (!scenario) {
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="The Sparring Ring" onBack={onBack} />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug">
          Pick your opponent.
        </h2>
        <p className="mt-2 text-sm text-soft">
          Ten rounds. Every answer scored, one improvement per round, debrief at the bell.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => void start(s.key)}
              className="rounded-2xl border border-rule bg-sheet-2 px-5 py-4 text-left text-[15px] font-semibold text-cream active:border-gold"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <BackBar
        title={SCENARIOS.find((s) => s.key === scenario)?.label ?? "The ring"}
        onBack={() => {
          setScenario(null);
          setMsgs([]);
        }}
      />
      <ChatLog msgs={msgs} thinking={busy} />
      {notice && <p className="mt-2 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{notice}</p>}
      <Composer value={draft} onChange={setDraft} onSend={() => void send()} disabled={busy} placeholder="Your comeback…" />
    </div>
  );
}
