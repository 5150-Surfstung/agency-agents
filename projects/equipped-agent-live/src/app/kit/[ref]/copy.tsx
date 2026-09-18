"use client";

// A copy button that only ever claims a copy that happened.
//
// The clipboard API fails on an insecure origin, without permission, and in
// some in-app browsers. When it throws, the label does not change and the
// text is still sitting there selectable — a button that says "Copied" over a
// clipboard that is empty is the same class of lie as a confirmation nothing
// performed.

import { useCallback, useState } from "react";

export function Copy({
  text,
  label,
  done = "Copied — now paste it into Claude",
  kind = "primary",
}: {
  text: string;
  label: string;
  done?: string;
  kind?: "primary" | "quiet";
}) {
  const [ok, setOk] = useState(false);
  const go = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
    } catch {
      setOk(false);
    }
  }, [text]);
  return (
    <button type="button" onClick={go} className={kind === "primary" ? "pg-go" : "pg-go quiet"}>
      {ok ? done : label}
    </button>
  );
}

/** The prompt itself, shown but folded away — proof it is real without
 *  spending six screens on text nobody reads on a phone. */
export function Peek({ text }: { text: string }) {
  return (
    <details className="pg-peek">
      <summary>Look at it first ({text.length.toLocaleString()} characters)</summary>
      <pre>{text}</pre>
    </details>
  );
}
