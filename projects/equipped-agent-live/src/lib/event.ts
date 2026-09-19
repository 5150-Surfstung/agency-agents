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
  /** DOORS, half an hour early. Not hospitality — it is the difference
   *  between an hour of building and forty minutes of building while three
   *  people hunt for the wifi password. Everywhere the start time appears,
   *  this appears with it. */
  doors: "11:30am",
  /** Who else is in the room before it starts. Stated plainly, as given —
   *  no arrangement is described or implied. */
  guests: "Tabor Mortgage",
  /** One hour, and it starts on time. */
  duration: "one hour",
  /** Street address — shown on the page, in the reveal, and in the message. */
  place: "2000 Sam Rittenberg Blvd, Suite 2020 · Charleston, SC",
  /** Both are offered. The Zoom link is not minted yet, so the page says it
   *  comes with the confirmation rather than printing a link that 404s. */
  online: "in person, or on Zoom",
  /** The official reservation page from the flyer's QR code. */
  rsvpUrl: "https://theagentconnection.com/#rsvp",

  /** THE ZOOM ROOM — for people who booked, and nowhere else.
   *
   *  This link carries its own passcode in the query string, so anybody
   *  holding it can walk in. It belongs in the confirmation email that goes to
   *  a named reservation and it does NOT belong on the public page, in a share
   *  card, or in anything Val says — Val answers strangers, and a meeting link
   *  on an indexed page is how a room gets crashed. */
  zoomUrl: "https://us06web.zoom.us/j/87491686734?pwd=wH6jv67bt96b0hRyEWH1VN31Y0dHU6.1",
  zoomId: "874 9168 6734",
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
