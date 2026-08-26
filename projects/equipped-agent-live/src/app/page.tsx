import { Suspense } from "react";
import { JoinCard } from "./join-card";

export default function JoinPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
        The AGENT Connection™ × Surfstung Systems
      </p>
      <h1 className="mt-3 text-center font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-cream">
        The Equipped Agent
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm text-soft">
        Your phone is part of the show. Enter the room PIN from the screen.
      </p>
      <Suspense>
        <JoinCard />
      </Suspense>
      <p className="mt-10 text-center text-[11px] text-faint">
        No account. No password. Your number is only asked for if you raise your hand at the end.
      </p>
    </main>
  );
}
