"use client";

// A scan pre-fills the PIN (?pin=) so joining is one tap; a typed PIN is
// four digits and go. Wrong PIN says so plainly and keeps the field.

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function JoinCard() {
  const router = useRouter();
  const params = useSearchParams();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTried = useRef(false);

  async function join(p: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: p }),
      });
      if (res.ok) {
        router.push("/room");
        return;
      }
      setError(res.status === 401 ? "That's not tonight's PIN — check the screen." : "Something hiccuped — try again.");
    } catch {
      setError("No connection — try again.");
    }
    setBusy(false);
  }

  useEffect(() => {
    const fromQr = params.get("pin");
    if (fromQr && !autoTried.current) {
      autoTried.current = true;
      setPin(fromQr);
      void join(fromQr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <form
      className="mt-8 flex w-full max-w-xs flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (pin.trim()) void join(pin.trim());
      }}
    >
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Room PIN"
        aria-label="Room PIN"
        className="rounded-2xl border border-rule bg-sheet-2 px-5 py-4 text-center text-2xl font-semibold tracking-[0.35em] text-cream placeholder:tracking-normal placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !pin.trim()}
        className="rounded-2xl bg-gold px-5 py-4 text-lg font-bold text-sheet transition-opacity disabled:opacity-40"
      >
        {busy ? "Joining…" : "I'm in the room"}
      </button>
      {error && <p className="text-center text-sm text-clay">{error}</p>}
    </form>
  );
}
