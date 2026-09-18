// EMAIL, OR AN HONEST NO.
//
// Mirrors lib/notify.ts: with no provider configured this reports offline and
// sends nothing, and every caller is expected to branch on that rather than
// print "check your inbox" over a message that was never sent. A confirmation
// of something that did not happen is the failure this whole build refuses.
//
// Resend because it is one POST and no dependency. Set two env vars in the
// deployment and it starts working with no code change:
//   RESEND_API_KEY   the API key
//   RESEND_FROM      e.g.  Mike Olson <mike@surfstung.com>
// The from-address must be on a domain verified with the provider, or the
// provider rejects it — which surfaces here as a failed send, not a silent one.

export function emailOnline(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** A deliverable-looking address, checked only enough to avoid obvious typos
 *  and to keep junk out of the send queue. Real validation is the provider's. */
export function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(s.trim());
}
