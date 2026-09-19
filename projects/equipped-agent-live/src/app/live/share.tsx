"use client";

// BRING SOMEONE — the difference between a share button and an invitation.
//
// A share button posts a link. An invitation arrives from a person, with their
// name on it, and the page on the other end says so. That is the entire design
// here: everything this component hands over carries `?from=` with the
// sender's first name, and the banner on the invite reads it back, so what a
// friend opens is "Mike is going to this" rather than a URL somebody dropped
// in a thread.
//
// Three honest fallbacks, in the order phones actually support them:
//  · navigator.share — the real sheet, with the real preview card.
//  · a text and an email, pre-written, that open the visitor's own apps.
//  · copy the link, which is stated as copied only when the clipboard said so.
// Nothing here sends anything. Every path opens something the person then
// sends themselves, which is also why none of it needs a permission.

import { useCallback, useState } from "react";
import { EVENT } from "@/lib/event";

const BASE = "https://the-equipped-agent.vercel.app/live";

export function shareLink(from?: string): string {
  const who = (from ?? "").trim().split(/\s+/)[0]?.slice(0, 24) ?? "";
  return who ? `${BASE}?from=${encodeURIComponent(who)}` : BASE;
}

/** One line, written the way somebody would actually text a friend. */
export function shareText(from?: string): string {
  const who = (from ?? "").trim().split(/\s+/)[0];
  const mine = who ? "I just grabbed a seat at" : "Worth a look:";
  return `${mine} The Equipped Agent — a Claude meetup for agents in Charleston. ${EVENT.date.replace(", 2026", "")}, noon, one hour. You build a working AI assistant and take it home. Come with me.`;
}

export function Share({
  from,
  label = "Bring someone with you",
  compact = false,
}: {
  from?: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [sheetFailed, setSheetFailed] = useState(false);
  const url = shareLink(from);
  const text = shareText(from);

  const native = useCallback(async () => {
    // Feature-detected rather than sniffed: desktop Chrome has no sheet, and a
    // button that silently does nothing is worse than one that is not there.
    if (typeof navigator === "undefined" || !navigator.share) {
      setSheetFailed(true);
      return;
    }
    try {
      await navigator.share({ title: "The Equipped Agent", text, url });
    } catch {
      // A cancelled share is not a failure and must not look like one.
    }
  }, [text, url]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }, [text, url]);

  const sms = `sms:?&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  const mail = `mailto:?subject=${encodeURIComponent(
    "Come to this with me — The Equipped Agent"
  )}&body=${encodeURIComponent(`${text}\n\n${url}\n`)}`;

  const canSheet = typeof navigator !== "undefined" && "share" in navigator && !sheetFailed;

  return (
    <div className={compact ? "share share--compact" : "share"}>
      {!compact && <p className="share-h display">{label}</p>}
      {!compact && (
        <p className="share-p">
          They open it with your name on it. One hour, one seat, no pitch —
          easier to say yes to when somebody they know is already going.
        </p>
      )}

      <div className="share-go">
        {canSheet && (
          <button type="button" className="share-primary" onClick={native}>
            Share the invite
          </button>
        )}
        <a className="share-secondary" href={sms}>
          Text it
        </a>
        <a className="share-secondary" href={mail}>
          Email it
        </a>
        <button type="button" className="share-secondary" onClick={copy}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>

      {!compact && from && (
        <p className="share-note">
          Your link: <code>{url.replace("https://", "")}</code>
        </p>
      )}
    </div>
  );
}
