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

const RAIL_D = 0.05;
/** Nine milestones on a rail, four behind you, one ringed as today. This is
 *  Track to Keys drawn the way it actually behaves — the whole product is that
 *  the chain is visible before any link in it snaps. */
const RAIL_X = (i: number) => -0.78 + i * 0.195;
const railAxis: [number, number][] = [[-0.82, 0], [0.82, 0]];
const railDone: [number, number][] = [[-0.78, -0.09], [RAIL_X(4), -0.09]];
const railNodes: [number, number][][] = Array.from({ length: 9 }, (_, i) =>
  ring(RAIL_X(i), 0, i === 4 ? 0.1 : 0.055, i === 4 ? 16 : 10)
);
const railNow: [number, number][] = ring(RAIL_X(4), 0, 0.17, 20);
const railTicks: [number, number][][] = Array.from({ length: 9 }, (_, i) => [
  [RAIL_X(i), 0.07], [RAIL_X(i), i % 2 === 0 ? 0.3 : 0.22],
] as [number, number][]);
/** The far end: a door you get the keys to. */
const railDoor: [number, number][] = [[0.66, -0.2], [0.9, -0.2], [0.9, -0.62], [0.66, -0.62], [0.66, -0.2]];
const railFlag: [number, number][] = [[-0.78, -0.09], [-0.78, -0.5], [-0.5, -0.4], [-0.78, -0.3]];

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
    id: "timeline",
    says: [
      "Binding. Earnest money. Loan application. Due diligence. Appraisal.",
      "Four behind you, one today, four still coming \u2014 and you can see all nine.",
      "Your client gets the same chain, in plain English, as a link you text.",
      "Track to Keys. The contract always had these dates. Nobody ever showed them.",
    ],
    accent: [201, 124, 92],
    lines: [
      at(railAxis, RAIL_D), at(railAxis, -RAIL_D),
      at(railDone, RAIL_D), at(railDone, -RAIL_D),
      ...railNodes.map((n) => at(n, RAIL_D)),
      ...railNodes.map((n) => at(n, -RAIL_D)),
      at(railNow, RAIL_D), at(railNow, -RAIL_D),
      ...railTicks.map((tk) => at(tk, RAIL_D)),
      at(railDoor, RAIL_D), at(railDoor, -RAIL_D),
      at(railFlag, RAIL_D),
      ...joins([[-0.82, 0], [0.82, 0], [RAIL_X(4), -0.17], [RAIL_X(4), 0.17], [0.66, -0.2], [0.9, -0.2], [0.9, -0.62], [0.66, -0.62]], RAIL_D, -RAIL_D),
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
  { c: [217, 174, 100], r: 0.40, orbit: 0.22, speed: 0.48, phase: 0.0, tilt: 0.2 },
  { c: [111, 168, 126], r: 0.34, orbit: 0.30, speed: -0.39, phase: 2.1, tilt: 1.1 },
  { c: [201, 124, 92], r: 0.28, orbit: 0.27, speed: 0.33, phase: 4.0, tilt: -0.7 },
  { c: [242, 239, 231], r: 0.20, orbit: 0.13, speed: -0.62, phase: 1.0, tilt: 0.5 },
  { c: [124, 186, 214], r: 0.26, orbit: 0.34, speed: 0.44, phase: 5.2, tilt: -1.3 },
];

const TOTAL = 1500;
/** Kept on the sphere at all times, so Val never fully disappears into a shape. */
const CORE = Math.round(TOTAL * 0.38);
const BUILDERS = TOTAL - CORE;

/** Returns the points AND, for each one, whether it continues the same edge
 *  as the point before it. That second array is what lets the renderer draw
 *  the object as a wireframe instead of a dot cloud — joining consecutive
 *  samples only when they actually lie on the same segment, so the pen never
 *  jumps across a gap between two polylines. */
function sample(lines: Line3[], n: number): { pts: P3[]; link: boolean[]; corner: boolean[] } {
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
  const corner: boolean[] = [];
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
        // The first sample to land on a new segment is sitting on a corner.
        corner.push(si !== prevSeg);
        prevSeg = si;
        break;
      }
      d -= s.len;
    }
  }
  while (out.length < n) {
    out.push(out[out.length - 1] ?? [0, 0, 0]);
    link.push(false);
    corner.push(false);
  }
  return { pts: out, link, corner };
}

/** How many builders a small instance uses. The mark that sits on every deck
 *  slide runs at this resolution so eleven slides' worth of canvas never
 *  competes with the room's own laptop for frames. */
const SMALL = 150;

const FORMS = SHAPES.map((s) => {
  const big = sample(s.lines, BUILDERS);
  const small = sample(s.lines, SMALL);
  return {
    id: s.id,
    says: s.says,
    accent: s.accent,
    pts: big.pts,
    link: big.link,
    corner: big.corner,
    ptsS: small.pts,
    linkS: small.link,
    cornerS: small.corner,
  };
});

export const VAL_SYMBOLS = SHAPES.map((s) => s.id);

// Slow on purpose. An earlier pass had the particles SNAP into place with an
// overshoot, which was exciting for half a second and then over. Forming and
// dissolving slowly is the thing people can't look away from — and the room is
// filling up, so there is nowhere to hurry to. A symbol that takes four
// seconds to arrive and turns for twelve gets looked at twice.
const DRIFT = 3000;
const GATHER = 2600;
const HOLD = 8200;
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
  pin,
  quiet = false,
  beat,
}: {
  className?: string;
  /** Any number that changes when the room does something — votes landing,
   *  phones joining, guesses locking. Each change is a heartbeat: the held
   *  symbol flashes and the bodies of light swell for half a second. */
  beat?: number;
  /** Hold one symbol permanently instead of cycling — what the deck mark does,
   *  so each slide gets the shape that belongs to it. */
  pin?: string;
  /** Dimmer, smaller, no plinth and no HUD: a presence, not a performance. */
  quiet?: boolean;
  /** Fires with the held shape while it is assembled, null while drifting, so
   *  the copy underneath can SELL what Val just made rather than label it. */
  onForm?: (shape: { id: string; says: string[]; closing: boolean } | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const formCb = useRef(onForm);
  formCb.current = onForm;
  const beatAt = useRef(-1e9);
  const beatSeen = useRef(beat);
  if (beat !== beatSeen.current) {
    beatSeen.current = beat;
    if (typeof performance !== "undefined") beatAt.current = performance.now();
  }

  useEffect(() => {
    const cv = canvas.current;
    const box = host.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // A quiet mark is a presence, not a performance: fewer nodes, fewer
    // builders, no plinth, no HUD, and it never lets go of its symbol.
    const nCore = quiet ? 120 : CORE;
    const nBuild = quiet ? SMALL : BUILDERS;
    const pinned = pin ? FORMS.findIndex((f) => f.id === pin) : -1;

    // Fibonacci sphere: an even shell, not a clumped random one.
    const shell = (i: number, n: number) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(phi) * r, y, Math.sin(phi) * r] as P3;
    };

    const core = Array.from({ length: nCore }, (_, i) => {
      const [x, y, z] = shell(i, nCore);
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

    const builders = Array.from({ length: nBuild }, (_, i) => {
      const [x, y, z] = shell(i, nBuild);
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

    // THE DIGITAL LAYER. What makes this read as an agent rather than a lamp:
    // a lat/long globe turning inside the machinery, circuit traces that carry
    // packets in and out, and a ring of monospace readout. All geometry is
    // built once here; the frame only projects and strokes it.
    const GLOBE: P3[][] = [];
    const GRAD = 0.57;
    for (let m = 0; m < 4; m++) {
      const a = (m / 4) * Math.PI;
      const c: P3[] = [];
      for (let i = 0; i <= 36; i++) {
        const u = (i / 36) * Math.PI * 2;
        c.push([Math.cos(u) * Math.cos(a) * GRAD, Math.sin(u) * GRAD, Math.cos(u) * Math.sin(a) * GRAD]);
      }
      GLOBE.push(c);
    }
    for (const lat of [-0.5, 0, 0.5]) {
      const rr = Math.sqrt(1 - lat * lat) * GRAD;
      const c: P3[] = [];
      for (let i = 0; i <= 36; i++) {
        const u = (i / 36) * Math.PI * 2;
        c.push([Math.cos(u) * rr, lat * GRAD, Math.sin(u) * rr]);
      }
      GLOBE.push(c);
    }
    // Eight PCB-style traces: out from the core, a quarter-turn along a ring,
    // out again to a pad. Screen-space, in units of the stage radius.
    const TRACES = Array.from({ length: 8 }, (_, i) => {
      const th = (i / 8) * Math.PI * 2 + 0.3;
      const dth = (i % 2 ? 1 : -1) * (0.3 + (i % 3) * 0.12);
      const pol: [number, number][] = [[0.5, th], [0.62, th]];
      for (let k = 1; k <= 8; k++) pol.push([0.62, th + dth * (k / 8)]);
      pol.push([0.78, th + dth]);
      const pts = pol.map(([r, a]) => [Math.cos(a) * r, Math.sin(a) * r] as [number, number]);
      const segs: number[] = [];
      let len = 0;
      for (let k = 1; k < pts.length; k++) {
        const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
        segs.push(d);
        len += d;
      }
      return { pts, segs, len };
    });
    // DATA ZIPS. Short bright streaks in the air. While a shape is being built
    // they fire from the bodies of light INTO the build — the orbs are visibly
    // the ones doing the work — and the rest of the time they cross the stage
    // at a lower rate so the air is never still.
    type Zip = { x: number; y: number; vx: number; vy: number; len: number; life: number; max: number; wait: number; c: number };
    const ZIPS: Zip[] = Array.from({ length: 30 }, (_, i) => ({
      x: 0, y: 0, vx: 0, vy: 0, len: 0, life: 0, max: 1, wait: (i / 30) * 1.5, c: i % 3,
    }));
    const ZIP_COL = ["124,186,214", "246,244,238", "217,174,100"];

    // The readout ring's text. Names of things that exist and hex noise —
    // never a figure, because a figure on a screen is a claim.
    const READOUT =
      "VAL·OS ▸ SPEED·TO·LEAD ▸ TRACK·TO·KEYS ▸ FRONT·DESK ▸ MLS·MCP ▸ FAIR·HOUSING·ON ▸ 0x3F7A ▸ ROUTING ▸ 0xC41D ▸ CONTENT·MACHINE ▸ 0x9B2E ▸ ";

    let w = 0;
    let h = 0;
    let unit = 0;
    // The baked readout ring, rebuilt only when the box resizes.
    let ringCv: HTMLCanvasElement | null = null;
    let ringR = 0;
    let hudCvA: HTMLCanvasElement | null = null;
    let hudCvB: HTMLCanvasElement | null = null;
    let hudSide = 0;
    const bakeHud = () => {
      if (quiet || unit < 40) { hudCvA = hudCvB = null; return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      hudSide = Math.ceil(unit * 1.72);
      const mk = (draw: (c: CanvasRenderingContext2D, mid: number) => void) => {
        const cc = document.createElement("canvas");
        cc.width = cc.height = Math.round(hudSide * dpr);
        const c2 = cc.getContext("2d");
        if (!c2) return null;
        c2.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(c2, hudSide / 2);
        return cc;
      };
      hudCvA = mk((c2, mid) => {
        c2.setLineDash([unit * 0.5, unit * 0.32]);
        c2.lineWidth = 1.1;
        c2.strokeStyle = "rgba(217,174,100,1)";
        c2.beginPath();
        c2.arc(mid, mid, unit * 0.74, 0, Math.PI * 2);
        c2.stroke();
      });
      hudCvB = mk((c2, mid) => {
        c2.setLineDash([unit * 0.09, unit * 0.06]);
        c2.lineWidth = 1.1;
        c2.strokeStyle = "rgba(124,186,214,1)";
        c2.beginPath();
        c2.arc(mid, mid, unit * 0.665, 0, Math.PI * 2);
        c2.stroke();
        c2.setLineDash([]);
        c2.beginPath();
        for (let i = 0; i < 72; i++) {
          const ang = (i / 72) * Math.PI * 2;
          const len = i % 6 === 0 ? 0.035 : 0.016;
          const ca = Math.cos(ang), sa = Math.sin(ang);
          c2.moveTo(mid + ca * unit * 0.8, mid + sa * unit * 0.8);
          c2.lineTo(mid + ca * unit * (0.8 + len), mid + sa * unit * (0.8 + len));
        }
        c2.lineWidth = 1;
        c2.strokeStyle = "rgba(124,186,214,0.9)";
        c2.stroke();
      });
    };
    const bakeReadout = () => {
      if (quiet || unit < 40) { ringCv = null; return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const fs = Math.max(8, Math.round(unit * 0.05));
      ringR = unit * 0.88;
      const side = Math.ceil((ringR + fs) * 2);
      const cc = document.createElement("canvas");
      cc.width = Math.round(side * dpr);
      cc.height = Math.round(side * dpr);
      const c2 = cc.getContext("2d");
      if (!c2) { ringCv = null; return; }
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      c2.font = `600 ${fs}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
      c2.textAlign = "center";
      c2.textBaseline = "middle";
      c2.fillStyle = "rgba(217,174,100,1)";
      const mid = side / 2;
      const stepA = (fs * 0.66) / ringR;
      const nChars = Math.floor((Math.PI * 2) / stepA);
      for (let i = 0; i < nChars; i++) {
        const ch = READOUT[i % READOUT.length];
        if (ch === " ") continue;
        const a = i * stepA;
        c2.save();
        c2.translate(mid + Math.cos(a) * ringR, mid + Math.sin(a) * ringR);
        c2.rotate(a + Math.PI / 2);
        c2.fillText(ch, 0, 0);
        c2.restore();
      }
      ringCv = cc;
    };
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
      bakeReadout();
      bakeHud();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    let raf = 0;
    let lite = false;
    let avgDt = 16.7;
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
      if (last) {
        avgDt += ((now - last) - avgDt) * 0.06;
        // ~45fps down, ~57fps back up: wide enough that it can't flap.
        if (!lite && avgDt > 22) lite = true;
        else if (lite && avgDt < 17.5) lite = false;
      }
      last = now;
      // The room's pulse: 1 at the instant something lands, gone in half a second.
      const heart = Math.exp(-Math.max(0, now - beatAt.current) / 260);

      const form = pinned >= 0
        ? FORMS[pinned]
        : (FORMS[Math.floor(t / PHASE) % FORMS.length] ?? FORMS[0]);
      const pts = quiet ? form.ptsS : form.pts;
      const link = quiet ? form.linkS : form.link;
      const corner = quiet ? form.cornerS : form.corner;
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
        // ANTICIPATION. The particles breathe OUT for a beat before they rush
        // in — the wind-up before the pitch. Everything that moves well moves
        // the wrong way first.
        const u = (p - DRIFT) / GATHER;
        pull = u < 0.14
          ? -0.09 * Math.sin((u / 0.14) * Math.PI)
          : easeInOut((u - 0.14) / 0.86);
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
      if (pinned >= 0) {
        // Held, always — with a slow swell so it is alive without being a show.
        pull = calm ? 1 : 0.9 + Math.sin(t / 1000 * 0.42) * 0.1;
        spin = 1;
        burst = 0;
        vis = 1;
        closing = false;
        shooting = false;
      } else if (calm) {
        pull = 0;
        spin = 1;
        burst = 0;
        vis = 1;
        closing = false;
      }

      // The copy follows the motion: it cycles through the hold, then locks
      // onto the closing line as Val winds up to throw the shape.
      const heldId = quiet ? null : pull > 0.9 ? `${form.id}:${closing ? "close" : "hold"}` : null;
      if (heldId !== announced) {
        announced = heldId;
        if (heldId && !closing) lockAt = t;
        formCb.current?.(pull > 0.9 ? { id: form.id, says: form.says, closing } : null);
      }

      // Fast while loose, calmer while holding a shape so it can be read —
      // but never stopped: a symbol that keeps turning gets looked at twice.
      if (!calm) yaw += dt * (1.25 - 0.5 * pull) * spin;
      const pitch = calm ? -0.1 : Math.sin(t / 1000 * 0.29) * 0.36 - 0.1;
      const cy_ = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const project = (x: number, y: number, z: number) => {
        const x1 = x * cy_ + z * sy;
        const z1 = z * cy_ - x * sy;
        const y1 = y * cp - z1 * sp;
        const z2 = z1 * cp + y * sp;
        const persp = 1 / (1 + z2 * 0.55);
        return { px: w / 2 + x1 * unit * 0.94 * persp, py: h / 2 + y1 * unit * 0.94 * persp, persp, x1, y1, z2 };
      };

      // THE LIGHTING RIG. Two lights, the way every animated feature is lit:
      // a warm key from upper-left-front, a cool fill from the opposite side.
      // A point's direction from the object's centre stands in for its normal
      // — exact for a sphere, convincing for anything roughly convex, and it
      // turns correctly with the object. Faces toward the key go cream, faces
      // away go a cool deep blue, and the object stops being a flat drawing.
      const KEY = [-0.52, -0.66, 0.54]; // normalised below
      const KL = Math.hypot(KEY[0], KEY[1], KEY[2]);
      const kx = KEY[0] / KL, ky = KEY[1] / KL, kz = KEY[2] / KL;
      const lit = (x1: number, y1: number, z2: number) => {
        const L = Math.hypot(x1, y1, z2) || 1;
        const d = (x1 / L) * kx + (y1 / L) * ky + (z2 / L) * kz; // -1..1
        return 0.5 + 0.5 * d; // 0 = full fill side, 1 = full key side
      };

      // Trails: fade what's there instead of wiping it, keeping transparency.
      ctx.globalCompositeOperation = "destination-out";
      const fadeA = calm ? 1 : burst > 0 ? 0.2 : shooting ? 0.42 : 0.5;
      ctx.fillStyle = `rgba(0,0,0,${fadeA})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      // Anything redrawn identically every frame settles at alpha/fadeA under
      // this trail scheme, so static HUD strokes are scaled by the fade to
      // land where they're written. Moving things keep their trails.
      const st = fadeA * 1.3;

      // ---- the plinth: a grid the whole thing turns above ----
      const GR = 1.15;
      if (!quiet) {
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
      }

      // ---- the digital layer: globe, dashed rings, sweep, traces, readout ----
      // Thin and cool-toned against Val's warm bodies; steps back to half
      // while a symbol holds so the silhouette is never fighting a dashboard.
      const hud = quiet ? 0 : 0.5 + 0.5 * (1 - Math.max(0, pull));
      if (hud > 0) {
        const ccx = w / 2, ccy = h / 2;
        const gphi = t * 0.00025 - yaw * 0.45;
        const gc = Math.cos(gphi), gs = Math.sin(gphi);
        const tc = Math.cos(0.42), ts = Math.sin(0.42);
        const nearP = new Path2D();
        const farP = new Path2D();
        for (const circle of GLOBE) {
          let prev: ReturnType<typeof project> | null = null;
          for (const [x, y, z] of circle) {
            const x1 = x * gc + z * gs, z1 = z * gc - x * gs;
            const y2 = y * tc - z1 * ts, z2 = z1 * tc + y * ts;
            const q = project(x1, y2, z2);
            if (prev) {
              const path = q.z2 < 0 && prev.z2 < 0 ? nearP : farP;
              path.moveTo(prev.px, prev.py);
              path.lineTo(q.px, q.py);
            }
            prev = q;
          }
        }
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = `rgba(124,186,214,${0.08 * hud * st})`;
        ctx.stroke(farP);
        ctx.strokeStyle = `rgba(124,186,214,${0.24 * hud * st})`;
        ctx.stroke(nearP);

        // The two dashed rings and the tick ring, baked; each turns at its own
        // rate, which is exactly what animating a dash offset looked like.
        if (hudCvA && hudCvB) {
          ctx.save();
          ctx.translate(ccx, ccy);
          ctx.globalAlpha = 0.34 * hud * st;
          ctx.rotate(t * 0.00006);
          ctx.drawImage(hudCvA, -hudSide / 2, -hudSide / 2, hudSide, hudSide);
          ctx.rotate(-t * 0.0001);
          ctx.globalAlpha = 0.3 * hud * st;
          ctx.drawImage(hudCvB, -hudSide / 2, -hudSide / 2, hudSide, hudSide);
          ctx.restore();
        }

        // Radar sweep. A conic gradient is the obvious way and it is also the
        // slowest thing on this canvas when there's no GPU behind it, so the
        // wedge is eight flat arcs of falling alpha instead — same read.
        if (!calm) {
          const ang = t * 0.0011;
          const W = 0.55;
          for (let b = 0; b < 8; b++) {
            const a0 = ang - W * ((b + 1) / 8), a1 = ang - W * (b / 8);
            ctx.beginPath();
            ctx.arc(ccx, ccy, unit * 0.71, a0, a1);
            ctx.arc(ccx, ccy, unit * 0.6, a1, a0, true);
            ctx.closePath();
            ctx.fillStyle = `rgba(124,186,214,${0.2 * hud * (1 - b / 8) * 0.5})`;
            ctx.fill();
          }
        }

        // Circuit traces, their pads, and the packets running them.
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgba(124,186,214,${0.16 * hud * st})`;
        ctx.beginPath();
        for (const tr of TRACES) {
          for (let i = 0; i < tr.pts.length; i++) {
            const [x, y] = tr.pts[i];
            if (i === 0) ctx.moveTo(ccx + x * unit, ccy + y * unit);
            else ctx.lineTo(ccx + x * unit, ccy + y * unit);
          }
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(124,186,214,${0.45 * hud * st})`;
        for (const tr of TRACES) {
          const [x, y] = tr.pts[tr.pts.length - 1];
          ctx.fillRect(ccx + x * unit - 2, ccy + y * unit - 2, 4, 4);
        }
        if (!calm) {
          for (let n = 0; n < TRACES.length; n++) {
            const tr = TRACES[n];
            let sfrac = (t * 0.00024 * (1 + (n % 3) * 0.2) + n * 0.37) % 1;
            if (n % 2) sfrac = 1 - sfrac; // odd traces run inbound
            const target = sfrac * tr.len;
            let acc = 0, px = tr.pts[0][0], py = tr.pts[0][1];
            for (let i = 1; i < tr.pts.length; i++) {
              const seg = tr.segs[i - 1];
              if (acc + seg >= target) {
                const f = seg ? (target - acc) / seg : 0;
                px = tr.pts[i - 1][0] + (tr.pts[i][0] - tr.pts[i - 1][0]) * f;
                py = tr.pts[i - 1][1] + (tr.pts[i][1] - tr.pts[i - 1][1]) * f;
                break;
              }
              acc += seg;
            }
            const X = ccx + px * unit, Y = ccy + py * unit;
            ctx.beginPath();
            ctx.arc(X, Y, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(124,186,214,${0.16 * hud})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(X, Y, 1.7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(246,244,238,${0.85 * hud})`;
            ctx.fill();
          }
        }

        // The readout ring: baked once, turned as one image.
        if (ringCv) {
          const side = ringCv.width / Math.min(window.devicePixelRatio || 1, 2);
          ctx.save();
          ctx.globalAlpha = 0.55 * hud * st;
          ctx.translate(ccx, ccy);
          ctx.rotate(-t * 0.00007);
          ctx.drawImage(ringCv, -side / 2, -side / 2, side, side);
          ctx.restore();
        }
      }

      // ---- HUD rings: the part that reads as machinery ----
      const ringAlpha = (quiet ? 0.05 : 0.1) + (1 - pull) * 0.16;
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
      const settleAge = lockAt >= 0 ? (t - lockAt) / 1000 : 9;
      const settle = 1 + (settleAge < 1.6 ? 0.045 * Math.sin(settleAge * 21) * Math.exp(-settleAge * 3.6) : 0);

      // ---- the bodies of light: Val herself ----
      // They pull in and dim while a symbol is held, so the silhouette reads
      // instead of fighting a wall of glow behind it.
      const flare = 1 + burst * 0.55 + (spin - 1) * 0.05 + heart * 0.6;
      const orbScale = (1 - 0.42 * pull) * flare;
      const orbGain = (1 - 0.62 * pull) * flare;
      const orbDraw = 1 - 0.5 * pull; // pulled in behind the shape, watching
      const orbPts: { px: number; py: number }[] = [];
      for (const o of ORBS) {
        const a = t / 1000 * o.speed + o.phase;
        const ox = Math.cos(a) * o.orbit * orbDraw;
        const oz = Math.sin(a) * o.orbit * orbDraw;
        const oy = Math.sin(a * 1.7 + o.phase) * o.orbit * 0.5 * Math.cos(o.tilt) * orbDraw;
        const q = project(ox, oy, oz);
        orbPts.push(q);
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

      // ---- data zips: the air is never still ----
      if (!quiet && !calm && !lite) {
        const building = shooting && burst === 0 && orbPts.length > 0;
        for (const z of ZIPS) {
          if (z.life <= 0) {
            z.wait -= dt;
            if (z.wait > 0 && !building) continue;
            if (building && Math.random() < 0.75) {
              // From a body of light, aimed at the build.
              const o = orbPts[Math.floor(Math.random() * orbPts.length)];
              const ang = Math.atan2(h / 2 - o.py, w / 2 - o.px) + (Math.random() - 0.5) * 1.3;
              const spd = unit * (1.6 + Math.random() * 1.8);
              z.x = o.px; z.y = o.py;
              z.vx = Math.cos(ang) * spd; z.vy = Math.sin(ang) * spd;
              z.len = unit * (0.1 + Math.random() * 0.14);
              z.max = z.life = 0.3 + Math.random() * 0.4;
            } else {
              // Across the stage, mostly level.
              const fromLeft = Math.random() < 0.5;
              const ang = (fromLeft ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
              const spd = unit * (0.9 + Math.random() * 1.3);
              z.x = fromLeft ? 0 : w;
              z.y = h / 2 + (Math.random() - 0.5) * unit * 1.9;
              z.vx = Math.cos(ang) * spd; z.vy = Math.sin(ang) * spd;
              z.len = unit * (0.06 + Math.random() * 0.16);
              z.max = z.life = 0.8 + Math.random() * 1.2;
            }
            z.wait = building ? 0 : 0.4 + Math.random() * 2.4;
          }
          z.life -= dt;
          z.x += z.vx * dt;
          z.y += z.vy * dt;
          const sp = Math.hypot(z.vx, z.vy) || 1;
          const tx = z.x - (z.vx / sp) * z.len, ty = z.y - (z.vy / sp) * z.len;
          const fade = Math.min(1, z.life / 0.2, (z.max - z.life) / 0.1 + 0.15);
          const A = (building ? 0.8 : 0.42) * fade;
          const col = ZIP_COL[z.c];
          const mx = z.x - (z.vx / sp) * z.len * 0.45;
          const my = z.y - (z.vy / sp) * z.len * 0.45;
          ctx.lineWidth = z.c === 1 ? 1.4 : 1;
          ctx.strokeStyle = `rgba(${col},${A * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(mx, my);
          ctx.stroke();
          ctx.strokeStyle = `rgba(${col},${A})`;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(z.x, z.y);
          ctx.stroke();
          ctx.fillStyle = `rgba(${col},${A})`;
          ctx.fillRect(z.x - 1, z.y - 1, 2, 2);
        }
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
      for (let i = 0; i < core.length; i++) {
        const d = core[i];
        const q = project(d.x * d.r, d.y * d.r, d.z * d.r);
        const depth = Math.min(1, Math.max(0, (q.persp - 0.66) / 0.9));
        const rim = 1 - Math.min(1, Math.abs(q.z2) / (d.r * 0.85));
        const L = lit(q.x1, q.y1, q.z2);
        const a = (0.08 + depth * 0.26 + rim * rim * 0.42) * vis;
        const sz = Math.max(0.35, d.size * q.persp * (0.75 + rim * 0.5));
        ctx.fillStyle = `rgba(${Math.round(150 + L * 100)},${Math.round(180 + L * 62)},${Math.round(214 + L * 14)},${a})`;
        // Every seventh node is a pixel, not a dot — the digital grain.
        if (i % 7 === 0) {
          ctx.fillRect(q.px - sz, q.py - sz, sz * 2, sz * 2);
        } else {
          ctx.beginPath();
          ctx.arc(q.px, q.py, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---- THE BLUEPRINT ----
      // Before anything is built, the DRAWING of it is projected: the target
      // wireframe in dashed cyan on a fine drafting grid, CAD markers on every
      // vertex, dimension lines with ticked ends and a sheet number. It turns
      // with the object. The solid, lit wireframe then prints over it under
      // the scan head and the drawing fades as the real thing takes — and it
      // flashes back for a moment as the real thing lets go.
      let bpA = 0;
      if (!quiet && shooting) {
        bpA = burst === 0
          ? Math.min(1, Math.max(0, p - DRIFT) / 180) * Math.min(1, 1.55 - Math.max(0, pull) * 1.55)
          : Math.min(1, burst / 0.8) * Math.max(0, 1 - burst / 2.8);
      }
      if (bpA > 0.01) {
        const dash = new Path2D();
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let lx = 0, ly = 0;
        const verts: [number, number][] = [];
        const bpPts = form.ptsS, bpLink = form.linkS, bpCorner = form.cornerS;
        for (let i = 0; i < bpPts.length; i++) {
          const tg = bpPts[i];
          const q = project(tg[0], tg[1], tg[2]);
          if (q.px < minX) minX = q.px;
          if (q.px > maxX) maxX = q.px;
          if (q.py < minY) minY = q.py;
          if (q.py > maxY) maxY = q.py;
          if (i > 0 && bpLink[i]) {
            const dx = q.px - lx, dy = q.py - ly;
            if (dx * dx + dy * dy < unit * unit * 0.09) {
              dash.moveTo(lx, ly);
              dash.lineTo(q.px, q.py);
            }
          }
          if (bpCorner[i]) verts.push([q.px, q.py]);
          lx = q.px; ly = q.py;
        }
        const padX = (maxX - minX) * 0.1 + 6, padY = (maxY - minY) * 0.1 + 6;
        const bx0 = minX - padX, bx1 = maxX + padX, by0 = minY - padY, by1 = maxY + padY;
        const BP = "120,200,255";
        // the sheet: a drafting grid clipped to the drawing's bounds
        if (!lite) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx0, by0, bx1 - bx0, by1 - by0);
        ctx.clip();
        ctx.strokeStyle = `rgba(${BP},${0.07 * bpA * st})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        const gstep = unit * 0.055;
        for (let x = bx0; x <= bx1; x += gstep) { ctx.moveTo(x, by0); ctx.lineTo(x, by1); }
        for (let y = by0; y <= by1; y += gstep) { ctx.moveTo(bx0, y); ctx.lineTo(bx1, y); }
        ctx.stroke();
        ctx.restore();
        }
        // the drawing itself: a soft pass, then the dashed line
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(${BP},${0.12 * bpA * st})`;
        ctx.stroke(dash);
        ctx.setLineDash([unit * 0.022, unit * 0.014]);
        ctx.lineDashOffset = -t * 0.02;
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = `rgba(${BP},${0.8 * bpA * st})`;
        ctx.stroke(dash);
        ctx.setLineDash([]);
        // vertex markers
        ctx.strokeStyle = `rgba(${BP},${0.7 * bpA * st})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (const [vx, vy] of verts) {
          ctx.moveTo(vx + 3.5, vy);
          ctx.arc(vx, vy, 3.5, 0, Math.PI * 2);
          ctx.moveTo(vx - 6, vy); ctx.lineTo(vx + 6, vy);
          ctx.moveTo(vx, vy - 6); ctx.lineTo(vx, vy + 6);
        }
        ctx.stroke();
        // dimension lines: top and left, ticked, with extension lines
        const off = unit * 0.075, tick = unit * 0.02;
        ctx.strokeStyle = `rgba(${BP},${0.55 * bpA * st})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(bx0, by0 - off); ctx.lineTo(bx1, by0 - off);
        ctx.moveTo(bx0, by0 - off - tick); ctx.lineTo(bx0, by0 - off + tick);
        ctx.moveTo(bx1, by0 - off - tick); ctx.lineTo(bx1, by0 - off + tick);
        ctx.moveTo(bx0, by0 - off - tick * 1.6); ctx.lineTo(bx0, by0);
        ctx.moveTo(bx1, by0 - off - tick * 1.6); ctx.lineTo(bx1, by0);
        ctx.moveTo(bx0 - off, by0); ctx.lineTo(bx0 - off, by1);
        ctx.moveTo(bx0 - off - tick, by0); ctx.lineTo(bx0 - off + tick, by0);
        ctx.moveTo(bx0 - off - tick, by1); ctx.lineTo(bx0 - off + tick, by1);
        ctx.moveTo(bx0 - off - tick * 1.6, by1); ctx.lineTo(bx0, by1);
        ctx.stroke();
        const fs = Math.max(8, Math.round(unit * 0.038));
        ctx.font = `600 ${fs}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = `rgba(${BP},${0.8 * bpA * st})`;
        const fi = FORMS.indexOf(form);
        ctx.fillText(`SHEET A-${String(fi + 1).padStart(2, "0")}`, (bx0 + bx1) / 2, by0 - off - tick * 1.4);
        ctx.textAlign = "right";
        ctx.fillText(burst > 0 ? "▸ RELEASING" : "▸ PRINTING FROM DRAWING", bx1, by1 + fs * 1.4);
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
      const bl = new Float32Array(builders.length); // key-light factor per particle

      // A scan plane travelling through the object while it assembles: dots
      // near it flare as they are "read in".
      const sweepY = shooting && pull < 1 ? -1.1 + pull * 2.2 : burst > 0 ? 1.1 - (burst / 2.8) * 2.2 : 99;

      for (let i = 0; i < builders.length; i++) {
        const d = builders[i];
        const tgt = pts[i];
        // Stagger so they arrive in waves rather than as one blob.
        const k = Math.min(1, Math.max(0, pull * (1 + d.lag * 0.5) - d.lag * 0.35));
        const hx = d.x * d.r;
        const hy = d.y * d.r;
        const hz = d.z * d.r;
        let px2 = hx + (tgt[0] * settle - hx) * k;
        let py2 = hy + (tgt[1] * settle - hy) * k;
        let pz2 = hz + (tgt[2] * settle - hz) * k;
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
        bl[i] = lit(q.x1, q.y1, q.z2);
        const isCorner = corner[i];
        ba[i] = (((0.1 + k * 0.5) + depth * 0.42) + flash * 0.5 + (isCorner ? k * 0.3 : 0)) * vis;
        bs[i] = Math.max(0.35, d.size * q.persp * (0.8 + k * 0.4) * (1 + flash * 0.6) * (isCorner ? 1.9 : 1));
      }

      // FEED BEAMS. While the shape is forming, every twelfth particle is
      // wired back to the body of light that is building it. Val stops being a
      // backdrop the graphic happens in front of and becomes the thing the
      // graphic is coming out of — which is the entire premise.
      if (!quiet && pull > 0.02 && pull < 0.99 && orbPts.length) {
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let i = 0; i < builders.length; i += 12) {
          const o = orbPts[i % orbPts.length];
          ctx.moveTo(o.px, o.py);
          ctx.lineTo(bx2[i], by2[i]);
        }
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.1 * Math.sin(pull * Math.PI) * vis})`;
        ctx.stroke();
      }

      // The wireframe itself, drawn between particles that share an edge. Two
      // passes: a wide soft one for bloom, then a tight bright one for the
      // actual line. One thin stroke read as a sketch; this reads as an object.
      if (pull > 0.25) {
        // Hologram flicker: a few percent of frame-to-frame noise, enough to
        // read as projected light rather than ink.
        const flick = calm ? 1 : 0.93 + 0.07 * ((((Math.floor(t / 33) * 2654435761) >>> 0) % 1000) / 1000);
        const edge = Math.min(1.25, (pull - 0.25) / 0.75 + heart * 0.5) * flick;
        // Three passes, split by how much key light each edge catches: a warm
        // bright set, a mid set in the shape's own accent, a cool shadow set.
        const warm = new Path2D();
        const mid = new Path2D();
        const cool = new Path2D();
        for (let i = 1; i < builders.length; i++) {
          if (!link[i]) continue;
          const dx = bx2[i] - bx2[i - 1];
          const dy = by2[i] - by2[i - 1];
          if (dx * dx + dy * dy > unit * unit * 0.09) continue;
          const L = bl[i];
          const path = L > 0.66 ? warm : L > 0.36 ? mid : cool;
          path.moveTo(bx2[i - 1], by2[i - 1]);
          path.lineTo(bx2[i], by2[i]);
        }
        ctx.lineWidth = quiet ? 2 : 4.5;
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.13 * edge * vis})`;
        ctx.stroke(warm); ctx.stroke(mid);
        ctx.lineWidth = quiet ? 0.8 : 1.4;
        ctx.strokeStyle = `rgba(252,246,228,${0.8 * edge * vis})`;
        ctx.stroke(warm);
        ctx.strokeStyle = `rgba(${Math.min(255, ar + 20)},${Math.min(255, ag + 20)},${Math.min(255, ab + 20)},${0.55 * edge * vis})`;
        ctx.stroke(mid);
        ctx.strokeStyle = `rgba(118,150,196,${0.4 * edge * vis})`;
        ctx.stroke(cool);

        // GLITCH SLICES. Every couple of seconds, for a few frames, one
        // horizontal band of the held wireframe splits into cyan and magenta
        // copies thrown a few pixels apart. The signature of a hologram.
        if (!calm && !lite && pull > 0.9 && burst === 0) {
          const GP = 2600;
          const gph = t % GP;
          if (gph < 110) {
            const seed = Math.floor(t / GP);
            const bandY = h / 2 + (((seed * 0.618) % 1) - 0.5) * unit * 1.1;
            const bandH = unit * (0.06 + ((seed * 0.382) % 1) * 0.08);
            const off = unit * (quiet ? 0.04 : 0.025);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, bandY, w, bandH);
            ctx.clip();
            ctx.lineWidth = quiet ? 0.8 : 1.3;
            ctx.translate(off, 0);
            ctx.strokeStyle = `rgba(120,230,255,${0.5 * vis})`;
            ctx.stroke(warm);
            ctx.stroke(mid);
            ctx.translate(-off * 2, 0);
            ctx.strokeStyle = `rgba(255,120,200,${0.4 * vis})`;
            ctx.stroke(warm);
            ctx.stroke(mid);
            ctx.restore();
          }
        }
      }

      for (let i = 0; i < builders.length; i++) {
        const L = bl[i];
        const a = Math.min(0.95, ba[i]) * (0.55 + L * 0.45) * (1 - bpA * 0.3);
        // Warm where the key hits, cool where it doesn't.
        const r = Math.round(140 + L * 112), g = Math.round(168 + L * 78), bb = Math.round(206 + L * 24);
        // DEPTH OF FIELD: anything well behind the focal plane gets a soft
        // halo instead of a hard dot, so near reads sharp and far reads far.
        if (bs[i] < 0.9 && !lite) {
          ctx.beginPath();
          ctx.arc(bx2[i], by2[i], bs[i] * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${bb},${a * 0.22})`;
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${r},${g},${bb},${a})`;
        if (i % 9 === 0 && !corner[i]) {
          // A small cross — a registration mark, not a dot.
          const s2 = bs[i] * 1.6;
          ctx.fillRect(bx2[i] - s2, by2[i] - 0.5, s2 * 2, 1);
          ctx.fillRect(bx2[i] - 0.5, by2[i] - s2, 1, s2 * 2);
        } else {
          ctx.beginPath();
          ctx.arc(bx2[i], by2[i], bs[i], 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // THE PRINT HEAD. The scan plane the builders flare on is drawn as a
      // line with a glow band across the object's own width, so the shape
      // visibly prints top-down as it assembles and un-prints on release.
      if (!quiet && sweepY < 50 && vis > 0.05) {
        let minX = Infinity, maxX = -Infinity;
        for (let i = 0; i < builders.length; i++) {
          if (bx2[i] < minX) minX = bx2[i];
          if (bx2[i] > maxX) maxX = bx2[i];
        }
        const sy = h / 2 + sweepY * unit * 0.94 * cp;
        const x0 = minX - unit * 0.06, x1 = maxX + unit * 0.06;
        const bh = unit * 0.13;
        for (let b = 0; lite ? false : b < 4; b++) {
          ctx.fillStyle = `rgba(124,186,214,${0.09 * vis * ((b + 1) / 4) * 0.55})`;
          ctx.fillRect(x0, sy - bh + (b * bh) / 4, x1 - x0, bh / 4);
        }
        // Three segments instead of a gradient: dim, bright, dim — so the head
        // reads as a beam across the object rather than a bar drawn over it.
        const qx = (x1 - x0) / 4;
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(160,220,245,${0.12 * vis})`;
        ctx.beginPath();
        ctx.moveTo(x0, sy); ctx.lineTo(x0 + qx, sy);
        ctx.moveTo(x1 - qx, sy); ctx.lineTo(x1, sy);
        ctx.stroke();
        ctx.strokeStyle = `rgba(160,220,245,${0.34 * vis})`;
        ctx.beginPath();
        ctx.moveTo(x0 + qx, sy); ctx.lineTo(x1 - qx, sy);
        ctx.stroke();
        ctx.fillStyle = `rgba(160,220,245,${0.5 * vis})`;
        ctx.fillRect(x0 - 2.5, sy - 2.5, 5, 5);
        ctx.fillRect(x1 - 2.5, sy - 2.5, 5, 5);
        // The bodies of light drive the head: each one is tethered to the
        // nearer end of it, so the printing is visibly theirs.
        if (orbPts.length) {
          ctx.lineWidth = 0.9;
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.2 * vis})`;
          ctx.beginPath();
          for (const o of orbPts) {
            ctx.moveTo(o.px, o.py);
            ctx.lineTo(Math.abs(o.px - x0) < Math.abs(o.px - x1) ? x0 : x1, sy);
          }
          ctx.stroke();
        }
      }

      // TARGET BRACKETS + READOUT. Four corners lock onto the object's bounds
      // as it materialises, with a bar that fills as it does. Nothing here
      // names the object — the copy under the stage sells it — and the only
      // number on it is one this file can vouch for: the node count.
      if (!quiet && pull > 0.3 && vis > 0.2 && burst === 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < builders.length; i++) {
          if (bx2[i] < minX) minX = bx2[i];
          if (bx2[i] > maxX) maxX = bx2[i];
          if (by2[i] < minY) minY = by2[i];
          if (by2[i] > maxY) maxY = by2[i];
        }
        const padX = (maxX - minX) * 0.06 + 4, padY = (maxY - minY) * 0.06 + 4;
        minX -= padX; maxX += padX; minY -= padY; maxY += padY;
        const on = Math.min(1, (pull - 0.3) / 0.3) * vis * st;
        const L = Math.min(unit * 0.07, (maxX - minX) * 0.2);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(217,174,100,${0.75 * on})`;
        ctx.beginPath();
        const cornersPx: [number, number, number, number][] = [
          [minX, minY, 1, 1], [maxX, minY, -1, 1], [minX, maxY, 1, -1], [maxX, maxY, -1, -1],
        ];
        for (const [x, y, dx, dy] of cornersPx) {
          ctx.moveTo(x + dx * L, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + dy * L);
        }
        ctx.stroke();
        const fs = Math.max(8, Math.round(unit * 0.042));
        ctx.font = `600 ${fs}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
        ctx.fillStyle = `rgba(217,174,100,${0.9 * on})`;
        const fi = FORMS.indexOf(form);
        ctx.fillText(`▸ RENDER ${String(fi + 1).padStart(2, "0")}/${FORMS.length} · ${builders.length} NODES`, minX, minY - fs * 0.9);
        ctx.textAlign = "right";
        ctx.fillText(pull < 0.999 ? "MATERIALIZING" : closing ? "RELEASE" : "LOCKED", maxX, minY - fs * 0.9);
        const bw = Math.min(unit * 0.3, maxX - minX);
        ctx.fillStyle = `rgba(217,174,100,${0.2 * on})`;
        ctx.fillRect(minX, minY - fs * 0.45, bw, 2);
        ctx.fillStyle = `rgba(217,174,100,${0.85 * on})`;
        ctx.fillRect(minX, minY - fs * 0.45, bw * Math.min(1, (pull - 0.3) / 0.7), 2);
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
