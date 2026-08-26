// The take-home page. Public forever, branded to the agent, courtesy of The
// AGENT Connection — this page IS the asset they walk out owning, and the
// thing they show a colleague on Monday.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { packPrompt } from "@/lib/prompts";
import { getStore } from "@/lib/store";
import { PackActions } from "./pack-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const pack = await getStore().getPack(code.toUpperCase());
  return {
    title: pack ? `${pack.name}'s Assistant` : "Assistant not found",
    robots: { index: false },
  };
}

export default async function PackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const pack = await getStore().getPack(code.toUpperCase());
  if (!pack) notFound();

  const prompt = packPrompt(pack);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-16 pt-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
        Built at The Equipped Agent · courtesy of The AGENT Connection™
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-cream">
        {pack.name}&rsquo;s Assistant
      </h1>
      <p className="mt-2 text-sm text-soft">
        {[pack.brokerage, pack.area, pack.specialty].filter(Boolean).join(" · ")}
      </p>

      <div className="mt-8 rounded-2xl border border-gold/40 bg-sheet-2 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-cream">
          Install it in 60 seconds
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-soft">
          <li>
            Open <span className="font-semibold text-cream">claude.ai</span> or the Claude app — a free
            account works.
          </li>
          <li>Start a new chat and paste the whole pack below as your first message.</li>
          <li>
            Say <em>&ldquo;introduce yourself&rdquo;</em> — meet your assistant.
          </li>
        </ol>
        <p className="mt-3 text-xs text-faint">
          Claude Pro? Create a Project and paste the pack into its instructions — then it&rsquo;s
          permanent, no re-pasting.
        </p>
      </div>

      <PackActions prompt={prompt} filename={`${pack.name.replace(/[^\w-]+/g, "-")}-assistant.txt`} />

      <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-rule bg-sheet-2 p-5 font-mono text-[12.5px] leading-relaxed text-soft">
        {prompt}
      </pre>

      <footer className="mt-10 border-t border-rule pt-5 text-xs text-faint">
        <p>
          Your pack lives at this link — code <span className="font-mono font-bold text-gold-bright">{pack.code}</span>.
          Share it, rebuild it, brand it. The rules inside (never invent a number, grounded listings,
          fair housing always) are the whole method from the hour.
        </p>
        <p className="mt-2">The AGENT Connection™ × Surfstung Systems · Mike Olson, REALTOR® · eXp Realty</p>
      </footer>
    </main>
  );
}
