// THE TWO EMAILS A RESERVATION HAS TO PRODUCE.
//
// 1. The attendee gets something back. Before this existed a stranger handed
//    over a name and a cell and got a screen — nothing in their inbox, nothing
//    to find again on the morning of the 2nd. A seat you cannot re-open is a
//    seat people forget they took.
// 2. Mike and Melanie get told. The reservation used to land in Postgres and
//    stop there, so the only way either of them learned about a seat was to go
//    looking for it. An ad was running against a list nobody was watching.
//
// Both are plain facts only: the date and address come from lib/event, the
// reference comes back from the database, and nothing here claims an action
// that has not happened. If the provider is not configured, the caller sends
// nothing and says so on screen rather than printing a promise.

import { EVENT, eventLine } from "./event";
import { HOST } from "./contact";
import { INSTALL } from "./install";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://the-equipped-agent.vercel.app";

const GOLD = "#d9ae64";
const CREAM = "#f2efe7";
const SHEET = "#0e1519";
const SOFT = "#b9c2c6";

export type Attend = "in-person" | "zoom" | "either";

const ATTEND_SAYS: Record<Attend, string> = {
  "in-person": "In the office, in person",
  zoom: "On Zoom",
  either: "Either — in person or Zoom",
};

/** The one instruction that has to survive every retelling. */
export const BRING_LINE =
  "A laptop and a phone, with Claude installed on both before you arrive. The free tier is fine.";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

function placeFor(attend: Attend): string {
  if (attend === "zoom") return "On Zoom — the link comes to this address before the 2nd.";
  if (attend === "either") return `${EVENT.place} — or on Zoom. The link comes to this address before the 2nd.`;
  return EVENT.place;
}

/* ─────────────────────── 1. To the person who booked ─────────────────────── */

export function seatText(name: string, ref: string, attend: Attend): string {
  const first = name.trim().split(/\s+/)[0] || "there";
  return [
    `CONFIRMED — you're in.`,
    ``,
    `${first}, your seat at The Equipped Agent is booked and we cannot wait to`,
    `see you.`,
    ``,
    `THE EQUIPPED AGENT — a Claude meetup for Charleston agents`,
    `${eventLine()}`,
    `${placeFor(attend)}`,
    `Reference ${ref}`,
    ``,
    `────────────────────────────────────────`,
    `BRING`,
    `────────────────────────────────────────`,
    `1. ** HAVE CLAUDE INSTALLED ON YOUR PHONE AND YOUR LAPTOP **`,
    `   ** BEFORE YOU COME. ** Bring both devices.`,
    `   iPhone:  ${INSTALL.ios}`,
    `   Android: ${INSTALL.android}`,
    `   Laptop:  ${INSTALL.web}  (sign in, that is all)`,
    `   The free tier is fine. Do it before you come — we are not`,
    `   spending this hour on setup.`,
    ``,
    `2. Your ideas and anything you have already built.`,
    `   Half-finished counts. Broken counts. Bring it and we will`,
    `   put it on the screen and take it apart together.`,
    ``,
    `────────────────────────────────────────`,
    `THE HOUR`,
    `────────────────────────────────────────`,
    `No slideshow about AI. You build something on your own account`,
    `that answers a real buyer at eleven at night, and you take it`,
    `home working. No pitch, no upsell, nothing to buy.`,
    ``,
    `────────────────────────────────────────`,
    `AND THEN STAY`,
    `────────────────────────────────────────`,
    `Nobody gets rushed out. Linger, connect, talk Claude and real`,
    `estate with people who are actually building. That part is`,
    `usually the best part of the whole thing.`,
    ``,
    `Add it to your calendar:`,
    `${SITE}/api/ics?ref=${encodeURIComponent(ref)}&attend=${encodeURIComponent(attend)}`,
    ``,
    `Hit reply and it comes straight to me.`,
    ``,
    `— ${HOST.full}`,
    `${HOST.title}, ${HOST.org}`,
    `REALTOR, ${HOST.brokerage} · ${HOST.cell}`,
  ].join("\n");
}

export function seatHtml(name: string, ref: string, attend: Attend): string {
  const first = esc(name.trim().split(/\s+/)[0] || "there");
  const ics = `${SITE}/api/ics?ref=${encodeURIComponent(ref)}&attend=${encodeURIComponent(attend)}`;
  const rule = `border-top:1px solid rgba(217,174,100,.22)`;
  const kicker = (t: string) =>
    `<p style="margin:0 0 10px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${GOLD};font-weight:700">${t}</p>`;

  return `<div style="margin:0;padding:0;background:${SHEET};background-image:radial-gradient(900px 420px at 78% -8%, rgba(217,174,100,.16), transparent 62%)">
<div style="max-width:600px;margin:0 auto;padding:40px 26px 34px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:${CREAM}">

  <p style="margin:0 0 20px;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:rgba(217,174,100,.85)">${esc(HOST.org)} &times; Surfstung Systems</p>

  <div style="display:inline-block;border:1px solid ${GOLD};border-radius:999px;padding:6px 16px;margin:0 0 20px">
    <span style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};font-weight:800">Confirmed</span>
  </div>

  <h1 style="margin:0 0 14px;font-size:40px;line-height:1.02;font-weight:800;letter-spacing:-.02em;color:${CREAM}">${first}, you&rsquo;re in.</h1>
  <p style="margin:0 0 6px;font-size:17px;line-height:1.5;color:${CREAM}">Your seat is booked and we cannot wait to see you.</p>
  <p style="margin:0 0 30px;font-size:15px;font-weight:700;color:${GOLD}">The Equipped Agent &mdash; a Claude meetup for Charleston agents, any level.</p>

  <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;background:rgba(242,239,231,.04);border:1px solid rgba(217,174,100,.3);border-radius:16px;overflow:hidden">
    <tr><td style="padding:16px 18px">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${SOFT}">When</div>
      <div style="font-size:20px;font-weight:800;color:${CREAM};letter-spacing:-.01em">${esc(eventLine())}</div>
    </td></tr>
    <tr><td style="padding:16px 18px;${rule}">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${SOFT}">Where</div>
      <div style="font-size:16px;font-weight:600;line-height:1.45;color:${CREAM}">${esc(placeFor(attend))}</div>
    </td></tr>
    <tr><td style="padding:16px 18px;${rule}">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${SOFT}">Your reference</div>
      <div style="font-size:26px;font-weight:800;letter-spacing:.08em;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:${GOLD}">${esc(ref)}</div>
    </td></tr>
  </table>

  <p style="margin:28px 0 0">
    <a href="${esc(ics)}" style="display:block;text-align:center;background:${GOLD};color:${SHEET};text-decoration:none;font-weight:800;font-size:16px;padding:16px 22px;border-radius:14px">Put it on my calendar</a>
  </p>

  <div style="margin:34px 0 0;padding:22px 20px;background:rgba(242,239,231,.035);border-radius:16px;border:1px solid rgba(242,239,231,.09)">
    ${kicker("Bring — two things")}
    <p style="margin:0 0 10px;font-size:18px;font-weight:800;line-height:1.35;color:${CREAM}">1 &nbsp;<span style="color:${GOLD}">Have Claude installed on your phone and your laptop before you come.</span> Bring both devices.</p>
    <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:${SOFT}">Tap to install &mdash; it takes a minute:</p>
    <p style="margin:0 0 8px">
      <a href="${INSTALL.ios}" style="display:inline-block;margin:0 6px 6px 0;padding:10px 14px;border:1px solid ${GOLD};border-radius:10px;background:rgba(217,174,100,.16);color:${CREAM};text-decoration:none;font-size:13px;font-weight:700">iPhone &mdash; App Store</a>
      <a href="${INSTALL.android}" style="display:inline-block;margin:0 6px 6px 0;padding:10px 14px;border:1px solid ${GOLD};border-radius:10px;background:rgba(217,174,100,.16);color:${CREAM};text-decoration:none;font-size:13px;font-weight:700">Android &mdash; Google Play</a>
      <a href="${INSTALL.web}" style="display:inline-block;margin:0 6px 6px 0;padding:10px 14px;border:1px solid ${GOLD};border-radius:10px;background:rgba(217,174,100,.16);color:${CREAM};text-decoration:none;font-size:13px;font-weight:700">Laptop &mdash; claude.ai</a>
    </p>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${SOFT}">The free tier is fine. Install it before you come &mdash; we are not spending this hour on setup.</p>

    <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:${CREAM}">2 &nbsp;Your ideas, and anything you have already built.</p>
    <p style="margin:0;font-size:14px;line-height:1.55;color:${SOFT}">Half-finished counts. Broken counts. Bring it, put it on the screen, and we take it apart together.</p>
  </div>

  <div style="margin:26px 0 0;padding:0 2px">
    ${kicker("The hour")}
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:${SOFT}">No slideshow about AI. You build something on your own account that answers a real buyer at eleven at night, and you take it home working. <b style="color:${CREAM}">No pitch, no upsell, nothing to buy.</b></p>

    ${kicker("And then stay")}
    <p style="margin:0;font-size:16px;line-height:1.6;color:${SOFT}">Nobody gets rushed out. Linger, connect, and talk Claude and real estate with people who are actually building. That part is usually the best part of the whole thing.</p>
  </div>

  <div style="margin:32px 0 0;padding-top:22px;${rule}">
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${SOFT}">Hit reply and it comes straight to me.</p>
    <p style="margin:0;font-size:15px;font-weight:800;color:${CREAM}">${esc(HOST.full)}</p>
    <p style="margin:3px 0 0;font-size:13px;color:${GOLD}">${esc(HOST.title)}, ${esc(HOST.org)}</p>
    <p style="margin:3px 0 0;font-size:12px;color:rgba(185,194,198,.7)">REALTOR<sup>&reg;</sup>, ${esc(HOST.brokerage)} &middot; ${esc(HOST.cell)}</p>
  </div>
</div></div>`;
}

/* ─────────────────── 2. To Mike, with Melanie copied ─────────────────── */

export function alertText(d: {
  name: string; cell: string; email: string; attend: Attend; note: string; ref: string; at: string;
}): string {
  return [
    `NEW SEAT — The Equipped Agent`,
    ``,
    `Name:       ${d.name}`,
    `Cell:       ${d.cell || "(not given)"}`,
    `Email:      ${d.email || "(not given)"}`,
    `Attending:  ${ATTEND_SAYS[d.attend]}`,
    d.note ? `Note:       ${d.note}` : `Note:       (none)`,
    ``,
    `Reference:  ${d.ref}`,
    `Logged:     ${d.at}`,
    ``,
    d.email
      ? `They have been sent their confirmation, the bring list and a calendar file.`
      : `They gave no email address, so nothing was sent to them — reach them on the cell.`,
    ``,
    `Reply to this and it goes to them${d.email ? "" : " only if they gave an address"}.`,
    `Full list: ${SITE}/api/leads.csv`,
  ].join("\n");
}

export function alertHtml(d: {
  name: string; cell: string; email: string; attend: Attend; note: string; ref: string; at: string;
}): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:7px 16px 7px 0;color:#7d8790;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:7px 0;font-size:15px;font-weight:700;color:#12212b">${esc(v)}</td></tr>`;
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:26px 22px">
  <p style="margin:0 0 2px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#a07c2c">The Equipped Agent</p>
  <h1 style="margin:0 0 18px;font-size:24px;font-weight:800;color:#12212b">New seat — ${esc(d.name)}</h1>
  <table role="presentation" style="border-collapse:collapse;width:100%">
    ${row("Name", d.name)}
    ${row("Cell", d.cell || "(not given)")}
    ${row("Email", d.email || "(not given)")}
    ${row("Attending", ATTEND_SAYS[d.attend])}
    ${row("Note", d.note || "(none)")}
    ${row("Reference", d.ref)}
    ${row("Logged", d.at)}
  </table>
  <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#4a5560">${
    d.email
      ? "They have been sent their confirmation, the bring list and a calendar file."
      : "They gave no email address, so nothing was sent to them — reach them on the cell."
  }</p>
  <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#4a5560">Hitting reply goes to them${d.email ? "" : ", if they left an address"}. The whole list is at <a href="${SITE}/api/leads.csv" style="color:#a07c2c">/api/leads.csv</a>.</p>
</div>`;
}
