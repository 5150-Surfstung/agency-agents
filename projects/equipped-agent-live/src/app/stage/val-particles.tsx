"use client";

// VAL'S CORE.
//
// One canvas for the whole pre-show. A dense wireframe sphere spins as Val's
// resting state; a second population orbits outside it, then SHOOTS into a
// house, a key, a sold sign, a front door, a skyline, a rising record, a scan
// code — real 3D wireframes that keep turning while they hold, so the room
// sees every side of the thing before it comes apart.
//
// The orb used to be a CSS gradient ball layered under this. Two systems, two
// looks, and the ball read as decoration rather than machinery. Now the core
// IS particles: same light, same rotation, same physics, plus HUD rings and a
// sweep that make it read as something running rather than something drawn.
//
// How it stays fast: one rAF loop, additive blending for glow instead of
// per-dot shadows, trails via a translucent destination-out wipe rather than a
// history buffer, and streaks drawn only for particles actually moving. It
// pauses on tab hide, and renders one calm frame under prefers-reduced-motion
// instead of strobing at a room sitting in the dark.

import { useEffect, useRef } from "react";

type P3 = [number, number, number];
type Line3 = P3[];

const at = (pts: [number, number][], z: number): Line3 => pts.map(([x, y]) => [x, y, z] as P3);
const joins = (pts: [number, number][], z1: number, z2: number): Line3[] =>
  pts.map(([x, y]) => [[x, y, z1], [x, y, z2]] as Line3);
const ring = (cx: number, cy: number, r: number, n: number): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r] as [number, number];
  });

// A CHARLESTON SINGLE, not a child's drawing of a house.
//
// The form is specific and this room knows it by heart: one room wide with the
// GABLE END to the street, the long side running back down the lot, and two
// tiers of piazza along that side behind a street-facing false door. Getting
// this right is worth more to a Charleston audience than any amount of extra
// particles — they will recognise it before they have worked out what they are
// looking at, and recognising it is the moment.
//
// x is the narrow width, z the long depth, y down.
const H_X = 0.26;        // half-width — narrow, because that is the whole point
const H_Z = 0.55;        // half-depth — long side down the lot
const H_EAVE = -0.5;
const H_RIDGE = -0.8;
const H_GROUND = 0.62;
const P_X = 0.58;        // piazza outer edge
const P_MID = 0.06;      // the second-storey porch floor

const singleFront: [number, number][] = [
  [-H_X, H_EAVE], [H_X, H_EAVE], [H_X, H_GROUND], [-H_X, H_GROUND], [-H_X, H_EAVE],
];
const singleGable: [number, number][] = [[-H_X, H_EAVE], [0, H_RIDGE], [H_X, H_EAVE]];
/** Two storeys of window on the narrow street facade. */
const frontWindows: [number, number][][] = [
  [[-0.17, 0.12], [-0.04, 0.12], [-0.04, 0.34], [-0.17, 0.34], [-0.17, 0.12]],
  [[0.04, 0.12], [0.17, 0.12], [0.17, 0.34], [0.04, 0.34], [0.04, 0.12]],
  [[-0.17, -0.34], [-0.04, -0.34], [-0.04, -0.12], [-0.17, -0.12], [-0.17, -0.34]],
  [[0.04, -0.34], [0.17, -0.34], [0.17, -0.12], [0.04, -0.12], [0.04, -0.34]],
];
/** The street door that opens onto the piazza, not into the house. */
const streetDoor: [number, number][] = [[0.3, H_GROUND], [0.3, 0.2], [0.5, 0.2], [0.5, H_GROUND]];
const COLS_Z = [0.5, 0.16, -0.18, -0.52];

const houseLines = (): Line3[] => [
  at(singleFront, H_Z), at(singleFront, -H_Z),
  at(singleGable, H_Z), at(singleGable, -H_Z),
  [[0, H_RIDGE, H_Z], [0, H_RIDGE, -H_Z]],
  ...joins([[-H_X, H_EAVE], [H_X, H_EAVE], [H_X, H_GROUND], [-H_X, H_GROUND]], H_Z, -H_Z),
  ...frontWindows.map((wdw) => at(wdw, H_Z)),
  at(streetDoor, H_Z),
  // the piazza: outer edge at three levels, running the length of the lot
  [[P_X, H_EAVE, H_Z], [P_X, H_EAVE, -H_Z]],
  [[P_X, P_MID, H_Z], [P_X, P_MID, -H_Z]],
  [[P_X, H_GROUND, H_Z], [P_X, H_GROUND, -H_Z]],
  // and the floors it hangs off the house
  [[H_X, P_MID, H_Z], [P_X, P_MID, H_Z]],
  [[H_X, P_MID, -H_Z], [P_X, P_MID, -H_Z]],
  [[H_X, H_GROUND, H_Z], [P_X, H_GROUND, H_Z]],
  [[H_X, H_GROUND, -H_Z], [P_X, H_GROUND, -H_Z]],
  [[H_X, H_EAVE, H_Z], [P_X, H_EAVE, H_Z]],
  [[H_X, H_EAVE, -H_Z], [P_X, H_EAVE, -H_Z]],
  // columns, two tiers, the signature of the thing
  ...COLS_Z.flatMap((z) => [
    [[P_X, H_GROUND, z], [P_X, P_MID, z]] as Line3,
    [[P_X, P_MID, z], [P_X, H_EAVE, z]] as Line3,
  ]),
];

const KEY_D = 0.07;
const keyPlate: [number, number][] = [
  ...ring(-0.44, 0, 0.27, 26),
  [-0.2, -0.06], [0.66, -0.06], [0.66, 0.06], [-0.2, 0.06], [-0.2, -0.06],
];
const keyTeeth: [number, number][] = [[0.34, 0.06], [0.34, 0.3], [0.44, 0.3], [0.44, 0.06]];
const keyTeeth2: [number, number][] = [[0.52, 0.06], [0.52, 0.24], [0.62, 0.24], [0.62, 0.06]];

/** Four letters of a stroke font. A sign with no word on it is a rectangle on
 *  a stick, which is exactly what the first version looked like. Coordinates
 *  are a 0..1 box; `letter` maps them onto the board. */
const GLYPH: Record<string, [number, number][][]> = {
  S: [[[0.92, 0.14], [0.55, 0.02], [0.12, 0.14], [0.1, 0.38], [0.5, 0.48], [0.9, 0.58], [0.88, 0.85], [0.45, 0.98], [0.08, 0.86]]],
  O: [Array.from({ length: 21 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    return [0.5 + Math.cos(a) * 0.42, 0.5 + Math.sin(a) * 0.48] as [number, number];
  })],
  L: [[[0.16, 0.02], [0.16, 0.96], [0.9, 0.96]]],
  D: [[[0.14, 0.96], [0.14, 0.02], [0.55, 0.06], [0.88, 0.34], [0.88, 0.64], [0.55, 0.92], [0.14, 0.96]]],
};

function letter(ch: string, x0: number, y0: number, w: number, h: number): [number, number][][] {
  return (GLYPH[ch] ?? []).map((path) => path.map(([x, y]) => [x0 + x * w, y0 + y * h] as [number, number]));
}

function word(text: string, cx: number, y0: number, w: number, h: number, gap: number): [number, number][][] {
  const total = text.length * w + (text.length - 1) * gap;
  let x = cx - total / 2;
  const out: [number, number][][] = [];
  for (const ch of text) {
    out.push(...letter(ch, x, y0, w, h));
    x += w + gap;
  }
  return out;
}

const SIGN_D = 0.05;
const board: [number, number][] = [[-0.62, -0.46], [0.62, -0.46], [0.62, 0.14], [-0.62, 0.14], [-0.62, -0.46]];
const boardInner: [number, number][] = [[-0.56, -0.4], [0.56, -0.4], [0.56, 0.08], [-0.56, 0.08], [-0.56, -0.4]];
const rider: [number, number][] = [[-0.44, -0.68], [0.44, -0.68], [0.44, -0.52], [-0.44, -0.52], [-0.44, -0.68]];
const SOLD = word("SOLD", 0, -0.33, 0.21, 0.28, 0.07);
/** The post, the cross-brace and the hangers — the bits that make it a sign in
 *  a yard rather than a rectangle floating in space. */
const signRig: Line3[] = [
  [[-0.06, 0.14, 0], [-0.06, 0.82, 0]],
  [[0.06, 0.14, 0], [0.06, 0.82, 0]],
  [[-0.24, 0.82, 0], [0.24, 0.82, 0]],
  [[-0.24, 0.82, 0], [-0.1, 0.72, 0]],
  [[0.24, 0.82, 0], [0.1, 0.72, 0]],
  [[-0.62, -0.6, 0], [0.62, -0.6, 0]],
  [[-0.5, -0.6, 0], [-0.5, -0.46, 0]],
  [[0.5, -0.6, 0], [0.5, -0.46, 0]],
];

const DOOR_D = 0.09;
const doorLeaf: [number, number][] = [[-0.32, -0.66], [0.32, -0.66], [0.32, 0.72], [-0.32, 0.72], [-0.32, -0.66]];
const doorFrame: [number, number][] = [[-0.46, -0.8], [0.46, -0.8], [0.46, 0.8], [-0.46, 0.8], [-0.46, -0.8]];
const doorPanel: [number, number][] = [[-0.19, -0.5], [0.19, -0.5], [0.19, 0.02], [-0.19, 0.02], [-0.19, -0.5]];

const CITY_D = 0.16;
const skyline: [number, number][] = [
  [-0.86, 0.6], [-0.86, 0.06], [-0.62, 0.06], [-0.62, -0.3], [-0.4, -0.3],
  [-0.4, 0.2], [-0.16, 0.2], [-0.16, -0.56], [0.06, -0.56], [0.06, -0.12],
  [0.3, -0.12], [0.3, -0.42], [0.54, -0.42], [0.54, 0.16], [0.86, 0.16],
  [0.86, 0.6], [-0.86, 0.6],
];

const CHART_D = 0.06;
const chartLine: [number, number][] = [[-0.68, 0.42], [-0.34, 0.1], [-0.02, 0.22], [0.3, -0.24], [0.62, -0.5]];
const chartHead: [number, number][] = [[0.3, -0.5], [0.62, -0.5], [0.62, -0.18]];
const chartAxes: [number, number][] = [[-0.74, -0.6], [-0.74, 0.62], [0.74, 0.62]];

const SCAN_D = 0.04;
const finder = (cx: number, cy: number): [number, number][][] => [
  [[cx - 0.18, cy - 0.18], [cx + 0.18, cy - 0.18], [cx + 0.18, cy + 0.18], [cx - 0.18, cy + 0.18], [cx - 0.18, cy - 0.18]],
  [[cx - 0.12, cy - 0.12], [cx + 0.12, cy - 0.12], [cx + 0.12, cy + 0.12], [cx - 0.12, cy + 0.12], [cx - 0.12, cy - 0.12]],
  [[cx - 0.06, cy - 0.06], [cx + 0.06, cy - 0.06], [cx + 0.06, cy + 0.06], [cx - 0.06, cy + 0.06], [cx - 0.06, cy - 0.06]],
];
const scanOuter: [number, number][] = [[-0.74, -0.74], [0.74, -0.74], [0.74, 0.74], [-0.74, 0.74], [-0.74, -0.74]];
/** Module texture. Deterministic rather than random so the code looks the same
 *  every night, and deliberately STYLISED — the scannable one is on the join
 *  card two feet to the right, and a decorative code nobody can scan is a
 *  small cruelty. */
const scanModules: [number, number][][] = (() => {
  const out: [number, number][][] = [];
  const m = 0.115;
  for (let gx = 0; gx < 11; gx++) {
    for (let gy = 0; gy < 11; gy++) {
      const inFinder =
        (gx < 4 && gy < 4) || (gx > 6 && gy < 4) || (gx < 4 && gy > 6);
      if (inFinder) continue;
      // A fixed hash — same pattern on every projector, forever.
      if (((gx * 7 + gy * 13 + gx * gy * 3) % 5) > 2) continue;
      const x = -0.63 + gx * m;
      const y = -0.63 + gy * m;
      const r = m * 0.34;
      out.push([[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r], [x - r, y - r]]);
    }
  }
  return out;
})();
const scanBracket: [number, number][][] = [
  [[-0.88, -0.6], [-0.88, -0.88], [-0.6, -0.88]],
  [[0.6, -0.88], [0.88, -0.88], [0.88, -0.6]],
  [[0.88, 0.6], [0.88, 0.88], [0.6, 0.88]],
  [[-0.6, 0.88], [-0.88, 0.88], [-0.88, 0.6]],
];

// ---- the five shapes that name what this actually costs an agent ----
//
// Chosen the way a product roadmap is chosen, not a mood board: each one is a
// pain an agent has had this month, and each one has something on the other
// side of it. A front door was cut because the Charleston single already has
// one, and a generic skyline was cut because "city" is not a problem anybody
// in that room has.

const PHONE_D = 0.07;
const phoneBody: [number, number][] = [
  [-0.27, -0.56], [0.27, -0.56], [0.27, 0.56], [-0.27, 0.56], [-0.27, -0.56],
];
const phoneScreen: [number, number][] = [
  [-0.2, -0.45], [0.2, -0.45], [0.2, 0.4], [-0.2, 0.4], [-0.2, -0.45],
];
/** A message already answered, sitting on the screen. */
const phoneBubble: [number, number][] = [
  [-0.14, -0.3], [0.14, -0.3], [0.14, -0.1], [-0.02, -0.1], [-0.07, -0.02], [-0.08, -0.1], [-0.14, -0.1], [-0.14, -0.3],
];
const phoneHome: [number, number][] = [[-0.09, 0.48], [0.09, 0.48]];
/** Signal arcs: the thing is reachable, which is the entire point. */
const signal = (r: number): [number, number][] =>
  Array.from({ length: 13 }, (_, i) => {
    const a = -Math.PI * 0.78 + (i / 12) * Math.PI * 0.56;
    return [0.34 + Math.cos(a) * r, -0.36 + Math.sin(a) * r] as [number, number];
  });

const CAL_D = 0.05;
const calPage: [number, number][] = [[-0.6, -0.44], [0.6, -0.44], [0.6, 0.56], [-0.6, 0.56], [-0.6, -0.44]];
const calBand: [number, number][] = [[-0.6, -0.44], [0.6, -0.44], [0.6, -0.2], [-0.6, -0.2], [-0.6, -0.44]];
const calRings: Line3[] = [
  [[-0.3, -0.44, CAL_D], [-0.3, -0.62, CAL_D]],
  [[0.3, -0.44, CAL_D], [0.3, -0.62, CAL_D]],
  [[-0.3, -0.44, -CAL_D], [-0.3, -0.62, -CAL_D]],
  [[0.3, -0.44, -CAL_D], [0.3, -0.62, -CAL_D]],
];
const calGrid: [number, number][][] = [
  ...[-0.05, 0.19, 0.43].map((y) => [[-0.6, y], [0.6, y]] as [number, number][]),
  ...[-0.36, -0.12, 0.12, 0.36].map((x) => [[x, -0.2], [x, 0.56]] as [number, number][]),
];
/** The date that matters, ringed the way anyone rings one. */
const calMarked: [number, number][] = ring(0.24, 0.07, 0.11, 16);

const PIN_D = 0.09;
/** A teardrop: the head, then two shoulders drawn down to the point. */
const pinHead: [number, number][] = ring(0, -0.3, 0.34, 26);
const pinBody: [number, number][] = [[-0.29, -0.15], [0, 0.6], [0.29, -0.15]];
const pinHole: [number, number][] = ring(0, -0.3, 0.13, 14);
const pinShadow: [number, number][] = Array.from({ length: 25 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  return [Math.cos(a) * 0.3, 0.68 + Math.sin(a) * 0.09] as [number, number];
});

const LENS_D = 0.06;
const lensOuter: [number, number][] = ring(-0.12, -0.14, 0.42, 30);
const lensInner: [number, number][] = ring(-0.12, -0.14, 0.35, 28);
const lensHandle: [number, number][] = [[0.17, 0.15], [0.56, 0.6], [0.66, 0.5], [0.27, 0.05]];
/** What Mike actually looks at: a roofline, under glass. */
const lensRoof: [number, number][] = [
  [-0.32, -0.06], [-0.12, -0.28], [0.08, -0.06], [0.08, 0.08], [-0.32, 0.08], [-0.32, -0.06],
];

const DOC_D = 0.04;
const docPage: [number, number][] = [
  [-0.42, -0.66], [0.26, -0.66], [0.44, -0.46], [0.44, 0.68], [-0.42, 0.68], [-0.42, -0.66],
];
const docFold: [number, number][] = [[0.26, -0.66], [0.26, -0.46], [0.44, -0.46]];
const docRules: [number, number][][] = [-0.3, -0.16, -0.02, 0.12, 0.26].map(
  (y) => [[-0.3, y], [0.32, y]] as [number, number][]
);
/** A signature, because that is the moment the paperwork is actually over. */
const docSign: [number, number][] = [
  [-0.3, 0.52], [-0.18, 0.4], [-0.1, 0.56], [0.0, 0.38], [0.1, 0.54], [0.22, 0.42], [0.3, 0.5],
];

const SHAPES: { id: string; says: string[]; accent: [number, number, number]; lines: Line3[] }[] = [
  {
    id: "house",
    says: [
      "Val gets it sold faster.",
      "Every listing you own, answering its own phone.",
      "Built on your fact sheet — it never invents one.",
      "The AGENT Connection builds it with you, on your listings.",
    ],
    accent: [217, 174, 100],
    lines: houseLines(),
  },
  {
    id: "key",
    says: [
      "Nine contract dates your client can actually read.",
      "The contract always had them. Nobody ever showed them.",
      "An on-site Director. In Charleston. On Tuesday.",
      "Track to Keys. Every date, every promise, kept.",
    ],
    accent: [242, 239, 231],
    lines: [
      at(keyPlate, KEY_D), at(keyPlate, -KEY_D),
      at(keyTeeth, KEY_D), at(keyTeeth, -KEY_D),
      at(keyTeeth2, KEY_D), at(keyTeeth2, -KEY_D),
      at(ring(-0.44, 0, 0.11, 14), KEY_D),
      ...joins([[-0.71, 0], [-0.17, 0], [0.66, -0.06], [0.66, 0.06], [-0.44, -0.27], [-0.44, 0.27]], KEY_D, -KEY_D),
    ],
  },
  {
    id: "sold",
    says: [
      "The record, not the rumour.",
      "Priced against what actually closed.",
      "Never a number you can't defend.",
      "Same relationships. Bigger possibilities.",
    ],
    accent: [111, 168, 126],
    lines: [
      at(board, SIGN_D), at(board, -SIGN_D),
      at(boardInner, SIGN_D),
      at(rider, SIGN_D), at(rider, -SIGN_D),
      ...SOLD.map((g) => at(g, SIGN_D)),
      ...SOLD.map((g) => at(g, -SIGN_D)),
      ...joins([[-0.62, -0.46], [0.62, -0.46], [0.62, 0.14], [-0.62, 0.14], [-0.44, -0.68], [0.44, -0.68]], SIGN_D, -SIGN_D),
      ...signRig,
    ],
  },
  {
    id: "phone",
    says: [
      "The lead came in at 8:47 on a Saturday. Nobody answered it.",
      "It went to three agents at once. One of them replied.",
      "Mine replies in under a second, qualifies, and books the showing.",
      "Speed to lead isn't discipline. It's equipment.",
    ],
    accent: [124, 186, 214],
    lines: [
      at(phoneBody, PHONE_D), at(phoneBody, -PHONE_D),
      at(phoneScreen, PHONE_D),
      at(phoneBubble, PHONE_D),
      at(phoneHome, PHONE_D),
      at(signal(0.2), PHONE_D), at(signal(0.32), PHONE_D), at(signal(0.44), PHONE_D),
      ...joins([[-0.27, -0.56], [0.27, -0.56], [0.27, 0.56], [-0.27, 0.56]], PHONE_D, -PHONE_D),
    ],
  },
  {
    id: "calendar",
    says: [
      "Due diligence ended on a Tuesday nobody had written down.",
      "Nine contract dates, computed, before any of them bite.",
      "Your client gets them in plain English, as a link.",
      "Track to Keys. Every date, every promise, kept.",
    ],
    accent: [201, 124, 92],
    lines: [
      at(calPage, CAL_D), at(calPage, -CAL_D),
      at(calBand, CAL_D),
      ...calRings,
      ...calGrid.map((l) => at(l, CAL_D)),
      at(calMarked, CAL_D),
      ...joins([[-0.6, -0.44], [0.6, -0.44], [0.6, 0.56], [-0.6, 0.56]], CAL_D, -CAL_D),
    ],
  },
  {
    id: "pin",
    says: [
      "\u201cI don't really have a farm.\u201d Everyone says that.",
      "Pick one neighbourhood. I'll hand you eleven years of it.",
      "Walk in with the street's own history and you're not one of three agents.",
      "Farm like you have a research department.",
    ],
    accent: [217, 174, 100],
    lines: [
      at(pinHead, PIN_D), at(pinHead, -PIN_D),
      at(pinBody, PIN_D), at(pinBody, -PIN_D),
      at(pinHole, PIN_D),
      at(pinShadow, 0),
      ...joins([[0, 0.6], [-0.34, -0.3], [0.34, -0.3], [0, -0.64]], PIN_D, -PIN_D),
    ],
  },
  {
    id: "lens",
    says: [
      "The inspection report is forty pages. The ask is one page.",
      "Safety, maintenance, cosmetic \u2014 sorted, quoted from the report itself.",
      "Eighteen hundred inspections taught me which findings actually matter.",
      "Real experience. Smarter tools.",
    ],
    accent: [111, 168, 126],
    lines: [
      at(lensOuter, LENS_D), at(lensOuter, -LENS_D),
      at(lensInner, LENS_D),
      at(lensRoof, LENS_D),
      at(lensHandle, LENS_D), at(lensHandle, -LENS_D),
      ...joins([[-0.54, -0.14], [0.3, -0.14], [-0.12, -0.56], [-0.12, 0.28], [0.56, 0.6], [0.66, 0.5]], LENS_D, -LENS_D),
    ],
  },
  {
    id: "contract",
    says: [
      "The weekly seller update nobody has time to write.",
      "The chase email that stays polite on day nine.",
      "Drafted in seconds. Sent by you, after you've read it.",
      "Ten places this pays you back before Friday.",
    ],
    accent: [242, 239, 231],
    lines: [
      at(docPage, DOC_D), at(docPage, -DOC_D),
      at(docFold, DOC_D),
      ...docRules.map((l) => at(l, DOC_D)),
      at(docSign, DOC_D),
      ...joins([[-0.42, -0.66], [0.26, -0.66], [0.44, -0.46], [0.44, 0.68], [-0.42, 0.68]], DOC_D, -DOC_D),
    ],
  },
  {
    id: "record",
    says: [
      "Ask a question in English. The MLS answers.",
      "Median sold against median asking — that gap is the story.",
      "Nothing in here is a guess.",
      "Real experience. Smarter tools.",
    ],
    accent: [111, 168, 126],
    lines: [
      at(chartAxes, 0),
      at(chartLine, CHART_D), at(chartLine, -CHART_D),
      at(chartHead, CHART_D), at(chartHead, -CHART_D),
      ...joins([[-0.68, 0.42], [-0.02, 0.22], [0.62, -0.5], [0.3, -0.5], [0.62, -0.18]], CHART_D, -CHART_D),
    ],
  },
  {
    id: "scan",
    says: [
      "One code on a rider. Leads land on your phone.",
      "Capture the lead before the portal does.",
      "Scan the code — your phone is part of the show.",
      "Every agent here gets Val.",
    ],
    accent: [242, 239, 231],
    lines: [
      at(scanOuter, SCAN_D), at(scanOuter, -SCAN_D),
      ...finder(-0.45, -0.45).map((l) => at(l, SCAN_D)),
      ...finder(0.45, -0.45).map((l) => at(l, SCAN_D)),
      ...finder(-0.45, 0.45).map((l) => at(l, SCAN_D)),
      ...scanModules.map((l) => at(l, SCAN_D)),
      ...scanBracket.map((l) => at(l, 0)),
      ...joins([[-0.74, -0.74], [0.74, -0.74], [0.74, 0.74], [-0.74, 0.74]], SCAN_D, -SCAN_D),
    ],
  },
];

/** Val is a CIRCLE BRAIN, not a lamp. Five soft bodies of colour sit inside the
 *  neural shell rather than in front of it — dim, wide, and slow, so they read
 *  as something thinking behind a mesh instead of a wall of glow fighting the
 *  shape. The first version was far too bright and the symbols had to shout
 *  over it. */
const ORBS: { c: [number, number, number]; r: number; orbit: number; speed: number; phase: number; tilt: number }[] = [
  { c: [217, 174, 100], r: 0.40, orbit: 0.22, speed: 0.26, phase: 0.0, tilt: 0.2 },
  { c: [111, 168, 126], r: 0.34, orbit: 0.30, speed: -0.21, phase: 2.1, tilt: 1.1 },
  { c: [201, 124, 92], r: 0.28, orbit: 0.27, speed: 0.17, phase: 4.0, tilt: -0.7 },
  { c: [242, 239, 231], r: 0.20, orbit: 0.13, speed: -0.34, phase: 1.0, tilt: 0.5 },
  { c: [124, 186, 214], r: 0.26, orbit: 0.34, speed: 0.23, phase: 5.2, tilt: -1.3 },
];

const TOTAL = 900;
/** Kept on the sphere at all times, so Val never fully disappears into a shape. */
const CORE = Math.round(TOTAL * 0.38);
const BUILDERS = TOTAL - CORE;

/** Returns the points AND, for each one, whether it continues the same edge
 *  as the point before it. That second array is what lets the renderer draw
 *  the object as a wireframe instead of a dot cloud — joining consecutive
 *  samples only when they actually lie on the same segment, so the pen never
 *  jumps across a gap between two polylines. */
function sample(lines: Line3[], n: number): { pts: P3[]; link: boolean[] } {
  const segs: { a: P3; b: P3; len: number }[] = [];
  let total = 0;
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i];
      const b = line[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      if (len > 1e-6) {
        segs.push({ a, b, len });
        total += len;
      }
    }
  }
  const out: P3[] = [];
  const link: boolean[] = [];
  let prevSeg = -1;
  for (let i = 0; i < n; i++) {
    let d = ((i + 0.5) / n) * total;
    for (let si = 0; si < segs.length; si++) {
      const s = segs[si];
      if (d <= s.len) {
        const t = d / s.len;
        out.push([
          s.a[0] + (s.b[0] - s.a[0]) * t,
          s.a[1] + (s.b[1] - s.a[1]) * t,
          s.a[2] + (s.b[2] - s.a[2]) * t,
        ]);
        // Adjacent samples join when they share a segment, or when they are
        // one segment apart AND that segment's own end meets the next — which
        // is every corner of a closed outline.
        link.push(i > 0 && (si === prevSeg || si === prevSeg + 1));
        prevSeg = si;
        break;
      }
      d -= s.len;
    }
  }
  while (out.length < n) {
    out.push(out[out.length - 1] ?? [0, 0, 0]);
    link.push(false);
  }
  return { pts: out, link };
}

const FORMS = SHAPES.map((s) => {
  const { pts, link } = sample(s.lines, BUILDERS);
  return { id: s.id, says: s.says, accent: s.accent, pts, link };
});

// Slow on purpose. An earlier pass had the particles SNAP into place with an
// overshoot, which was exciting for half a second and then over. Forming and
// dissolving slowly is the thing people can't look away from — and the room is
// filling up, so there is nowhere to hurry to. A symbol that takes four
// seconds to arrive and turns for twelve gets looked at twice.
const DRIFT = 3000;
const GATHER = 4800;
const HOLD = 10500;
// The wind-up: still whole, but turning harder every frame. This is the beat
// that makes somebody look up from their phone.
const SPINUP = 1700;
// And the release: Val throws it outward and it goes, while the closing line
// lands underneath. Slow, slow, fast, gone — then round again.
const BURST = 1600;
const PHASE = DRIFT + GATHER + HOLD + SPINUP + BURST;

/** Slow at both ends, unhurried through the middle. Cubic rather than
 *  quadratic so the approach settles instead of arriving. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function ValParticles({
  className = "",
  onForm,
}: {
  className?: string;
  /** Fires with the held shape while it is assembled, null while drifting, so
   *  the copy underneath can SELL what Val just made rather than label it. */
  onForm?: (shape: { id: string; says: string[]; closing: boolean } | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const formCb = useRef(onForm);
  formCb.current = onForm;

  useEffect(() => {
    const cv = canvas.current;
    const box = host.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // Fibonacci sphere: an even shell, not a clumped random one.
    const shell = (i: number, n: number) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(phi) * r, y, Math.sin(phi) * r] as P3;
    };

    const core = Array.from({ length: CORE }, (_, i) => {
      const [x, y, z] = shell(i, CORE);
      return { x, y, z, r: 0.46 + (i % 5) * 0.012, size: 0.7 + ((i * 7919) % 100) / 140, px: 0, py: 0, seen: false };
    });
    // THE MESH. Each node wired to its two nearest neighbours on the shell,
    // computed once at start-up — that is what turns a cloud of dots into
    // something that reads as a brain rather than a snow globe. Naive nearest-
    // neighbour is O(n^2) but it runs exactly once, on ~340 points.
    const WIRES: [number, number][] = [];
    for (let i = 0; i < core.length; i++) {
      let b1 = -1, b2 = -1, d1 = Infinity, d2 = Infinity;
      for (let j = 0; j < core.length; j++) {
        if (i === j) continue;
        const dx = core[i].x - core[j].x;
        const dy = core[i].y - core[j].y;
        const dz = core[i].z - core[j].z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = j; }
        else if (d < d2) { d2 = d; b2 = j; }
      }
      if (b1 > i) WIRES.push([i, b1]);
      if (b2 > i) WIRES.push([i, b2]);
    }

    const builders = Array.from({ length: BUILDERS }, (_, i) => {
      const [x, y, z] = shell(i, BUILDERS);
      return {
        x, y, z,
        r: 0.72 + (i % 9) * 0.03,
        size: 0.75 + ((i * 6151) % 100) / 110,
        lag: ((i * 5407) % 100) / 100, // staggers the shot so they arrive in waves
        px: 0, py: 0, seen: false,
      };
    });

    // A HUD ring is a great circle in a fixed plane — three of them, tilted.
    const RING_PTS = 90;
    const rings = [
      { tilt: 0, roll: 0, r: 0.62 },
      { tilt: 1.15, roll: 0.5, r: 0.7 },
      { tilt: -0.75, roll: 1.9, r: 0.78 },
    ].map((cfg) => ({
      ...cfg,
      pts: Array.from({ length: RING_PTS + 1 }, (_, i) => {
        const a = (i / RING_PTS) * Math.PI * 2;
        const x = Math.cos(a) * cfg.r;
        const z = Math.sin(a) * cfg.r;
        const y = 0;
        // pre-tilt into its own plane
        const y1 = y * Math.cos(cfg.tilt) - z * Math.sin(cfg.tilt);
        const z1 = y * Math.sin(cfg.tilt) + z * Math.cos(cfg.tilt);
        const x2 = x * Math.cos(cfg.roll) - y1 * Math.sin(cfg.roll);
        const y2 = x * Math.sin(cfg.roll) + y1 * Math.cos(cfg.roll);
        return [x2, y2, z1] as P3;
      }),
    }));

    let w = 0;
    let h = 0;
    let unit = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = box.getBoundingClientRect();
      w = r.width;
      h = r.height;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      unit = Math.min(w, h) / 2;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    let raf = 0;
    let announced: string | null | undefined;
    let yaw = 0;
    let last = 0;
    let lockAt = -1;
    const start = performance.now();

    const frame = (now: number) => {
      // The rAF timestamp can precede the start captured just before scheduling
      // it; a negative t made the phase index -1 and the whole loop threw.
      const t = Math.max(0, now - start);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;

      const form = FORMS[Math.floor(t / PHASE) % FORMS.length] ?? FORMS[0];
      const p = t % PHASE;

      let pull = 0;
      let shooting = false;
      let spin = 1;     // yaw multiplier — the wind-up
      let burst = 0;    // radial throw, in units of the shape's own radius
      let vis = 1;      // fades the builders out on the way out, in on return
      let closing = false;
      const t2 = DRIFT + GATHER;
      const t3 = t2 + HOLD;
      const t4 = t3 + SPINUP;
      if (p < DRIFT) {
        pull = 0;
        vis = Math.min(1, p / 700); // come back gently after the throw
      } else if (p < t2) {
        pull = easeInOut((p - DRIFT) / GATHER);
        shooting = true;
      } else if (p < t3) {
        pull = 1;
      } else if (p < t4) {
        const u = (p - t3) / SPINUP;
        pull = 1;
        spin = 1 + 9 * u * u; // accelerate, don't ramp
        closing = u > 0.35;
      } else {
        const u = (p - t4) / BURST;
        pull = 1;
        spin = 1 + 9 * (1 - u);
        burst = u * u * 2.8;
        vis = Math.max(0, 1 - u * 1.2);
        shooting = true;
        closing = true;
      }
      if (calm) {
        pull = 0;
        spin = 1;
        burst = 0;
        vis = 1;
        closing = false;
      }

      // The copy follows the motion: it cycles through the hold, then locks
      // onto the closing line as Val winds up to throw the shape.
      const heldId = pull > 0.9 ? `${form.id}:${closing ? "close" : "hold"}` : null;
      if (heldId !== announced) {
        announced = heldId;
        if (heldId && !closing) lockAt = t;
        formCb.current?.(pull > 0.9 ? { id: form.id, says: form.says, closing } : null);
      }

      // Fast while loose, calmer while holding a shape so it can be read —
      // but never stopped: a symbol that keeps turning gets looked at twice.
      if (!calm) yaw += dt * (0.95 - 0.45 * pull) * spin;
      const pitch = calm ? -0.1 : Math.sin(t / 1000 * 0.29) * 0.36 - 0.1;
      const cy_ = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const project = (x: number, y: number, z: number) => {
        const x1 = x * cy_ + z * sy;
        const z1 = z * cy_ - x * sy;
        const y1 = y * cp - z1 * sp;
        const z2 = z1 * cp + y * sp;
        const persp = 1 / (1 + z2 * 0.55);
        return { px: w / 2 + x1 * unit * 0.94 * persp, py: h / 2 + y1 * unit * 0.94 * persp, persp };
      };

      // Trails: fade what's there instead of wiping it, keeping transparency.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${calm ? 1 : shooting ? 0.2 : 0.5})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // ---- the plinth: a grid the whole thing turns above ----
      const GR = 1.15;
      ctx.strokeStyle = `rgba(217,174,100,${0.06 + pull * 0.05})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let g = -4; g <= 4; g++) {
        const c = (g / 4) * GR;
        const a1 = project(c, 0.98, -GR);
        const a2 = project(c, 0.98, GR);
        ctx.moveTo(a1.px, a1.py);
        ctx.lineTo(a2.px, a2.py);
        const b1 = project(-GR, 0.98, c);
        const b2 = project(GR, 0.98, c);
        ctx.moveTo(b1.px, b1.py);
        ctx.lineTo(b2.px, b2.py);
      }
      ctx.stroke();

      // ---- HUD rings: the part that reads as machinery ----
      const ringAlpha = 0.1 + (1 - pull) * 0.16;
      for (const rg of rings) {
        ctx.beginPath();
        for (let i = 0; i < rg.pts.length; i++) {
          const [x, y, z] = rg.pts[i];
          const q = project(x, y, z);
          if (i === 0) ctx.moveTo(q.px, q.py);
          else ctx.lineTo(q.px, q.py);
        }
        ctx.strokeStyle = `rgba(217,174,100,${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ---- the lock pulse: a ring thrown outward when a shape snaps ----
      if (lockAt >= 0) {
        const age = (t - lockAt) / 1800;
        if (age < 1) {
          const rr = unit * (0.34 + age * 0.95);
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${form.accent[0]},${form.accent[1]},${form.accent[2]},${0.3 * (1 - age)})`;
          ctx.lineWidth = 1.8 * (1 - age);
          ctx.stroke();
        } else lockAt = -1;
      }

      const [ar, ag, ab] = form.accent;

      // ---- the bodies of light: Val herself ----
      // They pull in and dim while a symbol is held, so the silhouette reads
      // instead of fighting a wall of glow behind it.
      const flare = 1 + burst * 0.55 + (spin - 1) * 0.05;
      const orbScale = (1 - 0.42 * pull) * flare;
      const orbGain = (1 - 0.62 * pull) * flare;
      const orbDraw = 1 - 0.5 * pull; // pulled in behind the shape, watching
      for (const o of ORBS) {
        const a = t / 1000 * o.speed + o.phase;
        const ox = Math.cos(a) * o.orbit * orbDraw;
        const oz = Math.sin(a) * o.orbit * orbDraw;
        const oy = Math.sin(a * 1.7 + o.phase) * o.orbit * 0.5 * Math.cos(o.tilt) * orbDraw;
        const q = project(ox, oy, oz);
        const rad = Math.max(2, o.r * unit * q.persp * orbScale);
        const g = ctx.createRadialGradient(q.px, q.py, 0, q.px, q.py, rad);
        const peak = (0.2 + q.persp * 0.14) * orbGain;
        g.addColorStop(0, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${peak})`);
        g.addColorStop(0.3, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${peak * 0.5})`);
        g.addColorStop(0.62, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${peak * 0.16})`);
        g.addColorStop(1, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(q.px, q.py, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- the mesh: Val thinking ----
      // Drawn before the nodes so the dots sit on top of their own wiring, and
      // dimmed while a symbol is held so it never competes with the silhouette.
      const wireA = (0.055 + (1 - pull) * 0.05) * vis;
      if (wireA > 0.004) {
        ctx.strokeStyle = `rgba(200,214,224,${wireA})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (const [i, j] of WIRES) {
          const a2 = core[i];
          const b2 = core[j];
          const qa = project(a2.x * a2.r, a2.y * a2.r, a2.z * a2.r);
          const qb = project(b2.x * b2.r, b2.y * b2.r, b2.z * b2.r);
          ctx.moveTo(qa.px, qa.py);
          ctx.lineTo(qb.px, qb.py);
        }
        ctx.stroke();
      }

      // ---- the core: Val, always there ----
      for (const d of core) {
        const q = project(d.x * d.r, d.y * d.r, d.z * d.r);
        const depth = Math.min(1, Math.max(0, (q.persp - 0.66) / 0.9));
        const a = (0.1 + depth * 0.34) * vis;
        ctx.beginPath();
        ctx.arc(q.px, q.py, Math.max(0.35, d.size * q.persp * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,232,238,${a})`;
        ctx.fill();
      }

      // ---- the builders: the ones that go and make something ----
      //
      // Two passes on purpose. The first works out where every particle is and
      // parks it; the second JOINS them into the wireframe they were sampled
      // from. That join is the whole difference between a cloud of dots that
      // vaguely suggests a house and an object that looks machined — and it
      // costs one array and a second loop.
      const bx2 = new Float32Array(builders.length);
      const by2 = new Float32Array(builders.length);
      const ba = new Float32Array(builders.length);
      const bs = new Float32Array(builders.length);

      // A scan plane travelling through the object while it assembles: dots
      // near it flare as they are "read in".
      const sweepY = shooting && pull < 1 ? -1.1 + pull * 2.2 : 99;

      for (let i = 0; i < builders.length; i++) {
        const d = builders[i];
        const tgt = form.pts[i];
        // Stagger so they arrive in waves rather than as one blob.
        const k = Math.min(1, Math.max(0, pull * (1 + d.lag * 0.5) - d.lag * 0.35));
        const hx = d.x * d.r;
        const hy = d.y * d.r;
        const hz = d.z * d.r;
        let px2 = hx + (tgt[0] - hx) * k;
        let py2 = hy + (tgt[1] - hy) * k;
        let pz2 = hz + (tgt[2] - hz) * k;
        if (burst > 0) {
          // Outward along its own line from the centre, plus a nudge along the
          // resting shell so particles sitting near the middle still go.
          px2 = px2 * (1 + burst) + d.x * burst * 0.5;
          py2 = py2 * (1 + burst) + d.y * burst * 0.5;
          pz2 = pz2 * (1 + burst) + d.z * burst * 0.5;
        }
        const q = project(px2, py2, pz2);
        const depth = Math.min(1, Math.max(0, (q.persp - 0.66) / 0.9));
        const flash = Math.max(0, 1 - Math.abs(py2 - sweepY) * 7);

        // Streak: only while actually travelling, and only if it moved.
        if (shooting && d.seen) {
          const dx = q.px - d.px;
          const dy = q.py - d.py;
          const sp2 = dx * dx + dy * dy;
          if (sp2 > 0.35) {
            ctx.beginPath();
            ctx.moveTo(d.px, d.py);
            ctx.lineTo(q.px, q.py);
            ctx.strokeStyle = `rgba(246,244,238,${Math.min(0.32, sp2 / 60) * vis})`;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }
        d.px = q.px;
        d.py = q.py;
        d.seen = true;

        bx2[i] = q.px;
        by2[i] = q.py;
        ba[i] = (((0.1 + k * 0.5) + depth * 0.42) + flash * 0.5) * vis;
        bs[i] = Math.max(0.35, d.size * q.persp * (0.8 + k * 0.4) * (1 + flash * 0.6));
      }

      // The wireframe itself, drawn between particles that share an edge. It
      // fades in with the shape, so a drifting cloud stays a cloud.
      if (pull > 0.25) {
        const edge = (pull - 0.25) / 0.75;
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.3 * edge * vis})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (let i = 1; i < builders.length; i++) {
          if (!form.link[i]) continue;
          const dx = bx2[i] - bx2[i - 1];
          const dy = by2[i] - by2[i - 1];
          // Never bridge a gap: a long "edge" means the two samples are on
          // opposite sides of the object, not next to each other.
          if (dx * dx + dy * dy > unit * unit * 0.09) continue;
          ctx.moveTo(bx2[i - 1], by2[i - 1]);
          ctx.lineTo(bx2[i], by2[i]);
        }
        ctx.stroke();
      }

      for (let i = 0; i < builders.length; i++) {
        ctx.beginPath();
        ctx.arc(bx2[i], by2[i], bs[i], 0, Math.PI * 2);
        // White. The colour in this picture is Val; the shape is the light she
        // is watching get built, and it reads far cleaner against her bloom.
        ctx.fillStyle = `rgba(246,244,238,${Math.min(0.95, ba[i])})`;
        ctx.fill();
      }

      // No vignette here. A canvas-local one can only ever darken toward the
      // canvas's own corners, which draws a visible square against the page
      // behind it — the exact box artifact this screen kept growing.
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    const onVis = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={host} className={`pointer-events-none ${className}`} aria-hidden>
      <canvas ref={canvas} className="block h-full w-full" />
    </div>
  );
}
