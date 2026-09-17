// One source of truth for the host's contact details. It feeds the vCard, the
// phone's save button, the kit page and the closing slide — so a number that
// changes changes in exactly one place, and can never be right on the slide
// and wrong in the thing 40 people just saved to their phones.

export const HOST = {
  first: "Mike",
  last: "Olson",
  full: "Mike Olson",
  title: "Director of AI Strategy & Innovation",
  org: "The AGENT Connection",
  brokerage: "eXp Realty",
  cell: "843-442-7992",
  /** E.164, for the vCard and tel: links. */
  cellE164: "+18434427992",
  email: "mike@mikeolsonre.com",
  site: "https://www.theagentconnection.com",
  city: "Charleston",
  state: "SC",
} as const;

/** RFC-6350-shaped vCard. Folded lines are avoided on purpose: every phone
 *  parses this, and nothing here is long enough to need them. */
export function vcard(): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${HOST.last};${HOST.first};;;`,
    `FN:${HOST.full}`,
    `ORG:${HOST.org}`,
    `TITLE:${HOST.title}`,
    `TEL;TYPE=CELL,VOICE:${HOST.cellE164}`,
    `EMAIL;TYPE=INTERNET,PREF:${HOST.email}`,
    `URL:${HOST.site}`,
    `ADR;TYPE=WORK:;;;${HOST.city};${HOST.state};;USA`,
    `NOTE:REALTOR\\, ${HOST.brokerage}. Met at The Equipped Agent — the Claude course.`,
    "END:VCARD",
  ].join("\r\n");
}
