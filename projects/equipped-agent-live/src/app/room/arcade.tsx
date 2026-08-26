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
  const [tool, setTool] = useState<"menu" | "listing" | "sparring" | "mine">("menu");

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
              onClick={() => setTool("mine")}
              className="rounded-2xl border border-gold/60 bg-sheet-2 p-5 text-left active:border-gold"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                The take-home
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-cream">
                Your assistant, to go
              </p>
              <p className="mt-1 text-sm text-soft">
                Build a personal AI assistant branded to YOU — test-drive it here, then install it in
                your own free Claude app tonight. Yours forever, courtesy of The AGENT Connection.
              </p>
            </button>
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
      {tool === "mine" && <AssistantToGo onBack={() => setTool("menu")} />}
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

// ------------------------------------------------------ Assistant To Go

const TONES = [
  { key: "warm", label: "Warm + direct", hint: "a text from a sharp friend" },
  { key: "luxury", label: "Luxury polish", hint: "understated, unhurried" },
  { key: "energy", label: "High energy", hint: "verbs first, momentum" },
];

function AssistantToGo({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"form" | "done">("form");
  const [name, setName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [area, setArea] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [tone, setTone] = useState("warm");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  async function build() {
    if (busy || !name.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brokerage, area, specialty, tone }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCode(data.code);
        setPhase("done");
        setMsgs([]);
        // First hello from their own assistant, unprompted.
        void exchange(data.code, []);
      } else {
        setNotice(errorText(String(data?.error ?? "error")));
      }
    } catch {
      setNotice(errorText("error"));
    }
    setBusy(false);
  }

  async function exchange(packCode: string, history: Msg[]) {
    setChatBusy(true);
    try {
      const res = await fetch("/api/tool/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: packCode, messages: history.map(({ role, content }) => ({ role, content })) }),
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
    setChatBusy(false);
  }

  async function send() {
    const text = draft.trim();
    if (!text || chatBusy || !code) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setDraft("");
    await exchange(code, next);
  }

  if (phase === "form") {
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Your assistant, to go" onBack={onBack} />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug">
          Brand it to you.
        </h2>
        <p className="mt-2 text-sm text-soft">
          Sixty seconds of typing, then it's yours forever — in your own Claude app, at no cost,
          courtesy of The AGENT Connection.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name"
            className="w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none" />
          <input value={brokerage} onChange={(e) => setBrokerage(e.target.value)} placeholder="Brokerage / team" aria-label="Brokerage"
            className="w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none" />
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Market you serve (e.g. Johns Island, West Ashley)" aria-label="Market"
            className="w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none" />
          <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Specialty (optional — luxury, military moves, first-timers…)" aria-label="Specialty"
            className="w-full rounded-xl border border-rule bg-sheet-2 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none" />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Voice</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button key={t.key} onClick={() => setTone(t.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                tone === t.key ? "border-gold bg-gold text-sheet" : "border-rule bg-sheet-2 text-soft"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-faint">{TONES.find((t) => t.key === tone)?.hint}</p>
        {notice && <p className="mt-3 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{notice}</p>}
        <button onClick={() => void build()} disabled={busy || !name.trim()}
          className="mt-4 rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet disabled:opacity-40">
          {busy ? "Building…" : "Build my assistant"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <BackBar title="Meet your assistant" onBack={() => setPhase("form")} />
      <div className="mt-3 rounded-2xl border border-gold/50 bg-sheet-2 p-4">
        <p className="text-sm font-semibold text-cream">
          It's yours. Keep this link forever:
        </p>
        <a href={`/pack/${code}`} target="_blank" rel="noreferrer"
          className="mt-1 block font-mono text-lg font-bold text-gold-bright underline underline-offset-4">
          /pack/{code}
        </a>
        <p className="mt-1 text-xs text-faint">
          Open it tonight → copy the pack → paste into your own Claude app (free account works).
        </p>
      </div>
      <p className="mt-3 text-xs text-faint">Test-drive it right here first:</p>
      <ChatLog msgs={msgs} thinking={chatBusy} />
      {notice && <p className="mt-2 rounded-xl border border-clay/50 bg-sheet-2 px-4 py-3 text-sm text-clay">{notice}</p>}
      <Composer value={draft} onChange={setDraft} onSend={() => void send()} disabled={chatBusy}
        placeholder='Try: "listing" + paste a fact sheet' />
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
