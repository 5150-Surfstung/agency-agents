"use client";

// ONE BUTTON. That is the entire design brief.
//
// This page is opened by forty people at once, on their own laptops, in a room
// where Mike has just said a sentence and is waiting. Every extra decision on
// it is a person looking up and asking a question instead of pasting.
//
// So: no form, no sign-in, no choices. A button that copies, a button that
// opens Claude, and three steps in type big enough to read from a slouch.

import { useCallback, useState } from "react";

export function CopyBox({ prompt }: { prompt: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setState("done");
      window.setTimeout(() => setState("idle"), 4000);
    } catch {
      // Clipboard can be blocked. Say so and show them the text instead of
      // claiming a copy that did not happen.
      setState("failed");
    }
  }, [prompt]);

  return (
    <>
      <div className="pz-go">
        <button type="button" className="pz-copy" onClick={copy}>
          {state === "done" ? "Copied — now paste it into Claude" : "1 · Copy the prompt"}
        </button>
        <a
          className="pz-open"
          href="https://claude.ai/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          2 · Open Claude
        </a>
      </div>

      {state === "failed" && (
        <div className="pz-fallback">
          <p>
            Your browser would not let me reach the clipboard. Select all of
            this and copy it by hand — it works exactly the same.
          </p>
          <textarea readOnly value={prompt} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
    </>
  );
}
