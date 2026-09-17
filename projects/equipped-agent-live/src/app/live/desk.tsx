"use client";

// THE FIRST THING THE INVITE DOES IS WORK.
//
// A stranger lands here from a Facebook post. Before this page asks them for
// anything — not a seat, not an email, not a name — it hands them something
// they can use on a live file tonight: they paste the last thing a client
// texted them, and they get back a message they can send.
//
// The orb above is wired to the same state, so the machine is visibly doing
// the three things it is doing: listening while they type, thinking while it
// drafts, answering when the draft lands. That is the one orchestrated motion
// on the page; everything else moves only when somebody taps it.
//
// Two honesty rules this component cannot break:
//  · The copy button says "Copied" only after the clipboard write resolved.
//  · When the desk is offline or the allowance is spent, it says so. There is
//    no spinner that spins forever and no draft that came from nowhere.

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "listen" | "think" | "speak" | null;

/** Real things clients send after nine at night. The third one is the one that
 *  matters: it is the question every agent gets, it cannot be answered the way
 *  it was asked, and watching the desk turn it into something defensible is
 *  the most useful thirty seconds on this page. */
const SAMPLES = [
  "we love it but we're nervous about the inspection — what happens if something big shows up?",
  "my lender just said the rate changed. are we still ok to close on the 30th?",
  "is that a safe area? we have two little kids",
];

const TROUBLE: Record<string, string> = {
  offline: "The desk is off right now — nothing was sent anywhere. Try it again in a few minutes, or bring the message Friday and we will run it on the screen.",
  room_cap: "Today's allowance for this page is spent. It resets tomorrow — or bring the message Friday and we will run it live.",
  device_cap: "That is forty drafts from this browser today. Bring the next one Friday.",
  error: "That one did not come back. Try it again, or send it a different way.",
  need_message: "Paste a little more of it — a few words is not enough to draft from.",
};

export function Desk({ onMode }: { onMode?: (m: Mode) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ send: string; check: string; ms: number } | null>(null);
  const [trouble, setTrouble] = useState("");
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const out = useRef<HTMLDivElement>(null);

  // The orb listens while there is something to listen to, thinks while the
  // draft is being written, and holds "speak" for a beat once it lands.
  const mode: Mode = busy ? "think" : draft ? "speak" : text.trim().length > 2 ? "listen" : null;
  useEffect(() => {
    onMode?.(mode);
  }, [mode, onMode]);

  const run = useCallback(async () => {
    const message = text.trim();
    if (message.length < 4 || busy) return;
    setBusy(true);
    setTrouble("");
    setDraft(null);
    setCopied(false);
    const started = performance.now();
    try {
      const r = await fetch("/api/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setTrouble(TROUBLE[j?.error as string] ?? TROUBLE.error);
      } else {
        setDraft({
          send: String(j.send ?? ""),
          check: String(j.check ?? ""),
          // Measured, not claimed: the clock starts before the request and
          // stops when the draft is in hand. It is the most convincing number
          // on this page precisely because anybody can check it.
          ms: Math.round(performance.now() - started),
        });
      }
    } catch {
      setTrouble(TROUBLE.error);
    } finally {
      setBusy(false);
    }
  }, [text, busy]);

  // Bring the answer into view on a phone, where it lands below the fold.
  useEffect(() => {
    if (draft && out.current) out.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [draft]);

  const copy = useCallback(async () => {
    if (!draft?.send) return;
    try {
      await navigator.clipboard.writeText(draft.send);
      setCopied(true);
    } catch {
      // No clipboard permission: say nothing false. The text is selectable and
      // the label stays as it was.
      setCopied(false);
    }
  }, [draft]);

  return (
    <div className="desk">
      <h2 className="desk-ask display">
        Paste the last thing a client texted you after hours.
      </h2>
      <p className="desk-sub">
        You get a message you can send. No account, no email, nothing kept — this
        page does not store what you type.
      </p>

      <textarea
        ref={box}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 600))}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
        }}
        rows={3}
        placeholder="&ldquo;quick question — are we still good on the closing date?&rdquo;"
        aria-label="The message your client sent you"
        className="desk-box"
      />

      <div className="desk-row">
        <button type="button" onClick={run} disabled={busy || text.trim().length < 4} className="desk-go">
          {busy ? "Writing the reply" : "Write the reply"}
        </button>
        <div className="desk-samples">
          {SAMPLES.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setText(s);
                box.current?.focus();
              }}
              className="desk-chip"
            >
              {["Inspection nerves", "Rate moved", "Is it a safe area"][i]}
            </button>
          ))}
        </div>
      </div>

      {trouble && (
        <p role="status" className="desk-trouble">
          {trouble}
        </p>
      )}

      {draft && (
        <div ref={out} className="desk-out">
          <p className="desk-out-tag">
            Send this — written in {(draft.ms / 1000).toFixed(1)} seconds
          </p>
          <p className="desk-draft">{draft.send}</p>
          <div className="desk-out-foot">
            <button type="button" onClick={copy} className="desk-copy">
              {copied ? "Copied" : "Copy the reply"}
            </button>
            <p className="desk-then">
              That is one message, by hand. On Friday you build the one that
              does it from your own listing while you are asleep.
            </p>
            {draft.check && (
              <p className={/^nothing\b/i.test(draft.check) ? "desk-check ok" : "desk-check"}>
                <span>Before you send</span>
                {draft.check}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
