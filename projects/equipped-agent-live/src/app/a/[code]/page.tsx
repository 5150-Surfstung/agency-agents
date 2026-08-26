// A deployed assistant's public page — the thing an attendee walks out owning.
// Server-rendered from the code so it has real metadata and works the instant
// a stranger scans the rider sign, with no room session anywhere in sight.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { AssistantChat } from "./assistant-chat";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  try {
    const a = await getStore().assistantGet(code);
    if (!a) return { title: "Assistant not found" };
    return {
      title: `${a.headline || "This listing"} — ask ${a.agentName}'s assistant`,
      description: `Questions about ${a.headline || "this listing"}? Ask away — answered from the fact sheet, never guessed.`,
    };
  } catch {
    return { title: "Listing assistant" };
  }
}

export default async function AssistantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let assistant = null;
  try {
    assistant = await getStore().assistantGet(code);
  } catch {
    assistant = null;
  }
  if (!assistant) notFound();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10 pt-8">
      <header className="border-b border-rule pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
          {assistant.brokerage || "Listing assistant"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-cream">
          {assistant.headline || "Ask about this home"}
        </h1>
        <p className="mt-2 text-sm text-soft">
          {assistant.agentName}&apos;s assistant · answers from the fact sheet, around the clock.
        </p>
      </header>

      <AssistantChat code={assistant.code} agentName={assistant.agentName} />

      <footer className="mt-10 border-t border-rule pt-4">
        <p className="text-[11px] leading-relaxed text-faint">
          {`This assistant only speaks what ${assistant.agentName} put on the fact sheet. Anything it doesn't know, it says so — and ${assistant.agentName} follows up personally.`}
        </p>
        <p className="mt-2 text-[11px] text-faint">
          Built live at The Equipped Agent · The AGENT Connection™
        </p>
      </footer>
    </main>
  );
}
