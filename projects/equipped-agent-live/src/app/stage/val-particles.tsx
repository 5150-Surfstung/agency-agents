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

const HOUSE_D = 0.34;
const houseFace: [number, number][] = [[-0.5, -0.04], [0.5, -0.04], [0.5, 0.58], [-0.5, 0.58], [-0.5, -0.04]];
const houseGable: [number, number][] = [[-0.5, -0.04], [0, -0.62], [0.5, -0.04]];

const KEY_D = 0.07;
const keyPlate: [number, number][] = [
  ...ring(-0.44, 0, 0.27, 26),
  [-0.2, -0.06], [0.66, -0.06], [0.66, 0.06], [-0.2, 0.06], [-0.2, -0.06],
];
const keyTeeth: [number, number][] = [[0.34, 0.06], [0.34, 0.3], [0.44, 0.3], [0.44, 0.06]];
const keyTeeth2: [number, number][] = [[0.52, 0.06], [0.52, 0.24], [0.62, 0.24], [0.62, 0.06]];

const SIGN_D = 0.05;
const board: [number, number][] = [[-0.6, -0.42], [0.6, -0.42], [0.6, 0.16], [-0.6, 0.16], [-0.6, -0.42]];
const rider: [number, number][] = [[-0.42, -0.64], [0.42, -0.64], [0.42, -0.48], [-0.42, -0.48], [-0.42, -0.64]];
const strip: [number, number][] = [[-0.46, -0.27], [0.46, -0.27], [0.46, -0.09], [-0.46, -0.09], [-0.46, -0.27]];

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
  [[cx - 0.17, cy - 0.17], [cx + 0.17, cy - 0.17], [cx + 0.17, cy + 0.17], [cx - 0.17, cy + 0.17], [cx - 0.17, cy - 0.17]],
  [[cx - 0.07, cy - 0.07], [cx + 0.07, cy - 0.07], [cx + 0.07, cy + 0.07], [cx - 0.07, cy + 0.07], [cx - 0.07, cy - 0.07]],
];
const scanOuter: [number, number][] = [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [-0.7, -0.7]];

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
    lines: [
      at(houseFace, HOUSE_D), at(houseFace, -HOUSE_D),
      at(houseGable, HOUSE_D), at(houseGable, -HOUSE_D),
      [[0, -0.62, HOUSE_D], [0, -0.62, -HOUSE_D]],
      ...joins([[-0.5, -0.04], [0.5, -0.04], [0.5, 0.58], [-0.5, 0.58]], HOUSE_D, -HOUSE_D),
      at([[-0.13, 0.58], [-0.13, 0.2], [0.13, 0.2], [0.13, 0.58]], HOUSE_D),
      at(ring(0.28, 0.16, 0.11, 12), HOUSE_D),
      at(ring(-0.28, 0.16, 0.11, 12), HOUSE_D),
    ],
  },
  {
    id: "key",
    says: [
      "Track to Keys: every deadline, computed before it bites.",
      "Nine contract dates your client can actually read.",
      "The contract always had them. Nobody ever showed them.",
      "An on-site Director. Charleston. Tuesday.",
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
      at(rider, SIGN_D), at(rider, -SIGN_D),
      at(strip, SIGN_D),
      ...joins([[-0.6, -0.42], [0.6, -0.42], [0.6, 0.16], [-0.6, 0.16], [-0.42, -0.64], [0.42, -0.64]], SIGN_D, -SIGN_D),
      [[-0.05, 0.16, 0], [-0.05, 0.78, 0]],
      [[0.05, 0.16, 0], [0.05, 0.78, 0]],
      [[-0.2, 0.78, 0], [0.2, 0.78, 0]],
    ],
  },
  {
    id: "door",
    says: [
      "Whoever answers first has the conversation.",
      "It's awake at 11pm. You don't have to be.",
      "Speed to lead isn't discipline. It's equipment.",
      "People · Tools · Opportunity.",
    ],
    accent: [201, 124, 92],
    lines: [
      at(doorLeaf, DOOR_D), at(doorLeaf, -DOOR_D),
      at(doorFrame, DOOR_D), at(doorFrame, -DOOR_D),
      at(doorPanel, DOOR_D),
      at(ring(0.2, 0.18, 0.05, 10), DOOR_D),
      ...joins([[-0.46, -0.8], [0.46, -0.8], [0.46, 0.8], [-0.46, 0.8], [-0.32, -0.66], [0.32, -0.66]], DOOR_D, -DOOR_D),
    ],
  },
  {
    id: "farm",
    says: [
      "Eleven years of your own street, on one page.",
      "Farm like you have a research department.",
      "Your MLS, plugged straight into Claude.",
      "Charleston-built. Agent-first.",
    ],
    accent: [217, 174, 100],
    lines: [
      at(skyline, CITY_D), at(skyline, -CITY_D),
      ...joins([[-0.86, 0.06], [-0.62, -0.3], [-0.4, 0.2], [-0.16, -0.56], [0.06, -0.12], [0.3, -0.42], [0.54, 0.16], [-0.86, 0.6], [0.86, 0.6]], CITY_D, -CITY_D),
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
      ...finder(-0.4, -0.4).map((l) => at(l, SCAN_D)),
      ...finder(0.4, -0.4).map((l) => at(l, SCAN_D)),
      ...finder(-0.4, 0.4).map((l) => at(l, SCAN_D)),
      at([[0.16, 0.16], [0.4, 0.16], [0.4, 0.4], [0.62, 0.4]], SCAN_D),
      at([[0.16, 0.5], [0.3, 0.5]], SCAN_D),
      at([[0.5, 0.58], [0.64, 0.58]], SCAN_D),
      ...joins([[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]], SCAN_D, -SCAN_D),
    ],
  },
];

/** Val is COLOUR, not a planet. Five bodies of light on their own small
 *  orbits, drawn as radial gradients under additive blending so they bloom
 *  where they cross and mix into new colour instead of stacking flatly. The
 *  gradient ball that used to sit here read as a beige marble parked in front
 *  of the machinery; this reads as something with a reactor in it. */
const ORBS: { c: [number, number, number]; r: number; orbit: number; speed: number; phase: number; tilt: number }[] = [
  { c: [217, 174, 100], r: 0.46, orbit: 0.26, speed: 0.34, phase: 0.0, tilt: 0.2 },
  { c: [111, 168, 126], r: 0.36, orbit: 0.38, speed: -0.27, phase: 2.1, tilt: 1.1 },
  { c: [201, 124, 92], r: 0.32, orbit: 0.34, speed: 0.21, phase: 4.0, tilt: -0.7 },
  { c: [242, 239, 231], r: 0.22, orbit: 0.16, speed: -0.46, phase: 1.0, tilt: 0.5 },
  { c: [124, 186, 214], r: 0.30, orbit: 0.44, speed: 0.30, phase: 5.2, tilt: -1.3 },
];

const TOTAL = 900;
/** Kept on the sphere at all times, so Val never fully disappears into a shape. */
const CORE = Math.round(TOTAL * 0.38);
const BUILDERS = TOTAL - CORE;

function sample(lines: Line3[], n: number): P3[] {
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
  for (let i = 0; i < n; i++) {
    let d = ((i + 0.5) / n) * total;
    for (const s of segs) {
      if (d <= s.len) {
        const t = d / s.len;
        out.push([
          s.a[0] + (s.b[0] - s.a[0]) * t,
          s.a[1] + (s.b[1] - s.a[1]) * t,
          s.a[2] + (s.b[2] - s.a[2]) * t,
        ]);
        break;
      }
      d -= s.len;
    }
  }
  while (out.length < n) out.push(out[out.length - 1] ?? [0, 0, 0]);
  return out;
}

const FORMS = SHAPES.map((s) => ({ id: s.id, says: s.says, accent: s.accent, pts: sample(s.lines, BUILDERS) }));

// Slow on purpose. An earlier pass had the particles SNAP into place with an
// overshoot, which was exciting for half a second and then over. Forming and
// dissolving slowly is the thing people can't look away from — and the room is
// filling up, so there is nowhere to hurry to. A symbol that takes four
// seconds to arrive and turns for twelve gets looked at twice.
const DRIFT = 3000;
const GATHER = 4800;
const HOLD = 12000;
const SCATTER = 4200;
const PHASE = DRIFT + GATHER + HOLD + SCATTER;

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
  onForm?: (shape: { id: string; says: string[] } | null) => void;
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
      if (p < DRIFT) pull = 0;
      else if (p < DRIFT + GATHER) {
        pull = easeInOut((p - DRIFT) / GATHER);
        shooting = true;
      } else if (p < DRIFT + GATHER + HOLD) pull = 1;
      else {
        pull = 1 - easeInOut((p - DRIFT - GATHER - HOLD) / SCATTER);
        shooting = true;
      }
      if (calm) pull = 0;

      const heldId = pull > 0.9 ? form.id : null;
      if (heldId !== announced) {
        announced = heldId;
        if (heldId) lockAt = t;
        formCb.current?.(heldId ? { id: form.id, says: form.says } : null);
      }

      // Fast while loose, calmer while holding a shape so it can be read —
      // but never stopped: a symbol that keeps turning gets looked at twice.
      if (!calm) yaw += dt * (0.95 - 0.45 * pull);
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
      ctx.fillStyle = `rgba(0,0,0,${calm ? 1 : 0.16})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

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
      const orbScale = 1 - 0.42 * pull;
      const orbGain = 1 - 0.62 * pull;
      const orbDraw = 1 - 0.5 * pull; // pulled in behind the shape, watching
      for (const o of ORBS) {
        const a = t / 1000 * o.speed + o.phase;
        const ox = Math.cos(a) * o.orbit * orbDraw;
        const oz = Math.sin(a) * o.orbit * orbDraw;
        const oy = Math.sin(a * 1.7 + o.phase) * o.orbit * 0.5 * Math.cos(o.tilt) * orbDraw;
        const q = project(ox, oy, oz);
        const rad = Math.max(2, o.r * unit * q.persp * orbScale);
        const g = ctx.createRadialGradient(q.px, q.py, 0, q.px, q.py, rad);
        const peak = (0.5 + q.persp * 0.3) * orbGain;
        g.addColorStop(0, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${peak})`);
        g.addColorStop(0.42, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${peak * 0.32})`);
        g.addColorStop(1, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(q.px, q.py, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- the core: Val, always there ----
      for (const d of core) {
        const q = project(d.x * d.r, d.y * d.r, d.z * d.r);
        const depth = Math.min(1, Math.max(0, (q.persp - 0.66) / 0.9));
        const a = 0.12 + depth * 0.5;
        ctx.beginPath();
        ctx.arc(q.px, q.py, Math.max(0.4, d.size * q.persp), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242,239,231,${a})`;
        ctx.fill();
      }

      // ---- the builders: the ones that go and make something ----
      ctx.lineWidth = 1.1;
      for (let i = 0; i < builders.length; i++) {
        const d = builders[i];
        const tgt = form.pts[i];
        // Stagger so they arrive in waves rather than as one blob.
        const k = Math.min(1, Math.max(0, pull * (1 + d.lag * 0.5) - d.lag * 0.35));
        const hx = d.x * d.r;
        const hy = d.y * d.r;
        const hz = d.z * d.r;
        const q = project(
          hx + (tgt[0] - hx) * k,
          hy + (tgt[1] - hy) * k,
          hz + (tgt[2] - hz) * k
        );
        const depth = Math.min(1, Math.max(0, (q.persp - 0.66) / 0.9));

        // Streak: only while actually travelling, and only if it moved.
        if (shooting && d.seen) {
          const dx = q.px - d.px;
          const dy = q.py - d.py;
          const sp2 = dx * dx + dy * dy;
          if (sp2 > 0.35) {
            ctx.beginPath();
            ctx.moveTo(d.px, d.py);
            ctx.lineTo(q.px, q.py);
            ctx.strokeStyle = `rgba(246,244,238,${Math.min(0.32, sp2 / 60)})`;
            ctx.stroke();
          }
        }
        d.px = q.px;
        d.py = q.py;
        d.seen = true;

        const a = (0.1 + k * 0.5) + depth * 0.42;
        ctx.beginPath();
        ctx.arc(q.px, q.py, Math.max(0.4, d.size * q.persp * (0.8 + k * 0.4)), 0, Math.PI * 2);
        // White. The colour in this picture is Val; the shape is the light she
        // is watching get built, and it reads far cleaner against her bloom.
        ctx.fillStyle = `rgba(246,244,238,${Math.min(0.95, a)})`;
        ctx.fill();
      }

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
