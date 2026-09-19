// VAL TAKES THE RESERVATION.
//
// This is the one place on the invite where the page performs something on
// the visitor's behalf, so it is the one place where honesty costs the most
// to get wrong. The rule the whole flow is built around: the confirmation the
// visitor sees must describe a row that exists. The reference and the
// timestamp both come back FROM the database — they are not generated in the
// browser and drawn on the screen, because a confirmation nothing performed
// is exactly the kind of demo this hour teaches against.
//
// WHAT IT SENDS, AND WHAT IT WILL NOT PRETEND TO SEND. A reservation now
// produces two emails: the attendee's confirmation with the bring list and a
// calendar file, and an alert to Mike with Melanie copied. Both report back
// what the provider actually did — `emailed` and `notified` are return values,
// not hopes — so the page can say "check your inbox" only when something went,
// and can hand over the mail-app fallback when it did not. Nothing here texts
// anybody, so nothing here says it did.

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { emailOnline, looksLikeEmail, sendEmail } from "@/lib/mailer";
import { HOST } from "@/lib/contact";
import { RSVP_CC, RSVP_TO } from "@/lib/signup";
import { alertHtml, alertText, seatHtml, seatText, type Attend } from "@/lib/rsvp-mail";

/** Short, unambiguous, sayable down a phone: no O/0, no I/1. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `EA-${body.slice(0, 3)}${body.slice(3, 6)}`;
}

export async function POST(req: NextRequest) {
  let name = "";
  let cell = "";
  let attend = "in-person";
  let note = "";
  let ref = "";
  let email = "";
  try {
    const b = await req.json();
    name = String(b?.name ?? "").trim().slice(0, 80);
    cell = String(b?.cell ?? "").trim().slice(0, 32);
    attend = String(b?.attend ?? "in-person").trim();
    note = String(b?.note ?? "").trim().slice(0, 400);
    email = String(b?.email ?? "").trim().slice(0, 160);
    // The browser may hand back a reference from a previous attempt, which is
    // what makes a retry idempotent instead of a second seat.
    ref = String(b?.ref ?? "").trim().slice(0, 24);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // A SEAT HAS TO BE REACHABLE.
  //
  // Both fields were optional and the form offered to skip them, so somebody
  // booked with a name and nothing else — a row nobody can confirm, remind or
  // send a Zoom link to, which is not a reservation, it is a gap in a list.
  // The gate lives here rather than only in the browser: the page can be
  // bypassed, this cannot.
  const digits = cell.replace(/\D/g, "");
  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "need_name" }, { status: 400 });
  }
  if (digits.length < 10) {
    return NextResponse.json({ ok: false, error: "need_cell" }, { status: 400 });
  }
  if (!looksLikeEmail(email)) {
    return NextResponse.json({ ok: false, error: "need_email" }, { status: 400 });
  }
  if (!["in-person", "zoom", "either"].includes(attend)) attend = "in-person";
  if (!/^EA-[A-Z0-9]{6}$/.test(ref)) ref = makeRef();

  try {
    const at = await getStore().rsvpAdd({ ref, name, cell, attend, note, email });

    // TWO SENDS, AND BOTH REPORT WHAT ACTUALLY HAPPENED.
    //
    //   emailed  — the attendee got their confirmation, the bring list and a
    //              calendar file. Only true when the provider said so.
    //   notified — Mike was told, with Melanie copied. This one fires on every
    //              reservation, including the ones with no email address,
    //              because a seat nobody knows about is the failure this whole
    //              flow exists to stop.
    //
    // Neither can take the reservation down with it: the row is already
    // written, so a mail outage costs a notification, never a seat.
    const when = new Date(at).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", timeZone: "America/New_York",
    });
    const wants = attend as Attend;
    const canMail = emailOnline();
    const toAttendee = Boolean(email && looksLikeEmail(email) && canMail);

    const [confirm, alert] = await Promise.allSettled([
      toAttendee
        ? sendEmail({
            to: email,
            replyTo: HOST.email,
            subject: `Your seat — The Equipped Agent, ${ref}`,
            text: seatText(name, ref, wants),
            html: seatHtml(name, ref, wants),
          })
        : Promise.resolve(false),
      canMail
        ? sendEmail({
            to: RSVP_TO,
            cc: RSVP_CC,
            replyTo: email && looksLikeEmail(email) ? email : HOST.email,
            subject: `New seat — ${name} (${ref})`,
            text: alertText({ name, cell, email, attend: wants, note, ref, at: when }),
            html: alertHtml({ name, cell, email, attend: wants, note, ref, at: when }),
          })
        : Promise.resolve(false),
    ]);

    const emailed = confirm.status === "fulfilled" && confirm.value === true;
    const notified = alert.status === "fulfilled" && alert.value === true;
    // A reservation that nobody was told about is an incident, not a detail.
    if (!notified) console.error("[rsvp] NOT NOTIFIED", ref, name, canMail ? "send failed" : "mailer offline");

    return NextResponse.json({ ok: true, ref, at, emailed, notified });
  } catch (e) {
    const msg = String(e);
    const known = /too_many/.test(msg) ? "too_many" : /need_name/.test(msg) ? "need_name" : "store_error";
    return NextResponse.json({ ok: false, error: known }, { status: known === "too_many" ? 429 : 502 });
  }
}
