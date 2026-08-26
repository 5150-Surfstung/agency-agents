// The Stonoview series, verbatim from the published Neighborhood Index
// (Charleston Trident MLS · 466 recorded closings · updated 27 July 2026).
// Every figure here is a true median of recorded closings — not an estimate,
// not a model. `thin` marks years with fewer than 30 sales, where one
// transaction moves the median: the chart draws those hollow so the room can
// see which points carry weight and which are directional.

export interface YearPoint {
  year: number;
  medianK: number;
  sales: number;
  thin: boolean;
}

export const STONOVIEW_SERIES: YearPoint[] = [
  { year: 2015, medianK: 421.6, sales: 14, thin: true },
  { year: 2016, medianK: 470.4, sales: 25, thin: true },
  { year: 2017, medianK: 469.3, sales: 26, thin: true },
  { year: 2018, medianK: 456.7, sales: 69, thin: false },
  { year: 2019, medianK: 455.0, sales: 36, thin: false },
  { year: 2020, medianK: 506.2, sales: 68, thin: false },
  { year: 2021, medianK: 587.5, sales: 58, thin: false },
  { year: 2022, medianK: 667.0, sales: 65, thin: false },
  { year: 2023, medianK: 765.0, sales: 35, thin: false },
  { year: 2024, medianK: 822.5, sales: 22, thin: true },
  { year: 2025, medianK: 859.9, sales: 31, thin: false },
];

/** 2026 is deliberately absent: 17 sales so far is a partial year, not a
 *  data point. Saying that out loud is the whole credibility of the hour. */
export const SERIES_NOTE =
  "True medians of recorded closings · hollow years had under 30 sales · 2026 excluded as a partial year";

export const SERIES_SOURCE =
  "The Stonoview Index · Charleston Trident MLS · 466 closings, May 2015–July 2026";
