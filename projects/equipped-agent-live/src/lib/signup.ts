// The sign-up rail: every hand-raise becomes an email thread Mike owns,
// with Melanie cc'd. Zero-field capture — the attendee's own send button is
// the signature. Safe for client bundles: addresses only, no env.

export const SIGNUP_TO = "mike@mikeolsonre.com";
export const SIGNUP_CC = "melaniejager@thejagergroup.com";

/** The public invite books through the office inbox, not Mike's personal one:
 *  a Facebook post can be shared anywhere and somebody has to be watching it
 *  on a Sunday. The in-room hand-raise still goes straight to Mike. */
export const RSVP_TO = "info@surfstung.com";
export const RSVP_CC = "melaniejager@thejagergroup.com";

export function rsvpMailto(opts: { name?: string; cell?: string; when: string }): string {
  const subject = `Save me a seat — The Equipped Agent`;
  const lines = [
    `Count me in for The Equipped Agent (${opts.when}).`,
    ``,
    opts.name ? `Name: ${opts.name}` : `Name:`,
    opts.cell ? `Cell: ${opts.cell}` : `Cell:`,
    ``,
    `Send me the address and anything I should have installed before I get there.`,
    ``,
    `— from theequippedagent`,
  ];
  const params = new URLSearchParams({ cc: RSVP_CC, subject, body: lines.join("\n") });
  return `mailto:${RSVP_TO}?${params.toString().replaceAll("+", "%20")}`;
}

export function signupMailto(opts: { name?: string; cell?: string; rung?: string; source: string }): string {
  const subject = `I'm in — The Equipped Agent (${opts.source})`;
  const lines = [
    `Hey Mike — count me in.`,
    ``,
    opts.name ? `Name: ${opts.name}` : `Name:`,
    opts.cell ? `Cell: ${opts.cell}` : `Cell:`,
    opts.rung ? `Next step I picked: ${opts.rung}` : `Next step: tell me what's first`,
    ``,
    `— sent from The Equipped Agent · The AGENT Connection`,
  ];
  const params = new URLSearchParams({
    cc: SIGNUP_CC,
    subject,
    body: lines.join("\n"),
  });
  // URLSearchParams encodes spaces as '+'; mail clients want %20.
  return `mailto:${SIGNUP_TO}?${params.toString().replaceAll("+", "%20")}`;
}
