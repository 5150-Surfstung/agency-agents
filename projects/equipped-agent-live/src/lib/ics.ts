// The calendar file. A real .ics the phone's own calendar opens — which is
// why the confirmation is allowed to offer it: adding the event is something
// the visitor's device actually does, not something this page claims.

import { EVENT } from "./event";
import { HOST } from "./contact";

/** RFC 5545 wants CRLF, escaped commas and semicolons, and folded long lines.
 *  Nothing here is long enough to fold, so this escapes and joins. */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Friday, October 2, 2026, 12:00pm ET — as UTC, which is what a .ics wants
 *  and what stops a phone in another timezone from drawing the wrong hour.
 *  ET in early October is UTC-4. */
const START = new Date(Date.UTC(2026, 9, 2, 16, 0, 0));
const END = new Date(Date.UTC(2026, 9, 2, 17, 0, 0));

export function icsFor(ref: string, attend: string): string {
  const where =
    attend === "zoom"
      ? "On Zoom — the link comes from Mike before the 2nd"
      : EVENT.place || "The AGENT Connection, Charleston, SC";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Surfstung Systems//The Equipped Agent//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${esc(ref)}@theequippedagent`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(START)}`,
    `DTEND:${stamp(END)}`,
    "SUMMARY:The Equipped Agent — one hour, live",
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(
      `Your reference is ${ref}. Bring a laptop with Claude installed and your phone — the free tier is fine. Questions: ${HOST.full}, ${HOST.cell}.`
    )}`,
    `ORGANIZER;CN=${esc(HOST.full)}:mailto:${HOST.email}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:The Equipped Agent starts in an hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
