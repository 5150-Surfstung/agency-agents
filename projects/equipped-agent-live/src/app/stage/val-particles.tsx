"use client";

// VAL, THINKING.
//
// A field of particles drifts in a shell around the orb, gathers itself into a
// house, a key, a sold sign — turning in three dimensions so the room sees it
// from every side — holds long enough to land, and falls apart again. It is
// the pre-show, and it has exactly one job: make somebody walking in late stop
// and ask what that is before anyone has said a word.
//
// Canvas, because this is interpolation between point clouds, not keyframes.
// The shapes are genuine 3D wireframes sampled by arc length, rotated with a
// yaw/pitch matrix and projected with perspective, so depth shows up as size
// and brightness rather than as a trick. Each particle keeps a fixed index
// into every shape, so the same speck is always the same corner of the house —
// that is what makes the gather read as assembly instead of a reshuffle.
//
// Built not to be a liability on somebody else's projector: one rAF loop, a
// few hundred dots, no images, no network, it stops when the tab is hidden,
// and under prefers-reduced-motion it renders one calm frame instead of
// strobing at a room sitting in the dark.

import { useEffect, useRef } from "react";

type P3 = [number, number, number];
type Line3 = P3[];

/** Lift a 2D outline onto a z-plane. */
const at = (pts: [number, number][], z: number): Line3 => pts.map(([x, y]) => [x, y, z] as P3);
/** Edges joining the same 2D point on two z-planes — what makes it solid. */
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
const keyTeeth: [number, number][] = [
  [0.34, 0.06], [0.34, 0.3], [0.44, 0.3], [0.44, 0.06],
];
const keyTeeth2: [number, number][] = [
  [0.52, 0.06], [0.52, 0.24], [0.62, 0.24], [0.62, 0.06],
];

const SIGN_D = 0.05;
const board: [number, number][] = [[-0.6, -0.42], [0.6, -0.42], [0.6, 0.16], [-0.6, 0.16], [-0.6, -0.42]];
const rider: [number, number][] = [[-0.42, -0.64], [0.42, -0.64], [0.42, -0.48], [-0.42, -0.48], [-0.42, -0.64]];
const strip: [number, number][] = [[-0.46, -0.27], [0.46, -0.27], [0.46, -0.09], [-0.46, -0.09], [-0.46, -0.27]];

const SHAPES: { name: string; lines: Line3[] }[] = [
  {
    name: "a house",
    lines: [
      at(houseFace, HOUSE_D), at(houseFace, -HOUSE_D),
      at(houseGable, HOUSE_D), at(houseGable, -HOUSE_D),
      [[0, -0.62, HOUSE_D], [0, -0.62, -HOUSE_D]], // ridge
      ...joins([[-0.5, -0.04], [0.5, -0.04], [0.5, 0.58], [-0.5, 0.58]], HOUSE_D, -HOUSE_D),
      at([[-0.13, 0.58], [-0.13, 0.2], [0.13, 0.2], [0.13, 0.58]], HOUSE_D), // door
      at(ring(0.28, 0.16, 0.11, 12), HOUSE_D), // window
      at(ring(-0.28, 0.16, 0.11, 12), HOUSE_D),
    ],
  },
  {
    name: "a key",
    lines: [
      at(keyPlate, KEY_D), at(keyPlate, -KEY_D),
      at(keyTeeth, KEY_D), at(keyTeeth, -KEY_D),
      at(keyTeeth2, KEY_D), at(keyTeeth2, -KEY_D),
      at(ring(-0.44, 0, 0.11, 14), KEY_D), // the hole
      ...joins([[-0.71, 0], [-0.17, 0], [0.66, -0.06], [0.66, 0.06], [-0.44, -0.27], [-0.44, 0.27]], KEY_D, -KEY_D),
    ],
  },
  {
    name: "sold",
    lines: [
      at(board, SIGN_D), at(board, -SIGN_D),
      at(rider, SIGN_D), at(rider, -SIGN_D),
      at(strip, SIGN_D),
      ...joins([[-0.6, -0.42], [0.6, -0.42], [0.6, 0.16], [-0.6, 0.16], [-0.42, -0.64], [0.42, -0.64]], SIGN_D, -SIGN_D),
      [[-0.05, 0.16, 0], [-0.05, 0.78, 0]], // post
      [[0.05, 0.16, 0], [0.05, 0.78, 0]],
      [[-0.2, 0.78, 0], [0.2, 0.78, 0]],    // ground
    ],
  },
];

const COUNT = 300;

/** Sample `n` points along 3D polylines, spaced by arc length so corners
 *  don't hoard particles and long edges don't go bare. */
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

const FORMS = SHAPES.map((s) => ({ name: s.name, pts: sample(s.lines, COUNT) }));

const DRIFT = 3000;
const GATHER = 2000;
const HOLD = 4200;
const SCATTER = 1500;
const PHASE = DRIFT + GATHER + HOLD + SCATTER;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function ValParticles({
  className = "",
  onForm,
}: {
  className?: string;
  /** Fires with the shape's name while it is assembled, null while drifting —
   *  so the wordmark underneath can name what Val just made. */
  onForm?: (name: string | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const formCb = useRef(onForm);
  formCb.current = onForm;

  useEffect(() => {
    const cv = canvas.current;
    const box = host.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const dots = Array.from({ length: COUNT }, (_, i) => {
      // Fibonacci sphere: an even shell, not a clumped random one.
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      return {
        hx: Math.cos(phi) * r,
        hy: y,
        hz: Math.sin(phi) * r,
        shell: 0.62 + (i % 7) * 0.035,
        size: 0.7 + ((i * 7919) % 100) / 100 * 1.3,
        idx: i,
      };
    });

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
    const start = performance.now();

    const frame = (now: number) => {
      // The rAF timestamp is the time the frame BEGAN, which can be a hair
      // earlier than the performance.now() captured just before scheduling it.
      // That made `t` negative, `Math.floor(t / PHASE) % 3` equal -1, and
      // FORMS[-1] undefined — the loop threw on frame one and nothing ever
      // drew. Clamp, and never trust a raw % for an index.
      const t = Math.max(0, now - start);
      const form = FORMS[Math.floor(t / PHASE) % FORMS.length] ?? FORMS[0];
      const p = t % PHASE;

      let pull = 0;
      if (p < DRIFT) pull = 0;
      else if (p < DRIFT + GATHER) pull = easeInOut((p - DRIFT) / GATHER);
      else if (p < DRIFT + GATHER + HOLD) pull = 1;
      else pull = 1 - easeInOut((p - DRIFT - GATHER - HOLD) / SCATTER);
      if (calm) pull = 0;

      const named = pull > 0.85 ? form.name : null;
      if (named !== announced) {
        announced = named;
        formCb.current?.(named);
      }

      const secs = calm ? 0 : t / 1000;
      // Yaw carries the reveal; a gentle pitch keeps it from reading as a
      // flat spinning cutout.
      const yaw = secs * 0.5;
      const pitch = Math.sin(secs * 0.31) * 0.34 - 0.1;
      const cy_ = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);

      ctx.clearRect(0, 0, w, h);
      const ox = w / 2;
      const oy = h / 2;

      for (const d of dots) {
        const tgt = form.pts[d.idx];
        // Blend the resting shell with the shape, then rotate the result —
        // so the cloud is already turning before it becomes anything.
        const x = d.hx * d.shell + (tgt[0] - d.hx * d.shell) * pull;
        const y = d.hy * d.shell + (tgt[1] - d.hy * d.shell) * pull;
        const z = d.hz * d.shell + (tgt[2] - d.hz * d.shell) * pull;

        const x1 = x * cy_ + z * sy;
        const z1 = z * cy_ - x * sy;
        const y1 = y * cp - z1 * sp;
        const z2 = z1 * cp + y * sp;

        const persp = 1 / (1 + z2 * 0.55);
        const px = ox + x1 * unit * 0.94 * persp;
        const py = oy + y1 * unit * 0.94 * persp;

        const depth = (persp - 0.66) / 0.9; // ~0 at the back, ~1 at the front
        const alpha = (0.16 + pull * 0.5) + depth * 0.4;
        const size = d.size * persp * (0.8 + pull * 0.45);

        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.4, size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(217, 174, 100, ${Math.min(0.95, Math.max(0.05, alpha))})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    const onVis = () => {
      cancelAnimationFrame(raf);
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
