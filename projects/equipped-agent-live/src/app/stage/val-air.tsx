"use client";

// THE AIR. A full-bleed canvas behind the whole standby screen, so the
// digital weather isn't confined to Val's stage: data streaks crossing the
// room, columns of hex falling at the edges, and a slow scan bar that reads
// the entire wall every few seconds. Everything is faint — the lockup, the
// feed and Val's lines sit on top of it and stay legible — and it goes still
// for anyone who asked their OS for less motion.

import { useEffect, useRef } from "react";

const GLYPHS = "0123456789ABCDEF·▸";

// WHAT GOES IN AND WHAT COMES OUT.
//
// Words cross the whole room and are taken into Val, and others are thrown
// back out of her. What goes IN is what an agent already has and already says
// — the leads, the CRM, the farm, the referrals. What comes OUT is what The
// Agent Connection puts around it. The split is the entire pitch, made without
// a sentence, and it runs for the whole pre-show.
//
// This lives on the full-bleed canvas rather than the orb's own: that one is
// only as wide as the orb box, so a word had nowhere to travel and every one
// of them landed on top of the shape.
// Going in: the raw material of the job — the stuff an agent already has and
// mostly cannot get to. Coming out: what it turns into, and the names of the
// actual machinery, because the hour teaches one named tool rather than "AI"
// and the words in the air should say so.
const WORDS_IN = [
  "LEADS", "CRM", "REFERRALS", "YOUR DATABASE", "THE FARM", "PAST CLIENTS",
  "LISTING APPOINTMENTS", "OPEN HOUSES", "YOUR SPHERE", "COMPS",
  "SHOWING REQUESTS", "THE CONTRACT", "YOUR MLS", "FOLLOW-UP",
  "THE 11PM TEXT", "THE INSPECTION", "THAT ONE DETAIL", "EVERY DEADLINE",
];
const WORDS_OUT = [
  "CLAUDE", "A SKILL OF YOUR OWN", "CONNECTORS", "YOUR MLS, IN ENGLISH",
  "GROUNDED ANSWERS", "\u201CI DON\u2019T HAVE THAT\u201D", "BUILT ON YOUR ACCOUNT",
  "MENTORSHIP", "CONNECTIONS", "TRAINING", "LEADING AI TECHNOLOGY",
  "COLLABORATION", "THE OFFICE", "TRACK TO KEYS", "SPEED TO LEAD",
  "SMARTER TOOLS", "STRONGER AGENTS", "BIGGER OPPORTUNITIES", "REAL IMPACT",
  "PEOPLE · TOOLS · OPPORTUNITY", "AN ON-SITE DIRECTOR", "YOUR OWN FRONT DESK",
  "A PLAN THAT FITS YOU", "THE AGENT CONNECTION", "SURFSTUNG SYSTEMS",
];
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

    type Word = { text: string; out: boolean; a: number; u: number; speed: number; wait: number; live: boolean };
    const words: Word[] = Array.from({ length: 6 }, (_, i) => ({
      text: "", out: false, a: 0, u: 0, speed: 0, wait: i * 1.1, live: false,
    }));
    let wIn = 0, wOut = 0, wSlot = 0;

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
      ctx.clearRect(0, 0, w, h);
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

      // the vocabulary: in from the room, out of Val, and back into the room
      {
        // Where Val sits on this canvas: centred in the column, a little above
        // the middle, because the wordmark and the lines live underneath her.
        const vx = w / 2, vy = h * 0.46;
        const reach = Math.max(w, h) * 0.62;
        const fs = Math.max(13, Math.round(Math.min(w, h) * 0.032));
        ctx.font = `700 ${fs}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const wd of words) {
          if (!wd.live) {
            wd.wait -= dt;
            if (wd.wait > 0) continue;
            // Alternate, so the room always sees the trade being made.
            wd.out = wSlot % 2 === 1;
            if (wd.out) { wd.text = WORDS_OUT[wOut % WORDS_OUT.length]; wOut++; }
            else { wd.text = WORDS_IN[wIn % WORDS_IN.length]; wIn++; }
            // Golden-angle stepping so consecutive words never share a lane.
            wd.a = wSlot * 2.399963 + (Math.random() - 0.5) * 0.5;
            wSlot++;
            wd.speed = 0.17 + Math.random() * 0.08;
            wd.u = 0;
            wd.live = true;
          }
          wd.u += dt * wd.speed;
          if (wd.u >= 1) {
            wd.live = false;
            wd.wait = 0.2 + Math.random() * 1.1;
            continue;
          }
          const e = wd.u < 0.5 ? 2 * wd.u * wd.u : 1 - Math.pow(-2 * wd.u + 2, 2) / 2;
          // Inbound falls from the room into her; outbound is thrown back out.
          const rr = wd.out ? e : 1 - e;
          const x = vx + Math.cos(wd.a) * reach * rr;
          const y = vy + Math.sin(wd.a) * reach * 0.3 * rr;
          // It shrinks and dims as it reaches her, so it is absorbed rather
          // than parked on top of the shape.
          const near = Math.min(1, Math.max(0, (rr - 0.12) / 0.26));
          const edge = Math.min(1, (1 - rr) / 0.12);
          // GONE BEFORE IT IS CUT. These travel 0.62 of the long side out from
          // the middle, which on a wide, short band puts the far end of the
          // trip outside the canvas — so a word was being sliced in half by
          // the edge at nearly full opacity and left sitting there, reading as
          // a stray label rather than something Val threw. Fade each one on
          // how close its own box is to the wall, measured, so a long phrase
          // starts dissolving earlier than a short one.
          const sc2 = 0.55 + rr * 0.55;
          const halfW = (ctx.measureText(wd.text).width * sc2) / 2;
          const halfH = (fs * sc2) / 2;
          const outX = Math.max(0, Math.abs(x - w / 2) + halfW - (w / 2 - 4));
          const outY = Math.max(0, Math.abs(y - h / 2) + halfH - (h / 2 - 4));
          const room = Math.min(
            outX > 0 ? Math.max(0, 1 - outX / (fs * 1.5)) : 1,
            outY > 0 ? Math.max(0, 1 - outY / (fs * 1.2)) : 1
          );
          const A = near * edge * room * 0.92;
          if (A <= 0.02) continue;
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(sc2, sc2);
          // What comes out of Val is gold; what goes in is the cool side.
          ctx.fillStyle = wd.out ? `rgba(226,190,124,${A})` : `rgba(150,186,212,${A * 0.8})`;
          ctx.fillText(wd.text, 0, 0);
          ctx.restore();
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
