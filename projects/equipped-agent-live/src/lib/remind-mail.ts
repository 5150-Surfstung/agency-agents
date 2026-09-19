// THE TWO REMINDERS.
//
// A seat booked three weeks out is a seat somebody has forgotten about by the
// week of. These are the only two messages that go out between booking and the
// room, and they earn their place by carrying the things people actually lose:
// the address, the Zoom link, and the one instruction that decides whether
// they spend the hour building or the hour installing.
//
// Nothing here asks for anything. No reply needed, no confirm button, no "are
// you still coming" — a reminder that creates a task is a reminder people
// resent. If somebody cannot make it, Mike's number is at the bottom.

import { EVENT, eventLine } from "./event";
import { HOST } from "./contact";
import { INSTALL } from "./install";
import { wantsZoom, type Attend } from "./rsvp-mail";

const GOLD = "#d9ae64";
const CREAM = "#f2efe7";
const SHEET = "#0e1519";
const SOFT = "#b9c2c6";

export type Kind = "two_day" | "morning";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

export function remindSubject(kind: Kind, ref: string): string {
  return kind === "two_day"
    ? `Two days. Charge the laptop. (${ref})`
    : `Today at noon — bring both devices (${ref})`;
}

/** WHAT THEY WALK OUT WITH. The close, and the reason it is a close: every
 *  line is a thing they physically leave holding, not a feeling about AI. */
const WALKOUT = [
  "An assistant running on your own Claude account, in your voice.",
  "A QR code that can go on a real sign on Monday.",
  "Claude wired into the MLS on your own login — almost nobody here has done it.",
];

export function remindText(kind: Kind, name: string, ref: string, attend: Attend): string {
  const first = name.trim().split(/\s+/)[0] || "there";
  const head =
    kind === "two_day"
      ? [
          `${first} — two days.`,
          ``,
          `${eventLine()}. Your seat is held and your name is on it.`,
          `Between now and then you have exactly one job, and it takes a minute.`,
        ]
      : [
          `${first} — today.`,
          ``,
          `Noon. Your seat is held. Grab the laptop AND the phone on your way out`,
          `the door, because you cannot build on one of them.`,
        ];

  return [
    ...head,
    ``,
    `Doors ${EVENT.doors} — come early, get set up and network. It starts at noon.`,
    `${EVENT.guests} will be there as well.`,
    ``,
    attend === "zoom" ? `On Zoom:` : `Where: ${EVENT.place}`,
    ...(wantsZoom(attend)
      ? [EVENT.zoomUrl, `Meeting ID ${EVENT.zoomId} — the passcode is in the link.`]
      : []),
    `Reference ${ref}`,
    ``,
    `────────────────────────────────────────`,
    kind === "two_day" ? `THE ONE JOB` : `LAST CALL ON THE ONE JOB`,
    `────────────────────────────────────────`,
    `Claude on your phone AND your laptop. The free tier is fine.`,
    `  iPhone:  ${INSTALL.ios}`,
    `  Android: ${INSTALL.android}`,
    `  Laptop:  ${INSTALL.web}`,
    ``,
    ...(kind === "two_day"
      ? [
          `Do it now and Friday is a full hour of building. Do it in the room and`,
          `it is forty minutes of building and twenty of watching everybody else.`,
        ]
      : [`If it is still not installed, do it in the car park, not in the room.`]),
    ``,
    `────────────────────────────────────────`,
    `WHAT YOU WALK OUT WITH`,
    `────────────────────────────────────────`,
    ...WALKOUT.map((w) => `· ${w}`),
    ``,
    `Nobody leaves empty-handed. That is the whole design of the hour.`,
    ``,
    kind === "two_day"
      ? `And bring whatever you have already built. Half finished counts, broken`
      : `Bring whatever you have built. We put them on the screen afterwards and`,
    kind === "two_day"
      ? `counts, and the ones that are broken are usually the most fun to fix.`
      : `nobody gets rushed out.`,
    ``,
    `Nothing to reply to. If something came up, ${HOST.first} is on ${HOST.cell}.`,
    ``,
    `— ${HOST.full}`,
  ].join("\n");
}

export function remindHtml(kind: Kind, name: string, ref: string, attend: Attend): string {
  const first = esc(name.trim().split(/\s+/)[0] || "there");
  const badge = kind === "two_day" ? "Two days out" : "Today";
  const head = kind === "two_day" ? `${first}, two days.` : `${first}, it&rsquo;s today.`;
  const when = kind === "two_day" ? esc(eventLine()) : "Noon ET &mdash; today";
  const lede =
    kind === "two_day"
      ? "Your seat is held and your name is on it. Between now and Friday you have exactly one job, and it takes a minute."
      : "Your seat is held. Grab the laptop <b style=\"color:#f2efe7\">and</b> the phone on the way out the door &mdash; you cannot build on one of them.";

  return `<div style="margin:0;padding:0;background:${SHEET};background-image:radial-gradient(900px 420px at 78% -8%, rgba(217,174,100,.18), transparent 62%)">
<div style="max-width:600px;margin:0 auto;padding:38px 26px 32px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:${CREAM}">

  <div style="display:inline-block;border:1px solid ${GOLD};border-radius:999px;padding:6px 16px;margin:0 0 18px">
    <span style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};font-weight:800">${badge}</span>
  </div>

  <h1 style="margin:0 0 10px;font-size:36px;line-height:1.04;font-weight:800;letter-spacing:-.025em;color:${CREAM}">${head}</h1>
  <p style="margin:0 0 14px;font-size:17px;color:${GOLD};font-weight:700">${when}</p>
  <p style="margin:0 0 26px;font-size:16px;line-height:1.55;color:${SOFT}">${lede}</p>

  <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;background:rgba(242,239,231,.04);border:1px solid rgba(217,174,100,.3);border-radius:16px;overflow:hidden">
    <tr><td style="padding:15px 18px">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${SOFT}">Where</div>
      <div style="font-size:16px;font-weight:700;line-height:1.45;color:${CREAM}">${
        attend === "zoom" ? "On Zoom" : esc(EVENT.place)
      }</div>
      <div style="margin-top:5px;font-size:14px;color:${GOLD};font-weight:700">Doors ${esc(EVENT.doors)} — get set up and network</div>
    </td></tr>
    <tr><td style="padding:15px 18px;border-top:1px solid rgba(217,174,100,.22)">
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${SOFT}">Reference</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:.07em;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:${GOLD}">${esc(ref)}</div>
    </td></tr>
  </table>

  ${
    wantsZoom(attend)
      ? `<div style="margin:22px 0 0;padding:18px;border:1px solid rgba(217,119,87,.5);border-radius:16px;background:rgba(217,119,87,.12)">
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${SOFT}">Meeting ID <b style="color:${CREAM}">${esc(EVENT.zoomId)}</b> — the passcode is already in the link.</p>
    <p style="margin:0"><a href="${esc(EVENT.zoomUrl)}" style="display:inline-block;background:#d97757;color:#0e1519;text-decoration:none;font-weight:800;font-size:15px;padding:13px 22px;border-radius:12px">Join the Zoom room</a></p>
  </div>`
      : ""
  }

  <div style="margin:24px 0 0;padding:20px 18px;background:rgba(242,239,231,.035);border-radius:16px;border:1px solid rgba(242,239,231,.09)">
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${GOLD};font-weight:700">${
      kind === "two_day" ? "The one job" : "Last call on the one job"
    }</p>
    <p style="margin:0 0 14px;font-size:19px;font-weight:800;line-height:1.35;color:${CREAM}">Claude on your phone <span style="color:${GOLD}">and</span> your laptop. Free tier is fine.</p>
    <p style="margin:0 0 12px">
      <a href="${INSTALL.ios}" style="display:inline-block;margin:0 6px 6px 0;padding:11px 15px;border:1px solid ${GOLD};border-radius:10px;background:rgba(217,174,100,.18);color:${CREAM};text-decoration:none;font-size:13px;font-weight:800">iPhone</a>
      <a href="${INSTALL.android}" style="display:inline-block;margin:0 6px 6px 0;padding:11px 15px;border:1px solid ${GOLD};border-radius:10px;background:rgba(217,174,100,.18);color:${CREAM};text-decoration:none;font-size:13px;font-weight:800">Android</a>
      <a href="${INSTALL.web}" style="display:inline-block;margin:0 6px 6px 0;padding:11px 15px;border:1px solid ${GOLD};border-radius:10px;background:rgba(217,174,100,.18);color:${CREAM};text-decoration:none;font-size:13px;font-weight:800">Laptop</a>
    </p>
    <p style="margin:0;font-size:14px;line-height:1.55;color:${SOFT}">${
      kind === "two_day"
        ? "Do it now and Friday is a full hour of building. Do it in the room and it is forty minutes of building and twenty of watching everybody else build."
        : "If it is still not installed, do it in the car park rather than in the room."
    }</p>
  </div>

  <div style="margin:24px 0 0;padding:20px 18px;border:1px solid rgba(217,174,100,.42);border-left:3px solid ${GOLD};border-radius:0 16px 16px 0;background:linear-gradient(180deg, rgba(217,174,100,.14), rgba(242,239,231,.03) 60%)">
    <p style="margin:0 0 12px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${GOLD};font-weight:700">What you walk out with</p>
    ${WALKOUT.map(
      (w) =>
        `<p style="margin:0 0 9px;font-size:15px;line-height:1.5;color:${CREAM}"><span style="color:${GOLD};font-weight:800">&rarr;</span> ${esc(w)}</p>`
    ).join("")}
    <p style="margin:12px 0 0;font-size:15px;font-weight:800;color:${CREAM}">Nobody leaves empty-handed. That is the whole design of the hour.</p>
  </div>

  <p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:${SOFT}">${
    kind === "two_day"
      ? "And bring whatever you have already built. Half finished counts, broken counts &mdash; the broken ones are usually the most fun to fix."
      : "Bring whatever you have built. We put them on the screen afterwards and nobody gets rushed out."
  }</p>

  <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(217,174,100,.22);font-size:14px;line-height:1.6;color:${SOFT}">
    Nothing to reply to. If something came up, ${esc(HOST.first)} is on ${esc(HOST.cell)}.
  </p>
  <p style="margin:12px 0 0;font-size:15px;font-weight:800;color:${CREAM}">${esc(HOST.full)}</p>
</div></div>`;
}
