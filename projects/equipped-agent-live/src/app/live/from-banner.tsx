"use client";

// WHO SENT THIS.
//
// An invite that arrives from a person converts on a different axis to a link
// that arrives from an ad, so when one carries `?from=` the page says whose it
// is before it says anything else. The name is treated as hostile input —
// letters, spaces, hyphens and apostrophes only, capped short — because it is
// a query string somebody can type anything into, and it is about to be
// rendered at the top of a public page.

import { useSearchParams } from "next/navigation";
import { ClaudeMark } from "./claude-mark";

function cleanName(raw: string | null): string {
  if (!raw) return "";
  const s = raw.replace(/[^\p{L}\p{M}'\- ]/gu, "").trim().slice(0, 24);
  if (s.length < 2) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FromBanner() {
  const who = cleanName(useSearchParams().get("from"));
  if (!who) return null;
  return (
    <div className="frombanner">
      <ClaudeMark size={26} />
      <p>
        <b>{who} is going to this</b> — and saved you the link. One hour, one
        seat, and you leave with something working.
      </p>
    </div>
  );
}
