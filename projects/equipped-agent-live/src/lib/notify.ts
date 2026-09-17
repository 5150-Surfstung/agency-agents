// The speed-to-lead closer. When a ladder lead lands: Mike's phone buzzes in
// the room, and the attendee's phone gets its first text seconds after they
// raised their hand — the room watches the standard happen to them.
// No Twilio env → honest no-op; the console HUD shows sms off.

const SIGNUP_TO = "mike@mikeolsonre.com";
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
