// TRACK TO KEYS — the deal that keeps its own promises.
//
// Six numbers in, the whole milestone chain out, with real calendar dates and
// a plain-English stake on every one. This file is pure date math on purpose:
// no React, no network, no model. It is the part that has to be RIGHT, so it
// is the part that can be tested on its own.
//
// What this is NOT: legal advice. Contracts differ by state, by form, and by
// what the parties struck out at 11pm. Every screen that renders this says so.
// The value here is that the dates get COUNTED and SURFACED, not that some
// number is the law.

export interface DealInput {
  address: string;
  /** Binding agreement date — day zero for everything counted forward. */
  binding: string;
  /** Closing date — the anchor everything counted backward hangs from. */
  closing: string;
  emDays: number;
  loanAppDays: number;
  ddDays: number;
  apprDays: number;
  commitDays: number;
  insuranceDaysBefore: number;
  walkDaysBefore: number;
}

export type Urgency = "past" | "today" | "soon" | "ahead";

export interface Milestone {
  key: string;
  label: string;
  /** yyyy-mm-dd. */
  date: string;
  /** What actually happens if this one slips. Plain, specific, no scare tactics. */
  stake: string;
  /** The same date said the way a client should hear it. */
  client: string;
  who: "Buyer" | "Agent" | "Lender" | "Both";
  /** Counted forward from binding, or backward from closing. */
  from: "binding" | "closing";
  daysOut: number;
  urgency: Urgency;
  weekend: boolean;
}

/** A realistic, clearly-labeled starting point so the page does something the
 *  instant it loads. These are common term lengths, NOT required ones. */
export const DEFAULT_DEAL: DealInput = {
  address: "",
  binding: "",
  closing: "",
  emDays: 3,
  loanAppDays: 5,
  ddDays: 10,
  apprDays: 14,
  commitDays: 21,
  insuranceDaysBefore: 7,
  walkDaysBefore: 1,
};

export function parseDay(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  // Noon local: immune to DST shifts pushing a date onto the previous day.
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function shift(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + days);
  return out;
}

/** Whole days between two calendar days, ignoring clock time. */
export function daysBetween(a: Date, b: Date): number {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((B - A) / 86_400_000);
}

function urgencyOf(daysOut: number): Urgency {
  if (daysOut < 0) return "past";
  if (daysOut === 0) return "today";
  return daysOut <= 3 ? "soon" : "ahead";
}

export function prettyDate(s: string): string {
  const d = parseDay(s);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

interface Spec {
  key: string;
  label: string;
  stake: string;
  client: string;
  who: Milestone["who"];
  from: "binding" | "closing";
  days: (d: DealInput) => number;
}

// Order here is only the source list; the chain is sorted by real date below.
const SPECS: Spec[] = [
  {
    key: "binding", label: "Binding agreement", from: "binding", who: "Both", days: () => 0,
    stake: "Day zero. Every other date on this page counts from here.",
    client: "We're officially under contract. Here's everything that happens next.",
  },
  {
    key: "em", label: "Earnest money delivered", from: "binding", who: "Buyer",
    days: (d) => d.emDays,
    stake: "Late delivery is one of the easiest ways to put an otherwise healthy contract at risk.",
    client: "Your good-faith deposit goes to the closing attorney or escrow holder.",
  },
  {
    key: "loanapp", label: "Loan application in", from: "binding", who: "Buyer",
    days: (d) => d.loanAppDays,
    stake: "The financing protection in the contract generally assumes you applied on time.",
    client: "Get the full application to your lender — not just a pre-approval.",
  },
  {
    key: "dd", label: "Due diligence ends", from: "binding", who: "Buyer",
    days: (d) => d.ddDays,
    stake: "The most expensive date on the page. After it, walking away usually costs the earnest money.",
    client: "Last day to finish inspections and decide. After today, changing your mind gets costly.",
  },
  {
    key: "appraisal", label: "Appraisal ordered", from: "binding", who: "Lender",
    days: (d) => d.apprDays,
    stake: "Ordered late and the whole back half of the chain moves with it.",
    client: "The lender sends someone to confirm the home's value.",
  },
  {
    key: "commit", label: "Loan commitment", from: "binding", who: "Lender",
    days: (d) => d.commitDays,
    stake: "The lender's written commitment. If this slips, closing slips — plan the call before the date, not after.",
    client: "Your lender confirms in writing that the loan is approved.",
  },
  {
    key: "insurance", label: "Insurance binder to lender", from: "closing", who: "Buyer",
    days: (d) => -d.insuranceDaysBefore,
    stake: "No binder, no funding. It is a small task that stops a closing cold.",
    client: "Pick your homeowner's insurance and have them send proof to the lender.",
  },
  {
    key: "walk", label: "Final walk-through", from: "closing", who: "Both",
    days: (d) => -d.walkDaysBefore,
    stake: "The last chance to see the house in the condition you agreed to buy it in.",
    client: "We walk the house one more time together before you sign.",
  },
  {
    key: "closing", label: "Closing", from: "closing", who: "Both", days: () => 0,
    stake: "Keys.",
    client: "You sign, it funds, and the house is yours.",
  },
];

export interface Chain {
  milestones: Milestone[];
  /** Days from binding to closing — the length of the whole promise. */
  span: number;
  /** Anything the math itself says is wrong, in plain words. */
  problems: string[];
}

export function buildChain(deal: DealInput, today = new Date()): Chain {
  const binding = parseDay(deal.binding);
  const closing = parseDay(deal.closing);
  const problems: string[] = [];
  if (!binding || !closing) {
    return { milestones: [], span: 0, problems: ["Set a binding agreement date and a closing date."] };
  }
  const span = daysBetween(binding, closing);
  if (span <= 0) problems.push("Closing is on or before the binding date — one of those two is wrong.");

  const milestones: Milestone[] = SPECS.map((s) => {
    const n = s.days(deal);
    const d = s.from === "binding" ? shift(binding, n) : shift(closing, n);
    const daysOut = daysBetween(today, d);
    return {
      key: s.key, label: s.label, stake: s.stake, client: s.client, who: s.who, from: s.from,
      date: fmtDay(d),
      daysOut,
      urgency: urgencyOf(daysOut),
      weekend: d.getDay() === 0 || d.getDay() === 6,
    };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));

  // The two failures that actually bite: a deadline past the closing, and a
  // due-diligence window that outruns the contract.
  for (const m of milestones) {
    if (m.key === "closing" || m.key === "binding") continue;
    if (m.date > fmtDay(closing)) problems.push(`${m.label} lands after closing — check that term.`);
    if (m.date < fmtDay(binding)) problems.push(`${m.label} lands before the contract exists — check that term.`);
  }
  const weekenders = milestones.filter((m) => m.weekend && m.key !== "binding");
  if (weekenders.length) {
    problems.push(
      `${weekenders.map((m) => m.label).join(", ")} land${weekenders.length === 1 ? "s" : ""} on a weekend — confirm how your contract counts those.`
    );
  }
  return { milestones, span, problems };
}

/** The agent's queue: what needs a human today, worst first. */
export function attentionQueue(chain: Chain): Milestone[] {
  const rank: Record<Urgency, number> = { past: 0, today: 1, soon: 2, ahead: 3 };
  return [...chain.milestones]
    .filter((m) => m.key !== "binding")
    .sort((a, b) => rank[a.urgency] - rank[b.urgency] || a.date.localeCompare(b.date));
}

// ---- sharing: the whole deal rides in the URL, so a link IS the deal -------

const FIELDS: (keyof DealInput)[] = [
  "address", "binding", "closing", "emDays", "loanAppDays", "ddDays",
  "apprDays", "commitDays", "insuranceDaysBefore", "walkDaysBefore",
];

export function toQuery(deal: DealInput): string {
  const p = new URLSearchParams();
  for (const f of FIELDS) {
    const v = deal[f];
    if (v !== "" && v !== undefined && v !== null) p.set(f, String(v));
  }
  return p.toString();
}

export function fromQuery(params: URLSearchParams): DealInput {
  const num = (k: keyof DealInput, dflt: number) => {
    const raw = params.get(k);
    const n = raw === null ? NaN : Number(raw);
    // Terms are bounded so a hand-edited link can't produce nonsense dates.
    return Number.isFinite(n) && n >= 0 && n <= 365 ? Math.round(n) : dflt;
  };
  return {
    address: (params.get("address") ?? "").slice(0, 80),
    binding: parseDay(params.get("binding") ?? "") ? String(params.get("binding")) : "",
    closing: parseDay(params.get("closing") ?? "") ? String(params.get("closing")) : "",
    emDays: num("emDays", DEFAULT_DEAL.emDays),
    loanAppDays: num("loanAppDays", DEFAULT_DEAL.loanAppDays),
    ddDays: num("ddDays", DEFAULT_DEAL.ddDays),
    apprDays: num("apprDays", DEFAULT_DEAL.apprDays),
    commitDays: num("commitDays", DEFAULT_DEAL.commitDays),
    insuranceDaysBefore: num("insuranceDaysBefore", DEFAULT_DEAL.insuranceDaysBefore),
    walkDaysBefore: num("walkDaysBefore", DEFAULT_DEAL.walkDaysBefore),
  };
}
