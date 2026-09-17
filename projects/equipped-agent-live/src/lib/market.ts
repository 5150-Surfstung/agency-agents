// CHARLESTON, OUT OF THE MLS.
//
// This is the only thing on the invite that is not an argument. Every other
// section is us saying what these tools do; this is a set of numbers an agent
// already knows to be true about their own market, which is why it is the
// thing that makes the rest of the page believable.
//
// PROVENANCE, because a number without one is a claim: pulled from the
// Charleston Trident MLS through the FlexMLS connector — the same connector
// the room switches on — on the date below. Residential (property type A),
// City = Charleston. Twelve monthly figures, oldest first, ending with the
// last complete month the MLS had closed at pull time.
//
// It is a SNAPSHOT and the page says so. The deployment has no MLS
// credentials, so nothing here is fetched at runtime and nothing here is
// labelled "live" — that would be a confirmation the system never performed.
// Re-pull before the event and these numbers change in one file.

export const MARKET = {
  /** When these were pulled, and from where. Printed on the panel verbatim. */
  pulledOn: "September 17, 2026",
  source: "Charleston Trident MLS, via the FlexMLS connector",
  scope: "City of Charleston · residential",
  /** The most recent complete month in the series. */
  through: "August 2026",

  /** Oldest first: Sep 2025 → Aug 2026. */
  months: [
    "Sep", "Oct", "Nov", "Dec", "Jan", "Feb",
    "Mar", "Apr", "May", "Jun", "Jul", "Aug",
  ],

  /** Average days on market. */
  dom: [52.1, 53.5, 47.7, 44.1, 60.7, 52.3, 42.7, 43.3, 42.1, 30.9, 37.5, 40.9],
  /** Active listings at month end. */
  active: [793, 841, 834, 794, 727, 757, 781, 819, 859, 858, 840, 865],
  /** Closed sales in the month. */
  sold: [225, 203, 197, 239, 176, 206, 287, 312, 319, 387, 325, 248],
  /** Percent of the FINAL asking price that sellers got. */
  ratioLast: [96.9, 97.2, 97.2, 97.6, 96.6, 97.9, 97.5, 97.6, 98.1, 98.4, 97.8, 98.0],
  /** Percent of the FIRST asking price that sellers got. The gap between this
   *  and ratioLast is what the reductions along the way cost. */
  ratioOriginal: [93.8, 95.3, 94.5, 95.2, 93.3, 95.6, 95.3, 95.8, 96.4, 97.0, 95.9, 95.9],
  /** Median sold price. */
  medianSold: [
    600000, 612285, 625000, 655000, 665000, 605230,
    620000, 600000, 605000, 650000, 625000, 632500,
  ],
} as const;

const last = <T,>(a: readonly T[]): T => a[a.length - 1];

/** Everything the panel states, derived once so the copy and the figures can
 *  never disagree. Nothing here is rounded in a direction that flatters us. */
export function marketFacts() {
  const domNow = last(MARKET.dom);
  const domThen = MARKET.dom[0];
  const activeNow = last(MARKET.active);
  const activeThen = MARKET.active[0];
  const onLast = last(MARKET.ratioLast);
  const onFirst = last(MARKET.ratioOriginal);
  const median = last(MARKET.medianSold);

  // The gap is in points of asking price. Stated against the median sold
  // price because that is the denominator we can actually show them.
  const gapPoints = Math.round((onLast - onFirst) * 10) / 10;
  const gapDollars = Math.round((median * gapPoints) / 100 / 100) * 100;

  return {
    domNow,
    domThen,
    domDelta: Math.round((domNow - domThen) * 10) / 10,
    activeNow,
    activeThen,
    activeDelta: activeNow - activeThen,
    onLast,
    onFirst,
    gapPoints,
    gapDollars,
    median,
  };
}

/** A sparkline path over a 0-based box, oldest point at x=0. Returned as a
 *  plain string so the panel can stay a server component — no chart library
 *  ships to a phone for twelve numbers. */
export function spark(series: readonly number[], w: number, h: number, pad = 2): string {
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = hi - lo || 1;
  return series
    .map((v, i) => {
      const x = pad + (i / (series.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - lo) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Where the last point sits, for the one marker each sparkline gets. */
export function sparkEnd(series: readonly number[], w: number, h: number, pad = 2) {
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = hi - lo || 1;
  const v = series[series.length - 1];
  return { x: w - pad, y: h - pad - ((v - lo) / span) * (h - pad * 2) };
}
