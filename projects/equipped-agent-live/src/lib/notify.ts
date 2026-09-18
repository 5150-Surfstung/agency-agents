// The speed-to-lead closer. When a ladder lead lands: Mike's phone buzzes in
// the room, and the attendee's phone gets its first text seconds after they
// raised their hand — the room watches the standard happen to them.
// No Twilio env → honest no-op; the console HUD shows sms off.

import { emailOnline, sendEmail } from "./mailer";

const SIGNUP_TO = "info@surfstung.com";
const SIGNUP_CC = "melaniejager@thejagergroup.com";

export const SIGNUP = { to: SIGNUP_TO, cc: SIGNUP_CC };

export function smsOnline(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return false;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Fire-and-forget: a failed text never blocks the capture. */
export function notifyLead(lead: { name: string; cell: string; rung: string }): void {
  if (!smsOnline()) return;

  const alertTo = process.env.LEAD_ALERT_TO; // Mike's cell
  if (alertTo) {
    void sendSms(
      alertTo,
      `🔑 Equipped Agent lead: ${lead.name} · ${lead.cell} · "${lead.rung}". First reply inside the hour — that's the standard.`
    );
  }

  // The attendee's first text, seconds after they raised their hand.
  void sendSms(
    lead.cell,
    `${lead.name} — you're in. This text left the moment you tapped; that's the speed-to-lead standard we just taught. Mike Olson will follow up personally. — The Equipped Agent · The AGENT Connection`
  );
}

/** A stranger left their details on an attendee's deployed assistant. Their
 *  phone buzzes immediately — that is the entire speed-to-lead promise, and
 *  in the room it is the moment the demo becomes real. Fire-and-forget: a
 *  failed text never blocks the capture. */
/** THE ALERT THAT DOES NOT NEED A CARRIER.
 *
 *  A text needs Twilio: an account, a number, a per-message fee, and a
 *  deployment that has all three. Email needs a sender domain and nothing
 *  else, so it is the channel an agent can actually be given on day one and
 *  the text is the upgrade. Both fire; neither is required.
 *
 *  This is also the honest boundary of the whole product, and it is worth
 *  saying out loud in the code: the assistant somebody talks to at eleven at
 *  night has to be RUNNING somewhere. A Skill or a Project in an agent's own
 *  Claude account cannot do this — nothing is listening when the agent is
 *  asleep, there is no inbound address, and no amount of prompt-writing
 *  changes that. An alert arrives because a server took the message. */
export async function emailAssistantLead(l: {
  ownerEmail: string | null;
  headline: string;
  name: string;
  cell: string;
  question: string;
  timeline: string;
  financing: string;
  hasAgent: string;
}): Promise<boolean> {
  if (!l.ownerEmail || !emailOnline()) return false;

  const qualified = [
    l.timeline && ["Timeline", l.timeline],
    l.financing && ["Financing", l.financing],
    l.hasAgent && ["Has an agent", l.hasAgent],
  ].filter(Boolean) as [string, string][];

  const lines = [
    `${l.name} · ${l.cell}`,
    l.question ? `\nThey asked: "${l.question}"` : "",
    qualified.length ? "\n" + qualified.map(([k, v]) => `${k}: ${v}`).join("\n") : "",
    `\n\nYour assistant caught this while you were doing something else. Call them back first — that is the whole edge.`,
    `\n\nNothing was sent to them on your behalf. This is a notification, not a reply.`,
  ].join("");

  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f2438">
  <p style="margin:0 0 4px;font:700 11px ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a6b2f">New lead · ${esc(l.headline)}</p>
  <p style="margin:0 0 18px;font-size:26px;font-weight:800;line-height:1.15">${esc(l.name)}</p>
  <p style="margin:0 0 18px;font-size:17px"><a href="tel:${esc(l.cell.replace(/[^\d+]/g, ""))}" style="color:#0f2438;font-weight:700">${esc(l.cell)}</a></p>
  ${l.question ? `<p style="margin:0 0 18px;padding:12px 14px;background:#f4f1e8;border-left:3px solid #d0a050;font-size:15px;line-height:1.5">They asked: &ldquo;${esc(l.question)}&rdquo;</p>` : ""}
  ${qualified.length ? `<table style="border-collapse:collapse;margin:0 0 18px;font-size:14px">${qualified.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6b7a88">${esc(k)}</td><td style="padding:4px 0;font-weight:600">${esc(v)}</td></tr>`).join("")}</table>` : ""}
  <p style="margin:0 0 14px;font-size:15px;line-height:1.55">Your assistant caught this while you were doing something else. <b>Call them back first</b> — that is the whole edge.</p>
  <p style="margin:0;font-size:12px;line-height:1.55;color:#6b7a88">Nothing was sent to them on your behalf. This is a notification, not a reply.</p>
</div>`;

  return sendEmail({
    to: l.ownerEmail,
    subject: `New lead — ${l.name} · ${l.headline}`,
    text: lines,
    html,
  });
}

export function notifyAssistantLead(l: {
  ownerCell: string | null;
  headline: string;
  name: string;
  cell: string;
  question: string;
  timeline: string;
  financing: string;
  hasAgent: string;
}): void {
  if (!smsOnline() || !l.ownerCell) return;
  const qualified = [
    l.timeline && `timeline: ${l.timeline}`,
    l.financing && `financing: ${l.financing}`,
    l.hasAgent && `agent: ${l.hasAgent}`,
  ]
    .filter(Boolean)
    .join(" · ");
  void sendSms(
    l.ownerCell,
    `🏠 ${l.headline} — new lead: ${l.name} · ${l.cell}` +
      (l.question ? `\nAsked: "${l.question}"` : "") +
      (qualified ? `\n${qualified}` : "") +
      `\nYour assistant caught this. Call them back first.`
  );
}
