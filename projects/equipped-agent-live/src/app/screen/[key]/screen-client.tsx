"use client";

// Read-only. It polls the same snapshot the console does and renders the
// slide — but it never sends an action, so a stray click on the projector
// machine can't move the deck.

import { useCallback, useEffect, useRef, useState } from "react";
import { DECK } from "@/lib/deck";
import { SlideStage, type Snapshot } from "@/app/stage/slide-stage";

export function ScreenClient({ presenterKey }: { presenterKey: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
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

  if (!snap) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-soft">Screen connecting…</p>
      </main>
    );
  }

  const slide = DECK[snap.step] ?? DECK[0];
  // The title slide earns a full-bleed join panel — that is the moment the
  // whole room is supposed to get their phones out.
  const bigJoin = slide.kind === "title";

  return (
    <main className="stage relative flex min-h-dvh flex-col overflow-hidden px-[5vw] py-[4vh]">
      {bigJoin ? (
        <div className="relative z-10 flex flex-1 items-center gap-[5vw]">
          <div className="flex-1">
            <SlideStage snap={snap} slide={slide} presentPop={presentPop} />
          </div>
          <JoinPanel presenterKey={presenterKey} pin={snap.pin} present={snap.present} />
        </div>
      ) : (
        <>
          <section key={snap.step} className="slide-enter flex flex-1 flex-col justify-center overflow-hidden">
            <SlideStage snap={snap} slide={slide} presentPop={presentPop} />
          </section>
          <JoinStrip presenterKey={presenterKey} pin={snap.pin} present={snap.present} />
        </>
      )}

      {/* progress rail — the room can see how far in we are */}
      <div className="relative z-10 mt-[1.4vh] flex items-center gap-[0.5vw]">
        {DECK.map((s, i) => (
          <span
            key={s.id}
            className={`h-[0.7vh] rounded-full transition-all ${
              i === snap.step ? "w-[3vw] bg-gold" : i < snap.step ? "w-[1vw] bg-gold/40" : "w-[1vw] bg-sheet-3"
            }`}
          />
        ))}
      </div>
    </main>
  );
}

/** The opening panel: a QR nobody can miss, plus the PIN for the one person
 *  whose camera won't cooperate. */
function JoinPanel({ presenterKey, pin, present }: { presenterKey: string; pin: string | null; present: number }) {
  return (
    <div className="rise d2 flex shrink-0 flex-col items-center rounded-3xl border-2 border-gold/60 bg-sheet-2 px-[3vw] py-[4vh]">
      <p className="text-[clamp(14px,1.4vw,24px)] font-bold uppercase tracking-[0.2em] text-gold">
        Scan to play along
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/qr?key=${encodeURIComponent(presenterKey)}`}
        alt="Scan to join the room"
        className="mt-[2.5vh] w-[min(34vh,26vw)] rounded-2xl"
      />
      {pin && (
        <p className="mt-[2.5vh] text-[clamp(16px,1.6vw,26px)] font-semibold text-soft">
          or type PIN{" "}
          <span className="font-[family-name:var(--font-display)] text-[clamp(30px,3.4vw,58px)] font-bold tracking-[0.2em] text-cream">
            {pin}
          </span>
        </p>
      )}
      <p className="mt-[1.5vh] text-[clamp(13px,1.2vw,20px)] text-faint">
        <span className="text-gold-bright">{present}</span> in the room
      </p>
    </div>
  );
}

/** Every other slide keeps a scannable QR parked bottom-right — walk-ins,
 *  late arrivals, and anyone watching a shared screen can join mid-sentence. */
function JoinStrip({ presenterKey, pin, present }: { presenterKey: string; pin: string | null; present: number }) {
  return (
    <div className="fixed bottom-[3vh] right-[3vw] z-20 flex items-center gap-[1.2vw] rounded-2xl border border-gold/40 bg-sheet-2/90 px-[1.4vw] py-[1.2vh] backdrop-blur">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/qr?key=${encodeURIComponent(presenterKey)}`}
        alt="Scan to join the room"
        className="w-[clamp(90px,11vh,150px)] rounded-lg"
      />
      <div>
        <p className="text-[clamp(12px,1.1vw,18px)] font-bold uppercase tracking-[0.16em] text-gold">
          Scan to join
        </p>
        {pin && (
          <p className="mt-[0.4vh] text-[clamp(13px,1.2vw,20px)] font-semibold text-soft">
            PIN <span className="font-bold tracking-[0.18em] text-cream">{pin}</span>
          </p>
        )}
        <p className="mt-[0.4vh] text-[clamp(12px,1vw,17px)] text-faint">
          <span className="text-gold-bright">{present}</span> playing
        </p>
      </div>
    </div>
  );
}
