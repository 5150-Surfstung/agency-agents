"use client";

// Copy / download for the seed. The copy button flips only on a confirmed
// clipboard write; the download builds its file client-side.

import { useState } from "react";
import { SEED_PROMPT } from "@/lib/prompts";

export function SeedActions() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(SEED_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // The full text sits right below — select it by hand; no fake "copied".
    }
  }

  function download() {
    const blob = new Blob([SEED_PROMPT], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assistant-seed.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4 flex gap-3">
      <button
        onClick={() => void copy()}
        className="flex-1 rounded-2xl bg-gold px-5 py-4 text-base font-bold text-sheet"
      >
        {copied ? "Copied ✓" : "Copy the seed"}
      </button>
      <button
        onClick={download}
        className="rounded-2xl border border-rule bg-sheet-2 px-5 py-4 text-base font-semibold text-cream"
      >
        Download
      </button>
    </div>
  );
}
