// THE ONE PLACE THE EVENT DETAILS LIVE.
//
// Taken from the flyer, which is the source of truth for the date: Friday,
// October 2, 2026 at noon Eastern — the first Friday, because this is a
// first-Friday series. Nothing else in the app knows the date and nothing
// invents one; if these were blank the public page would say the date is
// coming rather than printing a plausible-looking Friday, because a wrong
// date on a link that is already on Facebook is the one mistake you cannot
// take back.
//
// STILL BLANK ON PURPOSE: the street address. It is not on the flyer, and a
// guessed address on a public invite is worse than no address — so the page
// says it comes back with the confirmation, which is true, until it is set
// here.

export const EVENT = {
  /** The series the hour belongs to, per the flyer. */
  series: "AI REvealed with Mike Olson · a first-Friday series",
  date: "Friday, October 2, 2026",
  time: "12:00pm noon ET",
  /** One hour, and it starts on time. */
  duration: "one hour",
  /** Street address — set it and the page shows it everywhere. */
  place: "",
  /** The flyer offers both. No Meet link yet, so the page does not print one. */
  online: "in person, or on Google Meet",
  /** The official reservation page from the flyer's QR code. */
  rsvpUrl: "https://theagentconnection.com/#rsvp",
} as const;

export const eventIsSet = Boolean(EVENT.date);

/** One line for the page, the share card and the pre-filled message. */
export function eventLine(): string {
  if (!eventIsSet) return "Date announced this week";
  return [EVENT.date, EVENT.time].filter(Boolean).join(" · ");
}

/** The share card's version: one line, no wrap, at 1200px wide. A card that
 *  wraps its own date does not look designed. */
export function eventShort(): string {
  if (!eventIsSet) return "One hour. Bring a phone.";
  return "Friday, October 2 · 12pm ET";
}
