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
/** A rounded rectangle, centred, y down. Corners are what separate a phone
 *  from a box, so they get real arcs rather than a chamfer. */
const rrect = (w: number, h: number, r: number, seg = 5): [number, number][] => {
  const p: [number, number][] = [];
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (a1 - a0) * (i / seg);
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  arc(w - r, -(h - r), -Math.PI / 2, 0);
  arc(w - r, h - r, 0, Math.PI / 2);
  arc(-(w - r), h - r, Math.PI / 2, Math.PI);
  arc(-(w - r), -(h - r), Math.PI, Math.PI * 1.5);
  p.push(p[0]);
  return p;
};
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

/** THE REST OF THE ALPHABET — so the mark can spell a person's name.
 *  Same 0..1 box, same y-down convention, same single-stroke construction as
 *  the four above. Drawn as polylines rather than outlines because that is
 *  what the sampler eats: it walks a path by arc length and drops builders
 *  along it, so a letter is a route, not a region. Geometric and slightly
 *  condensed to sit beside Archivo without arguing with it. */
const ALPHA: Record<string, [number, number][][]> = {
  A: [[[0.05, 1], [0.5, 0], [0.95, 1]], [[0.21, 0.66], [0.79, 0.66]]],
  B: [[[0.13, 0], [0.13, 1]], [[0.13, 0], [0.62, 0.05], [0.8, 0.26], [0.58, 0.48], [0.13, 0.5]],
      [[0.13, 0.5], [0.66, 0.55], [0.86, 0.76], [0.62, 0.97], [0.13, 1]]],
  C: [[[0.92, 0.17], [0.6, 0.01], [0.2, 0.15], [0.08, 0.5], [0.2, 0.85], [0.6, 0.99], [0.92, 0.83]]],
  E: [[[0.9, 0.02], [0.14, 0.02], [0.14, 0.98], [0.9, 0.98]], [[0.14, 0.5], [0.72, 0.5]]],
  F: [[[0.9, 0.02], [0.14, 0.02], [0.14, 1]], [[0.14, 0.5], [0.7, 0.5]]],
  G: [[[0.92, 0.17], [0.6, 0.01], [0.2, 0.15], [0.08, 0.5], [0.2, 0.85], [0.6, 0.99], [0.9, 0.81], [0.9, 0.55], [0.56, 0.55]]],
  H: [[[0.14, 0], [0.14, 1]], [[0.86, 0], [0.86, 1]], [[0.14, 0.5], [0.86, 0.5]]],
  I: [[[0.5, 0.02], [0.5, 0.98]], [[0.24, 0.02], [0.76, 0.02]], [[0.24, 0.98], [0.76, 0.98]]],
  J: [[[0.74, 0.02], [0.74, 0.74], [0.57, 0.97], [0.27, 0.97], [0.12, 0.75]]],
  K: [[[0.14, 0], [0.14, 1]], [[0.88, 0.02], [0.14, 0.55]], [[0.37, 0.38], [0.9, 1]]],
  M: [[[0.08, 1], [0.08, 0.02], [0.5, 0.63], [0.92, 0.02], [0.92, 1]]],
  N: [[[0.14, 1], [0.14, 0.02], [0.86, 0.98], [0.86, 0]]],
  P: [[[0.14, 1], [0.14, 0.02], [0.64, 0.06], [0.84, 0.27], [0.62, 0.5], [0.14, 0.52]]],
  Q: [Array.from({ length: 21 }, (_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return [0.5 + Math.cos(a) * 0.42, 0.5 + Math.sin(a) * 0.48] as [number, number];
      }), [[0.62, 0.72], [0.96, 1.02]]],
  R: [[[0.14, 1], [0.14, 0.02], [0.64, 0.06], [0.84, 0.27], [0.62, 0.5], [0.14, 0.52]], [[0.45, 0.52], [0.9, 1]]],
  T: [[[0.05, 0.02], [0.95, 0.02]], [[0.5, 0.02], [0.5, 1]]],
  U: [[[0.12, 0], [0.12, 0.72], [0.3, 0.96], [0.7, 0.96], [0.88, 0.72], [0.88, 0]]],
  V: [[[0.05, 0], [0.5, 1], [0.95, 0]]],
  W: [[[0.03, 0], [0.24, 1], [0.5, 0.35], [0.76, 1], [0.97, 0]]],
  X: [[[0.08, 0], [0.92, 1]], [[0.92, 0], [0.08, 1]]],
  Y: [[[0.07, 0.02], [0.5, 0.5], [0.93, 0.02]], [[0.5, 0.5], [0.5, 1]]],
  Z: [[[0.1, 0.02], [0.9, 0.02], [0.1, 0.98], [0.9, 0.98]]],
  "0": [Array.from({ length: 21 }, (_, i) => {
          const a = (i / 20) * Math.PI * 2;
          return [0.5 + Math.cos(a) * 0.4, 0.5 + Math.sin(a) * 0.48] as [number, number];
        })],
  "1": [[[0.26, 0.18], [0.52, 0.02], [0.52, 0.98]], [[0.24, 0.98], [0.8, 0.98]]],
  "2": [[[0.12, 0.2], [0.42, 0.02], [0.78, 0.1], [0.82, 0.34], [0.13, 0.98], [0.9, 0.98]]],
  "3": [[[0.13, 0.11], [0.5, 0.01], [0.84, 0.19], [0.55, 0.45]], [[0.48, 0.45], [0.86, 0.66], [0.66, 0.97], [0.16, 0.9]]],
  "4": [[[0.7, 1], [0.7, 0.02], [0.08, 0.73], [0.94, 0.73]]],
  "5": [[[0.86, 0.02], [0.22, 0.02], [0.16, 0.44], [0.56, 0.37], [0.86, 0.58], [0.72, 0.94], [0.2, 0.96]]],
  "6": [[[0.82, 0.06], [0.44, 0.02], [0.16, 0.35], [0.14, 0.78], [0.44, 0.98], [0.76, 0.85], [0.78, 0.6], [0.42, 0.5], [0.16, 0.65]]],
  "7": [[[0.08, 0.02], [0.92, 0.02], [0.42, 1]]],
  "8": [Array.from({ length: 15 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return [0.5 + Math.cos(a) * 0.32, 0.27 + Math.sin(a) * 0.26] as [number, number];
        }),
        Array.from({ length: 17 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return [0.5 + Math.cos(a) * 0.38, 0.73 + Math.sin(a) * 0.26] as [number, number];
        })],
  "9": [[[0.18, 0.94], [0.56, 0.98], [0.84, 0.65], [0.86, 0.22], [0.56, 0.02], [0.24, 0.15], [0.22, 0.4], [0.58, 0.5], [0.84, 0.35]]],
  "-": [[[0.16, 0.5], [0.84, 0.5]]],
  "'": [[[0.5, 0.04], [0.42, 0.3]]],
  ".": [[[0.44, 0.92], [0.56, 0.92], [0.56, 1], [0.44, 1], [0.44, 0.92]]],
};
for (const [k, v] of Object.entries(ALPHA)) if (!GLYPH[k]) GLYPH[k] = v;

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

const CHART_D = 0.06;
const chartLine: [number, number][] = [[-0.68, 0.42], [-0.34, 0.1], [-0.02, 0.22], [0.3, -0.24], [0.62, -0.5]];
const chartHead: [number, number][] = [[0.3, -0.5], [0.62, -0.5], [0.62, -0.18]];
const chartAxes: [number, number][] = [[-0.74, -0.6], [-0.74, 0.62], [0.74, 0.62]];

// A FLOOR PLAN. Drawn the way a floor plan is drawn — double-line walls, a
// door shown as a leaf and its swing arc, a stair run — because every agent in
// the room has looked at a thousand of these and will name it instantly.
const FP_D = 0.025;
const fpOuter: [number, number][] = [[-0.82, -0.56], [0.82, -0.56], [0.82, 0.56], [-0.82, 0.56], [-0.82, -0.56]];
const fpInner: [number, number][] = [[-0.76, -0.5], [0.76, -0.5], [0.76, 0.5], [-0.76, 0.5], [-0.76, -0.5]];
const fpWalls: [number, number][][] = [
  [[-0.1, -0.5], [-0.1, 0.08]],
  [[-0.06, -0.5], [-0.06, 0.08]],
  [[-0.1, 0.08], [0.76, 0.08]],
  [[-0.1, 0.12], [0.76, 0.12]],
  [[0.34, 0.12], [0.34, 0.5]],
  [[0.38, 0.12], [0.38, 0.5]],
];
/** A door: the leaf, then the quarter-circle it sweeps. */
const fpDoor = (cx: number, cy: number, r: number, a0: number): [number, number][][] => [
  [[cx, cy], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r]],
  Array.from({ length: 9 }, (_, i) => {
    const a = a0 + (i / 8) * (Math.PI / 2);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
  }),
];
const fpStair: [number, number][][] = Array.from({ length: 6 }, (_, i) => [
  [-0.72, -0.44 + i * 0.09], [-0.24, -0.44 + i * 0.09],
]);
const fpCounter: [number, number][] = [[0.42, -0.5], [0.42, -0.2], [0.76, -0.2]];

// A LOCKBOX. The single most agent-specific object there is: nobody outside
// the business owns one, and everybody inside has spun the dials on a hundred.
const LB_D = 0.16;
const lbBody = rrect(0.4, 0.42, 0.1, 5);
const lbFace = rrect(0.32, 0.34, 0.07, 4);
/** Ten buttons, the way the real ones are laid out. */
const lbKeys: [number, number][][] = Array.from({ length: 10 }, (_, i) =>
  ring(-0.2 + (i % 5) * 0.1, -0.06 + Math.floor(i / 5) * 0.14, 0.035, 9)
);
/** The shackle, over the top and down the back. */
const lbShackle: [number, number][] = [
  [-0.2, -0.42],
  ...Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI + (i / 12) * Math.PI;
    return [Math.cos(a) * 0.2, -0.42 + Math.sin(a) * 0.26] as [number, number];
  }),
  [0.2, -0.42],
];
const lbLatch: [number, number][] = [[-0.16, 0.24], [0.16, 0.24], [0.16, 0.36], [-0.16, 0.36], [-0.16, 0.24]];

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

// A SMARTPHONE, not a rectangle with a rectangle in it. The things that make
// one read as itself are all small and all mandatory: a big corner radius, a
// thin body, a bezel that follows the corners, the island at the top, the home
// bar at the bottom, buttons on the edges you only see as it turns — and, on
// the back, the camera array, which is the single most recognisable thing on a
// modern phone and is free to draw because this object rotates anyway.
const PHONE_D = 0.045;
const phoneBody = rrect(0.3, 0.6, 0.11, 6);
const phoneScreen = rrect(0.265, 0.555, 0.085, 5);
/** The island. Nothing else on a phone looks like this. */
const phoneIsland = rrect(0.055, 0.02, 0.02, 4).map(([x, y]) => [x, y - 0.5] as [number, number]);
const phoneHome: [number, number][] = [[-0.1, 0.525], [0.1, 0.525]];
/** Two bubbles: one arriving on the left, the answer going back on the right. */
const phoneIn = rrect(0.1, 0.05, 0.035, 4).map(([x, y]) => [x - 0.13, y - 0.28] as [number, number]);
const phoneOut = rrect(0.12, 0.05, 0.035, 4).map(([x, y]) => [x + 0.11, y - 0.14] as [number, number]);
const phoneOut2 = rrect(0.08, 0.045, 0.032, 4).map(([x, y]) => [x + 0.15, y - 0.03] as [number, number]);
/** Edge hardware, only legible as the body turns — which is the point. */
const phoneSide: Line3[] = [
  [[-0.3, -0.26, PHONE_D], [-0.3, -0.26, -PHONE_D]],
  [[-0.3, -0.12, PHONE_D], [-0.3, -0.12, -PHONE_D]],
  [[0.3, -0.18, PHONE_D], [0.3, -0.18, -PHONE_D]],
  [[-0.3, -0.3], [-0.3, -0.08]].map(([x, y]) => [x, y, PHONE_D] as P3),
  [[-0.3, -0.3], [-0.3, -0.08]].map(([x, y]) => [x, y, -PHONE_D] as P3),
  [[0.3, -0.22], [0.3, -0.05]].map(([x, y]) => [x, y, PHONE_D] as P3),
  [[0.3, -0.22], [0.3, -0.05]].map(([x, y]) => [x, y, -PHONE_D] as P3),
];
/** The camera array on the back: a rounded square of lenses. */
const phoneCam: Line3[] = [
  at(rrect(0.1, 0.1, 0.035, 4).map(([x, y]) => [x - 0.14, y - 0.4] as [number, number]), -PHONE_D),
  at(ring(-0.18, -0.44, 0.035, 12), -PHONE_D),
  at(ring(-0.1, -0.44, 0.035, 12), -PHONE_D),
  at(ring(-0.18, -0.36, 0.035, 12), -PHONE_D),
  at(ring(-0.1, -0.36, 0.018, 8), -PHONE_D),
];

// A MONTH, drawn as a month: a page with a torn-off binding, a header band,
// and thirty-one days as circles on a grid. The days are what make it read at
// a glance, and at render time they fill and clear — a week booking itself and
// then releasing — which is the one thing a calendar does that a grid doesn't.
const CAL_D = 0.04;
const calPage = rrect(0.62, 0.5, 0.06, 4).map(([x, y]) => [x, y + 0.06] as [number, number]);
const calBand: [number, number][] = [[-0.62, -0.2], [0.62, -0.2]];
const calRings: Line3[] = [-0.34, -0.11, 0.11, 0.34].flatMap((x) => [
  [[x, -0.44, CAL_D], [x, -0.58, CAL_D]] as Line3,
  [[x, -0.44, -CAL_D], [x, -0.58, -CAL_D]] as Line3,
  at(ring(x, -0.58, 0.04, 10), CAL_D),
]);
/** Seven columns, five rows: the shape of every wall calendar ever printed. */
const CAL_COLS = 7;
const CAL_ROWS = 5;
const CAL_X = (c: number) => -0.5 + c * (1.0 / (CAL_COLS - 1));
const CAL_Y = (r: number) => -0.08 + r * 0.14;
const calDays: [number, number][][] = [];
for (let r = 0; r < CAL_ROWS; r++) {
  for (let c = 0; c < CAL_COLS; c++) {
    const i = r * CAL_COLS + c;
    if (i >= 31) break;
    calDays.push(ring(CAL_X(c), CAL_Y(r), 0.045, 9));
  }
}
/** Where those day circles live in 3D, for the fill-and-clear pass. */
const CAL_CELLS: P3[] = calDays.map((_, i) => [
  CAL_X(i % CAL_COLS),
  CAL_Y(Math.floor(i / CAL_COLS)),
  CAL_D,
]);

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

// THE TABLE. Four parties and Val in the middle of them.
//
// This replaces a nine-node deal timeline that was, correctly, unreadable: at
// particle resolution a rail of small rings is a row of dots and nothing else.
// A hub with four speech bubbles around it is legible in half a second from
// the back of a room, and it says the more valuable thing anyway — that the
// job is not a chart of dates, it is four people who all need answers.
//
// Each seat is drawn on the tangent plane at its own angle so the bubbles face
// the hub and the whole thing reads as a round table when it turns.
const SEAT_R = 0.72;
const SEATS: { a: number; label: string }[] = [
  { a: Math.PI * 0.25, label: "YOUR CLIENT" },
  { a: Math.PI * 0.75, label: "THE OTHER AGENT" },
  { a: Math.PI * 1.25, label: "CLOSING ATTORNEY" },
  { a: Math.PI * 1.75, label: "THE LENDER" },
];
/** Places a flat outline on the tangent plane at angle `a`: u runs along the
 *  tangent, v is world y, and the result faces the centre. */
const seatAt = (a: number, r: number) => (pts: [number, number][]): Line3 => {
  const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
  const tx = -Math.sin(a), tz = Math.cos(a);
  return pts.map(([u, v]) => [cx + tx * u, v, cz + tz * u] as P3);
};
/** A speech bubble with its tail pointing down at the table. */
const bubble: [number, number][] = [
  [-0.2, -0.22], [0.2, -0.22], [0.2, 0.0], [0.05, 0.0], [0.0, 0.14], [-0.03, 0.0], [-0.2, 0.0], [-0.2, -0.22],
];
const bubbleText: [number, number][][] = [
  [[-0.14, -0.16], [0.14, -0.16]],
  [[-0.14, -0.11], [0.08, -0.11]],
  [[-0.14, -0.06], [0.12, -0.06]],
];
const tableLines = (): Line3[] => {
  const out: Line3[] = [];
  // Val's core: three great circles, so the hub is a body and not a dot.
  out.push(at(ring(0, 0, 0.2, 22), 0));
  out.push(ring(0, 0, 0.2, 22).map(([x, z]) => [x, 0, z] as P3));
  out.push(ring(0, 0, 0.2, 22).map(([y, z]) => [0, y, z] as P3));
  for (const { a } of SEATS) {
    const place = seatAt(a, SEAT_R);
    out.push(place(bubble));
    for (const l of bubbleText) out.push(place(l));
    // the spoke from the hub out to the bubble's tail
    out.push([
      [Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22],
      [Math.cos(a) * SEAT_R, 0.14, Math.sin(a) * SEAT_R],
    ]);
  }
  // the table itself, tying the four seats together
  out.push(ring(0, 0, SEAT_R, 40).map(([x, z]) => [x, 0.16, z] as P3));
  return out;
};

const SHAPES: {
  id: string;
  says: string[];
  accent: [number, number, number];
  lines: Line3[];
  /** Points that get a label drawn beside them while the shape is held. Only
   *  the table uses these: a hub of four anonymous bubbles is a diagram, and
   *  naming the four people is the entire point of it. */
  tags?: { at: P3; text: string }[];
}[] = [
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
      at(phoneIsland, PHONE_D),
      at(phoneIn, PHONE_D), at(phoneOut, PHONE_D), at(phoneOut2, PHONE_D),
      at(phoneHome, PHONE_D),
      ...phoneCam,
      ...phoneSide,
      // the rim, joined at the corners so the body has real thickness
      ...joins(phoneBody.filter((_, i) => i % 3 === 0), PHONE_D, -PHONE_D),
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
      at(calBand, CAL_D), at(calBand, -CAL_D),
      ...calRings,
      ...calDays.map((d) => at(d, CAL_D)),
      ...joins(calPage.filter((_, i) => i % 3 === 0), CAL_D, -CAL_D),
    ],
  },
  {
    id: "table",
    says: [
      "Your client at 9pm: where are we? Answered from the file, in your voice.",
      "The other agent needs the disclosure. It goes \u2014 and you're told it went.",
      "The closing attorney moves the date. Everyone's calendar moves with it.",
      "Four parties. One thread. Nothing sitting in a voicemail nobody returns.",
    ],
    accent: [217, 174, 100],
    tags: SEATS.map(({ a, label }) => ({
      at: [Math.cos(a) * SEAT_R, -0.3, Math.sin(a) * SEAT_R] as P3,
      text: label,
    })),
    lines: tableLines(),
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
    id: "floorplan",
    says: [
      "Square footage, beds, baths, the lot \u2014 already in the file, already right.",
      "Ask it what a buyer will object to in this layout. It has read the disclosure.",
      "Every listing you own gets its own page, its own QR, its own front desk.",
      "The Agent Connection. Smarter tools, and somebody on site who builds them.",
    ],
    accent: [124, 186, 214],
    lines: [
      at(fpOuter, FP_D), at(fpOuter, -FP_D),
      at(fpInner, FP_D), at(fpInner, -FP_D),
      ...fpWalls.map((w) => at(w, FP_D)),
      ...fpWalls.map((w) => at(w, -FP_D)),
      ...fpDoor(-0.06, -0.2, 0.26, -Math.PI / 2).map((d) => at(d, FP_D)),
      ...fpDoor(0.38, 0.2, 0.24, Math.PI).map((d) => at(d, FP_D)),
      ...fpStair.map((st2) => at(st2, FP_D)),
      at(fpCounter, FP_D),
      ...joins([[-0.82, -0.56], [0.82, -0.56], [0.82, 0.56], [-0.82, 0.56]], FP_D, -FP_D),
    ],
  },
  {
    id: "lockbox",
    says: [
      "The showing books itself, and the code goes out when the appointment is confirmed.",
      "Feedback comes back the same evening \u2014 asked for, not chased.",
      "Your seller gets the update Friday whether or not you remembered.",
      "Every promise you made at the listing table, kept by something that never forgets.",
    ],
    accent: [111, 168, 126],
    lines: [
      at(lbBody, LB_D), at(lbBody, -LB_D),
      at(lbFace, LB_D),
      ...lbKeys.map((k2) => at(k2, LB_D)),
      at(lbLatch, LB_D),
      at(lbShackle, LB_D * 0.5), at(lbShackle, -LB_D * 0.5),
      ...joins(lbBody.filter((_, i) => i % 3 === 0), LB_D, -LB_D),
      ...joins(lbShackle.filter((_, i) => i % 3 === 0), LB_D * 0.5, -LB_D * 0.5),
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
function sample(lines: Line3[], n: number): { pts: P3[]; link: boolean[]; corner: boolean[]; grp: Uint8Array } {
  const segs: { a: P3; b: P3; len: number; line: number }[] = [];
  let total = 0;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i];
      const b = line[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      if (len > 1e-6) {
        segs.push({ a, b, len, line: li });
        total += len;
      }
    }
  }
  const out: P3[] = [];
  const link: boolean[] = [];
  const corner: boolean[] = [];
  // Which source line each particle came from, so a shape can declare that
  // part of itself MOVES — a key turning in a lock, a door swinging off it.
  const grp = new Uint8Array(n);
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
        grp[i] = segs[si].line;
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
  return { pts: out, link, corner, grp };
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
    tags: s.tags,
    grp: big.grp,
    grpS: small.grp,
    pts: big.pts,
    link: big.link,
    corner: big.corner,
    ptsS: small.pts,
    linkS: small.link,
    cornerS: small.corner,
  };
});

export const VAL_SYMBOLS = SHAPES.map((s) => s.id);

type Form = (typeof FORMS)[number];

/** Everything a form needs, from a set of lines — so a shape built at runtime
 *  is the same kind of object as the thirteen built at module load, and the
 *  morph machinery cannot tell them apart. */
function makeForm(id: string, accent: [number, number, number], lines: Line3[]): Form {
  const big = sample(lines, BUILDERS);
  const small = sample(lines, SMALL);
  return {
    id, says: [], accent, tags: undefined,
    grp: big.grp, grpS: small.grp,
    pts: big.pts, link: big.link, corner: big.corner,
    ptsS: small.pts, linkS: small.link, cornerS: small.corner,
  };
}

/** THE MARK SPELLS SOMETHING. Val holds thirteen objects an agent recognises;
 *  this lets her hold one more — a word that did not exist until somebody
 *  typed it. Used for the name on a reservation and for the reference the
 *  database hands back, which is the difference between an animation and a
 *  receipt: both of those strings are facts before a single particle moves.
 *
 *  Extruded on two planes and pinned at the stroke ends, the same way the sold
 *  sign carries its letters, so the two-light rig has something to catch and
 *  the word reads as an object turning rather than a decal. */
const SPELL_CACHE = new Map<string, Form>();
export function spellForm(text: string, accent: [number, number, number] = [217, 174, 100]): Form | null {
  const clean = [...text.toUpperCase()]
    .filter((c) => GLYPH[c] || c === " ")
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 9);
  if (!clean) return null;
  const key = `${clean}|${accent.join(",")}`;
  const hit = SPELL_CACHE.get(key);
  if (hit) return hit;

  const n = clean.length;
  // Fit the word to the same box the other shapes live in, so a three-letter
  // name and an eight-letter one both arrive at a readable size instead of one
  // filling the frame and the other floating in the middle of it.
  const SPAN = 1.86;
  const gap = n > 1 ? Math.min(0.1, 0.34 / n) : 0;
  const w = (SPAN - (n - 1) * gap) / n;
  const h = Math.min(0.58, w * 1.6);
  const D = Math.min(0.06, w * 0.22);

  const flat: [number, number][][] = [];
  let x = -SPAN / 2;
  for (const ch of clean) {
    if (ch !== " ") flat.push(...letter(ch, x, -h / 2, w, h));
    x += w + gap;
  }
  if (!flat.length) return null;

  // Depth: both faces, plus a strut at each stroke's ends. Joining every point
  // would double the line count for no readability — the ends are what give
  // the letters thickness when the word turns edge-on.
  const ends: [number, number][] = [];
  for (const path of flat) {
    ends.push(path[0]);
    if (path.length > 1) ends.push(path[path.length - 1]);
  }
  const lines: Line3[] = [
    ...flat.map((g) => at(g, D)),
    ...flat.map((g) => at(g, -D)),
    ...joins(ends, D, -D),
  ];

  const form = makeForm(`spell:${clean}`, accent, lines);
  // A handful of names is all one visit produces; the cap is only here so a
  // pathological caller cannot grow this without bound.
  if (SPELL_CACHE.size > 24) SPELL_CACHE.clear();
  SPELL_CACHE.set(key, form);
  return form;
}

// Slow on purpose. An earlier pass had the particles SNAP into place with an
// overshoot, which was exciting for half a second and then over. Forming and
// dissolving slowly is the thing people can't look away from — and the room is
// filling up, so there is nowhere to hurry to. A symbol that takes four
// seconds to arrive and turns for twelve gets looked at twice.
// ONE THING TURNS INTO THE NEXT. It used to blow apart, drift as a loose
// shell, and reassemble as something else — which meant that twice per shape
// there was nothing on screen to look at, and the arrival read as a jerk
// because the particles came from nowhere in particular. Now every particle
// travels from where it was in THIS shape to where it belongs in the NEXT
// one: the house becomes the key, the key becomes the sold sign, forever. The
// object is never not there, and the transition is the best part.
// Ten seconds a shape meant thirteen shapes took over two minutes to come
// round, so somebody who spent thirty seconds on the invite saw three of them
// and left thinking the thing only makes a sphere and a table. At five and a
// bit, the same visit gets the house, the key, the sold sign, the phone and
// the calendar — the ones an agent recognises — and the morph still has room
// to read as a rebuild rather than a cut.
const MORPH = 1700;
const HOLD = 3600;
const PHASE = MORPH + HOLD;

/** Slow at both ends, unhurried through the middle. Cubic rather than
 *  quadratic so the approach settles instead of arriving. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function ValParticles({
  className = "",
  onForm,
  pin,
  quiet = false,
  beat,
  mode = null,
  spin: spinIn = 1,
  spell = "",
  spellAccent,
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
  /** Drives Val out of her own loop and into the room's: `listen` opens her up
   *  and holds her loose and breathing, `think` collapses everything into the
   *  core and spins it, `speak` forms the table and pushes light outward. The
   *  caller sets this from what is ACTUALLY happening — a request in flight is
   *  `think`, a reply on screen is `speak` — so the animation cannot claim a
   *  state the system is not in. */
  mode?: "listen" | "think" | "speak" | null;
  /** A multiplier on how fast she turns, read live every frame. 1 is her own
   *  pace; the invite drives it up to a blur and lets it fall back so that the
   *  slowing-down is what delivers the line underneath. Read through a ref, so
   *  changing it never restarts the engine. */
  spin?: number;
  /** A word for the mark to HOLD, spelled in its own wireframe — a person's
   *  name as they type it, then the reference the database hands back. Set it
   *  and she morphs out of whatever she was holding and into the word; clear
   *  it and she morphs back into her own cycle. Read live through a ref, so a
   *  new word never restarts the engine and the particles travel there from
   *  exactly where they are. */
  spell?: string;
  /** Colour for the spelled word: gold for a name, cream for a reference. */
  spellAccent?: [number, number, number];
  /** Fires with the held shape while it is assembled, null while drifting, so
   *  the copy underneath can SELL what Val just made rather than label it. */
  onForm?: (shape: { id: string; says: string[]; closing: boolean } | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const formCb = useRef(onForm);
  formCb.current = onForm;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const spinRef = useRef(spinIn);
  spinRef.current = spinIn;
  const spellRef = useRef(spell);
  spellRef.current = spell;
  const spellHue = useRef(spellAccent);
  spellHue.current = spellAccent;
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
    let fadeA = 0.5;
    // How far Val has left her own loop for the room's. Eased, so entering and
    // leaving a mode is a move rather than a cut.
    let modeAmt = 0;
    let modeSince = 0;
    let modeWas: string | null = null;
    const tableIdx = Math.max(0, FORMS.findIndex((f) => f.id === "table"));
    let announced: string | null | undefined;
    // The word she is holding, the word she is letting go of, and whatever is
    // on screen right now — `shown` is what a new word flies out of, so the
    // letters always assemble from the object that was actually there.
    let spelling: { text: string; form: Form; from: Form | null; at: number } | null = null;
    let released: { form: Form; at: number } | null = null;
    let shown: Form | null = null;
    // The HUD bracket, smoothed. It locks onto the object's bounds, and those
    // bounds move every frame as the thing turns — under the trail fade that
    // dragged the readout across the canvas and left a legible ghost of the
    // previous frame's text beside the current one. Easing the box makes it
    // settle instead of chasing, which is also how a real target lock behaves.
    let hud0 = [0, 0, 0, 0];
    let hudSet = false;
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

      // Which shape we are on, and the one we are coming out of.
      const slot = Math.floor(t / PHASE);
      const p = t % PHASE;

      // A gentle back-ease: the pull-away and the settle, without a splice.
      const arrive = (u: number) => {
        const C = 0.6;
        return u < 0.5
          ? (Math.pow(2 * u, 2) * ((C + 1) * 2 * u - C)) / 2
          : (Math.pow(2 * u - 2, 2) * ((C + 1) * (2 * u - 2) + C) + 2) / 2;
      };

      // ---- a word, if the page has given her one ----
      // The word takes over the cycle rather than replacing the engine: it
      // becomes `form`, and whatever was on screen when it arrived becomes
      // `prevForm`, so the particles fly from the object they were in to the
      // letters of somebody's name. Letting go is the same trip backwards.
      const want = spellRef.current.trim();
      if (want && want !== spelling?.text) {
        const built = spellForm(want, spellHue.current ?? [217, 174, 100]);
        if (built) spelling = { text: want, form: built, from: shown, at: t };
      } else if (!want && spelling) {
        released = { form: spelling.form, at: t };
        spelling = null;
      }

      let form: Form;
      let prevForm: Form;
      let mix = 1;
      // How far through a morph we are, whichever morph is running — the
      // cycle's, a word arriving, or a word being let go. The flare, the
      // streaks and the spin-up all read from this, so a word gets the same
      // energy behind it as any other change of shape.
      let morphU = 1;
      if (spelling) {
        form = spelling.form;
        prevForm = spelling.from ?? form;
        if (!calm) {
          morphU = Math.min(1, (t - spelling.at) / MORPH);
          mix = arrive(morphU);
        }
      } else {
        form = pinned >= 0 ? FORMS[pinned] : (FORMS[slot % FORMS.length] ?? FORMS[0]);
        prevForm = pinned >= 0
          ? form
          : (FORMS[(slot + FORMS.length - 1) % FORMS.length] ?? form);
        if (pinned < 0 && !calm && p < MORPH) { morphU = p / MORPH; mix = arrive(morphU); }
        // Coming back out of a word: hold it as the source for one morph so
        // the letters dissolve into the next object instead of cutting.
        if (released && !calm) {
          const u = (t - released.at) / MORPH;
          if (u < 1) { morphU = Math.max(0, u); prevForm = released.form; mix = arrive(morphU); }
          else released = null;
        }
      }
      shown = mix >= 0.5 ? form : prevForm;
      const pts = quiet ? form.ptsS : form.pts;
      const morphing = mix < 1;
      // Energy of the change: nothing at either end, everything in the middle.
      const flux = morphing ? Math.sin(Math.PI * Math.min(1, Math.max(0, morphU))) : 0;

      // ---- the room's state, if the room has one ----
      const md = quiet ? null : modeRef.current;
      if (md !== modeWas) {
        modeWas = md;
        modeSince = t;
      }
      // A WORD OUTRANKS A MOOD. `listen` parks every builder on the open shell
      // and `speak` parks them on the table, either of which would quietly
      // overwrite a shape being held — which is exactly what happened the
      // first time the booking asked her to spell a name and got a sphere.
      // While she is holding a word, the mode stands down; the page still has
      // the status light and the copy to say what is going on.
      modeAmt += ((md && !spelling ? 1 : 0) - modeAmt) * Math.min(1, dt * 2.4);
      const modeAge = (t - modeSince) / 1000;
      // Thinking spins; listening turns slowly and openly; answering settles.
      const modeSpin = md === "think" ? 3.4 : md === "listen" ? 0.55 : 1;

      // Downstream still speaks the old language: `pull` is how settled the
      // object is, and it now dips through a morph instead of falling to zero.
      const pull = calm ? 1 : 1 - flux * 0.55;
      const shooting = morphing;
      const spin = (1 + flux * 2.2) * (modeAmt > 0.01 ? 1 + (modeSpin - 1) * modeAmt : 1)
        * Math.max(0.15, spinRef.current);
      const burst = 0;
      const vis = 1;
      // Edges belong to whichever shape the particles are nearer to, and they
      // fade out through the middle of the flight — so a solid object
      // dissolves into travelling light and resolves as a different object.
      const nearer = mix >= 0.5 ? form : prevForm;
      const link = quiet ? nearer.linkS : nearer.link;
      const corner = quiet ? nearer.cornerS : nearer.corner;
      const srcPts = quiet ? prevForm.ptsS : prevForm.pts;
      // The fourth line lands late in the hold, as the shape starts to go.
      const closing = !quiet && !morphing && p > MORPH + HOLD * 0.62;


      // The copy follows the motion: it cycles through the hold, then locks
      // onto the closing line as Val winds up to throw the shape.
      const heldId = quiet ? null : !morphing ? `${form.id}:${closing ? "close" : "hold"}` : null;
      if (heldId !== announced) {
        announced = heldId;
        if (heldId && !closing) lockAt = t;
        formCb.current?.(pull > 0.9 ? { id: form.id, says: form.says, closing } : null);
      }

      // Fast while loose, calmer while holding a shape so it can be read —
      // but never stopped: a symbol that keeps turning gets looked at twice.
      // MOST OF THESE OBJECTS ARE FLAT. A key, a calendar, a contract, a phone
      // — spun at a constant rate they spend a third of every turn edge-on,
      // which is a third of the time showing the room a vertical line. So the
      // rotation is non-uniform: slow while a face is toward the house, fast
      // through the edge. Every angle still gets shown, but the readable ones
      // are the ones it lingers on.
      if (!calm) {
        if (spelling) {
          // A WORD HAS A FRONT. Everything else she holds is an object and
          // reads from any angle, so it turns all the way round; a name spun
          // through 180° is somebody's name printed backwards, which is the
          // one thing this moment cannot afford. So while she holds a word she
          // sways instead of turning — enough parallax to keep it a solid
          // thing in space, never enough to show its back.
          // yaw is normalised first: coming out of a spin it can be tens of
          // radians, and easing that toward zero would unwind like a rewind.
          const norm = Math.atan2(Math.sin(yaw), Math.cos(yaw));
          const face = Math.sin((t / 1000) * 0.6) * 0.34;
          yaw = norm + (face - norm) * Math.min(1, dt * 2.4);
        } else {
          const edgeOn = Math.abs(Math.sin(yaw));
          yaw += dt * (1.25 - 0.5 * pull) * spin * (0.34 + 1.66 * edgeOn);
        }
      }
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
      const fadeTarget = calm ? 1 : quiet ? 0.85 : burst > 0 ? 0.2 : shooting ? 0.42 : 0.5;
      // Trail length used to jump at every phase boundary, and a trail that
      // changes length in one frame is a visible cut. Ease toward it instead.
      fadeA += (fadeTarget - fadeA) * Math.min(1, dt * 6);
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

      // The shape swaps while the builders are invisible, but the ACCENT was
      // swapping in the same frame — and the orbs, HUD and beams all carry it,
      // so the cut showed. Cross-fade from the outgoing shape across the seam.
      const seam = Math.min(1, mix < 0 ? 0 : mix);
      const [ar, ag, ab] = [0, 1, 2].map((i) =>
        Math.round(prevForm.accent[i] + (form.accent[i] - prevForm.accent[i]) * seam)
      ) as [number, number, number];
      const settleAge = lockAt >= 0 ? (t - lockAt) / 1000 : 9;
      const settle = 1 + (settleAge < 1.6 ? 0.045 * Math.sin(settleAge * 21) * Math.exp(-settleAge * 3.6) : 0);

      // ---- the bodies of light: Val herself ----
      // They pull in and dim while a symbol is held, so the silhouette reads
      // instead of fighting a wall of glow behind it.
      // Val brightens while she has a shape inside her, which is the moment the
      // whole effect is selling.
      const flare = 1 + flux * 0.3 + (spin - 1) * 0.05 + heart * 0.6;
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
      const CB = 5, CA = 4;
      const cb: (Path2D | null)[] = new Array(CB * CA).fill(null);
      for (let i = 0; i < core.length; i++) {
        const d = core[i];
        const q = project(d.x * d.r, d.y * d.r, d.z * d.r);
        const depth = Math.min(1, Math.max(0, (q.persp - 0.66) / 0.9));
        const rim = 1 - Math.min(1, Math.abs(q.z2) / (d.r * 0.85));
        const L = lit(q.x1, q.y1, q.z2);
        const a = (0.08 + depth * 0.26 + rim * rim * 0.42) * vis;
        const sz = Math.max(0.35, d.size * q.persp * (0.75 + rim * 0.5));
        const li = Math.min(CB - 1, Math.max(0, (L * CB) | 0));
        const ai = Math.min(CA - 1, Math.max(0, ((a / 0.76) * CA) | 0));
        const path = cb[li * CA + ai] ?? (cb[li * CA + ai] = new Path2D());
        // Every seventh node is a pixel, not a dot — the digital grain.
        if (i % 7 === 0) path.rect(q.px - sz, q.py - sz, sz * 2, sz * 2);
        else {
          path.moveTo(q.px + sz, q.py);
          path.arc(q.px, q.py, sz, 0, Math.PI * 2);
        }
      }
      for (let li = 0; li < CB; li++) {
        const L = (li + 0.5) / CB;
        const col = `${Math.round(150 + L * 100)},${Math.round(180 + L * 62)},${Math.round(214 + L * 14)}`;
        for (let ai = 0; ai < CA; ai++) {
          const path = cb[li * CA + ai];
          if (!path) continue;
          ctx.fillStyle = `rgba(${col},${((ai + 0.5) / CA) * 0.76})`;
          ctx.fill(path);
        }
      }

      // ---- THE BLUEPRINT ----
      // Before anything is built, the DRAWING of it is projected: the target
      // wireframe in dashed cyan on a fine drafting grid, CAD markers on every
      // vertex, dimension lines with ticked ends and a sheet number. It turns
      // with the object. The solid, lit wireframe then prints over it under
      // the scan head and the drawing fades as the real thing takes — and it
      // flashes back for a moment as the real thing lets go.
      // The drawing of what it is BECOMING, up while it travels and gone once
      // it has landed on it.
      const bpA = !quiet && morphing ? Math.pow(Math.sin(Math.PI * (p / MORPH)), 0.75) : 0;
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

      const streakPaths: (Path2D | null)[] = [null, null, null];

      // A scan plane travelling through the object while it assembles: dots
      // near it flare as they are "read in".
      const sweepY = morphing ? -1.1 + Math.min(1, Math.max(0, mix)) * 2.2 : 99;

      for (let i = 0; i < builders.length; i++) {
        const d = builders[i];
        const from = srcPts[i];
        const tgt = pts[i];
        // Stagger so they arrive in waves rather than as one block.
        const k = Math.min(1, Math.max(0, mix * (1 + d.lag * 0.4) - d.lag * 0.3));
        // THE FLIGHT: VAL TAKES IT IN AND BUILDS THE NEXT ONE.
        //
        // The straight-line version was smooth but it was just a cross-fade in
        // space — the old thing slid into the new one and Val had nothing to do
        // with it. So the path is routed through her instead: as a shape lets
        // go, every particle collapses toward the core and turns there in a
        // tight swirling ball, then streams back out into the shape it is
        // becoming. Same continuity — the object is never absent — but now the
        // machine in the middle is visibly the thing doing the work.
        const kk = Math.min(1, Math.max(0, k));
        const suck = morphing ? Math.sin(Math.PI * kk) : 0;
        const inward = suck * 0.86;
        // Where this particle sits inside Val while she holds it.
        const swirl = suck * 2.4;
        const sc = Math.cos(swirl), ss = Math.sin(swirl);
        const cr = 0.26 + d.lag * 0.1;
        const coreX = (d.x * sc + d.z * ss) * cr;
        const coreZ = (d.z * sc - d.x * ss) * cr;
        const coreY = d.y * cr;
        const lx2 = (from[0] + (tgt[0] - from[0]) * k) * settle;
        const ly2 = (from[1] + (tgt[1] - from[1]) * k) * settle;
        const lz2 = (from[2] + (tgt[2] - from[2]) * k) * settle;
        let px2 = lx2 + (coreX - lx2) * inward;
        let py2 = ly2 + (coreY - ly2) * inward;
        let pz2 = lz2 + (coreZ - lz2) * inward;

        // WHERE THE ROOM PUTS HER.
        //   listen — the loose shell, breathing, open: nothing held, waiting.
        //   think  — everything pulled into a tight swirling ball at the core.
        //   speak  — the table: Val in the middle of four people, talking.
        if (modeAmt > 0.002) {
          let mx: number, my: number, mz: number;
          if (md === "think") {
            const sw = modeAge * 3.1;
            const c2 = Math.cos(sw), s3 = Math.sin(sw);
            const rr2 = 0.2 + d.lag * 0.14;
            mx = (d.x * c2 + d.z * s3) * rr2;
            mz = (d.z * c2 - d.x * s3) * rr2;
            my = d.y * rr2;
          } else if (md === "speak") {
            const tp = FORMS[tableIdx][quiet ? "ptsS" : "pts"][i];
            mx = tp[0]; my = tp[1]; mz = tp[2];
          } else {
            // A slow swell that runs around the shell rather than pulsing the
            // whole thing at once — it looks like breathing, not a heartbeat.
            const br = 0.78 + 0.1 * Math.sin(modeAge * 1.5 + d.y * 3.4);
            mx = d.x * br; my = d.y * br; mz = d.z * br;
          }
          px2 += (mx - px2) * modeAmt;
          py2 += (my - py2) * modeAmt;
          pz2 += (mz - pz2) * modeAmt;
        }
        const q = project(px2, py2, pz2);
        const depth = Math.min(1, Math.max(0, (q.persp - 0.66) / 0.9));
        const flash = Math.max(0, 1 - Math.abs(py2 - sweepY) * 7);

        // Streak: only while actually travelling, and only if it moved. Sorted
        // into three brightness bands and stroked as three paths at the end,
        // rather than a stroke call per particle.
        if (shooting && d.seen) {
          const dx = q.px - d.px;
          const dy = q.py - d.py;
          const sp2 = dx * dx + dy * dy;
          if (sp2 > 0.35) {
            const band = sp2 > 24 ? 2 : sp2 > 6 ? 1 : 0;
            const sp = streakPaths[band] ?? (streakPaths[band] = new Path2D());
            sp.moveTo(d.px, d.py);
            sp.lineTo(q.px, q.py);
          }
        }
        d.px = q.px;
        d.py = q.py;
        d.seen = true;

        bx2[i] = q.px;
        by2[i] = q.py;
        bl[i] = lit(q.x1, q.y1, q.z2);
        const isCorner = corner[i];
        // Brightest in flight: a particle that is travelling is the thing
        // worth looking at.
        const trav = morphing ? Math.sin(Math.PI * Math.min(1, Math.max(0, k))) : 0;
        const packed = 1 - trav * 0.62;
        ba[i] = (((0.32 + depth * 0.42) + flash * 0.5 + (isCorner ? 0.3 : 0)) * packed + trav * 0.12) * vis;
        bs[i] = Math.max(0.35, d.size * q.persp * (1.1 - trav * 0.25) * (1 + flash * 0.6) * (isCorner ? (quiet ? 1.2 : 1.9) : 1));
      }

      if (shooting) {
        ctx.lineWidth = 1.1;
        for (let b = 0; b < 3; b++) {
          const sp = streakPaths[b];
          if (!sp) continue;
          ctx.strokeStyle = `rgba(246,244,238,${[0.09, 0.2, 0.32][b] * vis})`;
          ctx.stroke(sp);
        }
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
      // Edges belong to the shape the particles are nearest; through the middle
      // of the flight there are no edges at all, only light in transit.
      const edgeUp = 1 - Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, mix))), 0.6);
      if (edgeUp > 0.02) {
        // Hologram flicker: a few percent of frame-to-frame noise, enough to
        // read as projected light rather than ink.
        const flick = calm ? 1 : 0.93 + 0.07 * ((((Math.floor(t / 33) * 2654435761) >>> 0) % 1000) / 1000);
        const edge = Math.min(1.25, edgeUp + heart * 0.5) * flick;
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
        if (!calm && !lite && !morphing) {
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

      // BATCHED FILLS. Fifteen hundred beginPath/arc/fill calls a frame is the
      // entire bill on a software rasteriser — the per-fill overhead dominates,
      // not the pixels. Quantising colour and alpha into a small set of buckets
      // and filling one Path2D per bucket draws the same picture in about two
      // dozen fills. At this dot size the quantisation is invisible.
      const TAU = Math.PI * 2;
      const LB = 5, AB = 5;
      const buckets: (Path2D | null)[] = new Array(LB * AB).fill(null);
      const halos: (Path2D | null)[] = new Array(LB).fill(null);
      for (let i = 0; i < builders.length; i++) {
        const L = bl[i];
        const a = Math.min(0.95, ba[i]) * (0.55 + L * 0.45);
        const li = Math.min(LB - 1, Math.max(0, (L * LB) | 0));
        const ai = Math.min(AB - 1, Math.max(0, ((a / 0.95) * AB) | 0));
        // DEPTH OF FIELD: anything well behind the focal plane gets a soft
        // halo instead of a hard dot, so near reads sharp and far reads far.
        if (bs[i] < 0.9 && !lite) {
          const h = halos[li] ?? (halos[li] = new Path2D());
          h.moveTo(bx2[i] + bs[i] * 2.4, by2[i]);
          h.arc(bx2[i], by2[i], bs[i] * 2.4, 0, TAU);
        }
        const path = buckets[li * AB + ai] ?? (buckets[li * AB + ai] = new Path2D());
        if (i % 9 === 0 && !corner[i]) {
          // A small cross — a registration mark, not a dot.
          const s2 = bs[i] * 1.6;
          path.rect(bx2[i] - s2, by2[i] - 0.5, s2 * 2, 1);
          path.rect(bx2[i] - 0.5, by2[i] - s2, 1, s2 * 2);
        } else {
          path.moveTo(bx2[i] + bs[i], by2[i]);
          path.arc(bx2[i], by2[i], bs[i], 0, TAU);
        }
      }
      const warmOf = (li: number) => {
        const L = (li + 0.5) / LB;
        return `${Math.round(140 + L * 112)},${Math.round(168 + L * 78)},${Math.round(206 + L * 24)}`;
      };
      for (let li = 0; li < LB; li++) {
        const h = halos[li];
        if (h) {
          ctx.fillStyle = `rgba(${warmOf(li)},0.14)`;
          ctx.fill(h);
        }
      }
      for (let li = 0; li < LB; li++) {
        const col = warmOf(li);
        for (let ai = 0; ai < AB; ai++) {
          const path = buckets[li * AB + ai];
          if (!path) continue;
          ctx.fillStyle = `rgba(${col},${((ai + 0.5) / AB) * 0.95})`;
          ctx.fill(path);
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
      if (!quiet && (!morphing || modeAmt > 0.5) && vis > 0.2) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < builders.length; i++) {
          if (bx2[i] < minX) minX = bx2[i];
          if (bx2[i] > maxX) maxX = bx2[i];
          if (by2[i] < minY) minY = by2[i];
          if (by2[i] > maxY) maxY = by2[i];
        }
        const padX = (maxX - minX) * 0.06 + 4, padY = (maxY - minY) * 0.06 + 4;
        minX -= padX; maxX += padX; minY -= padY; maxY += padY;
        if (!hudSet) { hud0 = [minX, maxX, minY, maxY]; hudSet = true; }
        const k3 = Math.min(1, dt * 3.2);
        hud0 = [
          hud0[0] + (minX - hud0[0]) * k3,
          hud0[1] + (maxX - hud0[1]) * k3,
          hud0[2] + (minY - hud0[2]) * k3,
          hud0[3] + (maxY - hud0[3]) * k3,
        ];
        minX = hud0[0]; maxX = hud0[1]; minY = hud0[2]; maxY = hud0[3];
        const on = vis * st;
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
        // The right-hand word is the state, so it never gets dropped; the
        // left-hand readout gives up its node count and then itself rather
        // than run into it. A narrow object — a key seen edge-on, a spelled
        // word on a phone — used to print the two straight through each other.
        const state = spelling
          ? "HOLDING"
          : md === "listen" ? "LISTENING" : md === "think" ? "THINKING" : md === "speak" ? "ANSWERING"
            : closing ? "RELEASING" : "LOCKED";
        const fi = FORMS.indexOf(form);
        // A spelled word is not one of the thirteen, so it has no index — and
        // printing "RENDER ··/13" for it says nothing. It reports the only
        // number this file can vouch for instead.
        const hudPad = Math.max(6, unit * 0.05);
        const span = w - hudPad * 2;
        const stateW = ctx.measureText(state).width;
        const full = fi >= 0
          ? `▸ RENDER ${String(fi + 1).padStart(2, "0")}/${FORMS.length} · ${builders.length} NODES`
          : `▸ ${builders.length} NODES`;
        const short = fi >= 0 ? `▸ ${String(fi + 1).padStart(2, "0")}/${FORMS.length}` : `▸ ${builders.length}`;
        const left = ctx.measureText(full).width + stateW + fs < span
          ? full
          : ctx.measureText(short).width + stateW + fs < span
            ? short
            : "";
        // PINNED TO THE FRAME, NOT THE OBJECT. The brackets track the thing
        // as it turns, but the labels do not: text redrawn a fraction of a
        // pixel off its last position leaves a legible ghost of the previous
        // frame under the trail fade, and the object's bounds move every
        // frame. Anything redrawn in exactly the same place settles cleanly.
        // A real HUD works this way too — reticle on the world, chrome on the
        // glass.
        const ty = Math.round(hudPad + fs);
        if (left) ctx.fillText(left, Math.round(hudPad), ty);
        ctx.textAlign = "right";
        ctx.fillText(state, Math.round(w - hudPad), ty);
        const bw = Math.min(unit * 0.3, span);
        ctx.fillStyle = `rgba(217,174,100,${0.85 * on})`;
        ctx.fillRect(Math.round(hudPad), ty + Math.round(fs * 0.45), bw, 2);
      }

      // ---- LISTENING: a ring leaving the core, every second and a half ----
      // The one piece of pure theatre here, and it earns its place: a room
      // needs to see that the thing is ON and waiting on them.
      if (!quiet && md === "listen" && modeAmt > 0.15) {
        for (let k2 = 0; k2 < 2; k2++) {
          const ph = ((modeAge / 1.5) + k2 * 0.5) % 1;
          const rr2 = unit * (0.2 + ph * 0.78);
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, rr2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(124,186,214,${0.3 * (1 - ph) * modeAmt})`;
          ctx.lineWidth = 1.6 * (1 - ph) + 0.4;
          ctx.stroke();
        }
      }

      // ---- THE MONTH FILLING ----
      // A grid of empty circles is a grid. Days that fill, hold, and clear are
      // a calendar — a week booking itself and then releasing. Each day runs on
      // its own slow clock from a fixed hash, so the pattern never repeats and
      // never stutters, and a day lighting up throws a ring the way the lock
      // pulse does.
      if (!quiet && form.id === "calendar" && !morphing) {
        const on = 1;
        for (let i = 0; i < CAL_CELLS.length; i++) {
          const [cx, cy, cz] = CAL_CELLS[i];
          // Deterministic per-day period and offset: no Math.random in a loop
          // that has to look identical from one frame to the next.
          const hash = ((i * 2654435761) >>> 0) / 4294967296;
          const period = 5200 + hash * 6400;
          const u = ((t + hash * 9000) % period) / period;
          // fill over the first fifth, hold, clear over the last fifth
          const fill = u < 0.2 ? u / 0.2 : u < 0.72 ? 1 : u < 0.92 ? 1 - (u - 0.72) / 0.2 : 0;
          if (fill <= 0.01) continue;
          const q = project(cx, cy, cz);
          const rad = Math.max(1, unit * 0.045 * q.persp);
          ctx.beginPath();
          ctx.arc(q.px, q.py, rad * fill, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ar},${ag},${ab},${0.55 * fill * on})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(q.px, q.py, rad * fill * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(252,246,228,${0.75 * fill * on})`;
          ctx.fill();
          // the ring thrown as it lands
          if (u < 0.2) {
            const f = u / 0.2;
            ctx.beginPath();
            ctx.arc(q.px, q.py, rad * (1 + f * 1.6), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(252,246,228,${0.5 * (1 - f) * on})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // ---- THE TABLE'S TRAFFIC ----
      // The point of this shape is not four boxes around a hub. It is that Val
      // is talking to all four of them at once and the agent is not having to.
      // So: the seats are NAMED, with labels that turn with the object and
      // fade as they go round the back, and packets run every spoke in both
      // directions — out to the party, back with the answer.
      if (!quiet && form.tags && !morphing) {
        const on = 1;
        for (let i = 0; i < SEATS.length; i++) {
          const { a } = SEATS[i];
          const hub = project(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22);
          const seat = project(Math.cos(a) * SEAT_R, 0.14, Math.sin(a) * SEAT_R);
          // Alternate seats run the other way, so the table reads as a
          // conversation rather than a broadcast.
          const outbound = i % 2 === 0;
          let u = ((t / 1000) * 0.5 + i * 0.37) % 1;
          if (!outbound) u = 1 - u;
          const lerp = (a1: number, b1: number, k: number) => a1 + (b1 - a1) * k;
          const px = lerp(hub.px, seat.px, u), py = lerp(hub.py, seat.py, u);
          const tu = Math.max(0, Math.min(1, u + (outbound ? -0.14 : 0.14)));
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.55 * on})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(lerp(hub.px, seat.px, tu), lerp(hub.py, seat.py, tu));
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(px, py, Math.max(4, unit * 0.022), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ar},${ag},${ab},${0.18 * on})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1.6, unit * 0.008), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(252,246,228,${0.95 * on})`;
          ctx.fill();
          // A packet landing lights the seat it lands on.
          const land = outbound ? u : 1 - u;
          if (land > 0.9) {
            const f = (land - 0.9) / 0.1;
            ctx.beginPath();
            ctx.arc(outbound ? seat.px : hub.px, outbound ? seat.py : hub.py, unit * (0.03 + f * 0.05), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(252,246,228,${0.5 * (1 - f) * on})`;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          }
        }
        {
          const lf = Math.max(9, Math.round(unit * 0.046));
          ctx.font = `600 ${lf}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          const lon = 1;
          for (const tg of form.tags) {
            const q = project(tg.at[0], tg.at[1], tg.at[2]);
            // Front of the table reads bright, the back falls away.
            const face = Math.min(1, Math.max(0, (0.55 - q.z2) / 1.1));
            const A = (0.22 + 0.78 * face) * lon;
            const anchor = project(tg.at[0], 0.14 - 0.22, tg.at[2]);
            ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.4 * A})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(anchor.px, anchor.py);
            ctx.lineTo(q.px, q.py + lf * 0.35);
            ctx.stroke();
            ctx.fillStyle = `rgba(240,226,196,${0.95 * A})`;
            ctx.fillText(tg.text, q.px, q.py);
          }
        }
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
