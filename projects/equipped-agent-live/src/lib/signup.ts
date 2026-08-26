// The sign-up rail: every hand-raise becomes an email thread Mike owns,
// with Melanie cc'd. Zero-field capture — the attendee's own send button is
// the signature. Safe for client bundles: addresses only, no env.

export const SIGNUP_TO = "mike@mikeolsonre.com";
export const SIGNUP_CC = "melaniejager@thejagergroup.com";

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
