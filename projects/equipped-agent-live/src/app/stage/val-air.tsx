"use client";

// THE AIR. A full-bleed canvas behind the whole standby screen, so the
// digital weather isn't confined to Val's stage: data streaks crossing the
// room, columns of hex falling at the edges, and a slow scan bar that reads
// the entire wall every few seconds. Everything is faint — the lockup, the
// feed and Val's lines sit on top of it and stay legible — and it goes still
// for anyone who asked their OS for less motion.

import { useEffect, useRef } from "react";

const GLYPHS = "0123456789ABCDEF·▸";
const COL = ["124,186,214", "246,244,238", "217,174,100"];

export function ValAir({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const box = host.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0, h = 0;
    const fit = () => {
      // 1x on purpose. This layer is out-of-focus weather behind the stage;
      // at 2x it was clearing four times the pixels for no visible gain.
      const dpr = 1;
      const r = box.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    type Streak = { x: number; y: number; v: number; len: number; c: number; a: number; live: boolean; wait: number };
    const streaks: Streak[] = Array.from({ length: 24 }, (_, i) => ({
      x: 0, y: 0, v: 0, len: 0, c: i % 3, a: 0, live: false, wait: Math.random() * 3,
    }));
    type Column = { x: number; y: number; v: number; n: number; chars: string[]; tick: number };
    const columns: Column[] = Array.from({ length: 8 }, (_, i) => ({
      x: 0, y: 0, v: 0, n: 9 + (i % 4) * 2, chars: [], tick: 0,
    }));
    const seedColumn = (c: Column, fresh: boolean) => {
      // Outer thirds only: the middle of the wall belongs to Val.
      const side = Math.random() < 0.5 ? 0 : 1;
      c.x = side ? w * (0.72 + Math.random() * 0.26) : w * (0.02 + Math.random() * 0.26);
      c.y = fresh ? Math.random() * h : -c.n * 14;
      c.v = 28 + Math.random() * 40;
      c.chars = Array.from({ length: c.n }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
    };
    for (const c of columns) seedColumn(c, true);

    let raf = 0;
    let last = 0;
    let scanY = -1;
    let scanWait = 4;
    let due = 0;
    // The air drops to 20fps and half its streaks when the machine is busy.
    let lite = false;
    let avgDt = 33;
    const frame = (now: number) => {
      // 30fps. This layer is weather; the stage it sits behind runs at full
      // rate and that is the one anybody is actually watching.
      if (now < due) {
        raf = requestAnimationFrame(frame);
        return;
      }
      due = now + (lite ? 50 : 32);
      const dt = last ? Math.min(0.08, (now - last) / 1000) : 0.033;
      if (last) {
        avgDt += ((now - last) - avgDt) * 0.06;
        if (!lite && avgDt > 46) lite = true;
        else if (lite && avgDt < 36) lite = false;
      }
      last = now;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // streaks
      const nStreaks = lite ? streaks.length >> 1 : streaks.length;
      for (let si = 0; si < nStreaks; si++) {
        const s = streaks[si];
        if (!s.live) {
          s.wait -= dt;
          if (s.wait > 0) continue;
          const fromLeft = Math.random() < 0.5;
          s.x = fromLeft ? -200 : w + 200;
          s.y = Math.random() * h;
          s.v = (fromLeft ? 1 : -1) * (260 + Math.random() * 520);
          s.len = 40 + Math.random() * 160;
          s.a = 0.12 + Math.random() * 0.3;
          s.live = true;
        }
        s.x += s.v * dt;
        if (s.x < -300 || s.x > w + 300) {
          s.live = false;
          s.wait = 0.3 + Math.random() * 2.6;
          continue;
        }
        const tail = s.x - Math.sign(s.v) * s.len;
        const mid = s.x - Math.sign(s.v) * s.len * 0.45;
        ctx.lineWidth = s.c === 1 ? 1.3 : 1;
        ctx.strokeStyle = `rgba(${COL[s.c]},${s.a * 0.35})`;
        ctx.beginPath();
        ctx.moveTo(tail, s.y);
        ctx.lineTo(mid, s.y);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${COL[s.c]},${s.a})`;
        ctx.beginPath();
        ctx.moveTo(mid, s.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      // code columns
      ctx.font = '500 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      for (const c of columns) {
        c.y += c.v * dt;
        c.tick += dt;
        if (c.tick > 0.12) {
          c.tick = 0;
          c.chars[Math.floor(Math.random() * c.n)] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        if (c.y - c.n * 14 > h) seedColumn(c, false);
        for (let i = 0; i < c.n; i++) {
          const y = c.y - i * 14;
          if (y < -14 || y > h) continue;
          const a = i === 0 ? 0.3 : 0.11 * (1 - i / c.n);
          ctx.fillStyle = `rgba(124,186,214,${a})`;
          ctx.fillText(c.chars[i], c.x, y);
        }
      }

      // the wall scan
      scanWait -= dt;
      if (scanWait <= 0 && scanY < 0) scanY = 0;
      if (scanY >= 0) {
        scanY += h * 0.22 * dt;
        for (let b = 0; b < 4; b++) {
          ctx.fillStyle = `rgba(124,186,214,${0.09 * ((b + 1) / 4) * 0.55})`;
          ctx.fillRect(0, scanY - 40 + b * 10, w, 10);
        }
        ctx.fillStyle = "rgba(200,230,245,0.16)";
        ctx.fillRect(0, scanY, w, 1);
        if (scanY > h + 40) {
          scanY = -1;
          scanWait = 7 + Math.random() * 6;
        }
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
    <div ref={host} className={className} aria-hidden>
      <canvas ref={canvas} className="block h-full w-full" />
    </div>
  );
}
