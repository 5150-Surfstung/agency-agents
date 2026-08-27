"use client";

// Eleven years of a single neighborhood, drawing itself across the projector.
// Every point is a real median of recorded closings; the hollow ones are the
// years with under thirty sales, drawn hollow ON PURPOSE so the room can see
// which points carry weight. The flat stretch and the run are shaded because
// that contrast IS the pitch: a twelve-month report shows neither.

import { SERIES_NOTE, SERIES_SOURCE, STONOVIEW_SERIES } from "@/lib/index-data";

const W = 1000;
const H = 420;
const PAD = { top: 62, right: 104, bottom: 46, left: 38 };

export function IndexChart() {
  const pts = STONOVIEW_SERIES;
  const lo = 380;
  const hi = 920;
  const x = (i: number) => PAD.left + (i / (pts.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.medianK).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - PAD.bottom} L${x(0).toFixed(1)},${H - PAD.bottom} Z`;
  // Rough path length for the draw animation — generous is fine, it only
  // needs to exceed the true length so the dash fully hides the line.
  const len = Math.round(
    pts.reduce((s, p, i) => (i === 0 ? 0 : s + Math.hypot(x(i) - x(i - 1), y(p.medianK) - y(pts[i - 1].medianK))), 0) * 1.05
  );

  const flatFrom = pts.findIndex((p) => p.year === 2016);
  const flatTo = pts.findIndex((p) => p.year === 2019);
  const runFrom = pts.findIndex((p) => p.year === 2020);
  const peakIdx = pts.findIndex((p) => p.year === 2025);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Stonoview median sold price by year, 2015 to 2025">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d0a050" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#d0a050" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the four flat years, then the run — the whole story in two shades */}
        <g className="chart-band">
          <rect
            x={x(flatFrom)}
            y={PAD.top}
            width={x(flatTo) - x(flatFrom)}
            height={H - PAD.top - PAD.bottom}
            fill="#f2efe7"
            fillOpacity={0.035}
          />
          <rect
            x={x(runFrom)}
            y={PAD.top}
            width={x(peakIdx) - x(runFrom)}
            height={H - PAD.top - PAD.bottom}
            fill="#d0a050"
            fillOpacity={0.07}
          />
        </g>

        <path className="chart-area" d={area} fill="url(#areaFill)" />
        <path
          className="chart-line"
          d={line}
          fill="none"
          stroke="#d9ae64"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ ["--len" as string]: `${len}` }}
        />

        {pts.map((p, i) => (
          <g key={p.year}>
            <circle
              className="chart-dot"
              cx={x(i)}
              cy={y(p.medianK)}
              r={p.year === 2025 ? 9 : 6}
              fill={p.thin ? "#071320" : "#d9ae64"}
              stroke="#d9ae64"
              strokeWidth={p.thin ? 2.5 : 0}
              style={{ animationDelay: `${0.4 + i * 0.18}s` }}
            />
            <text
              x={x(i)}
              y={H - PAD.bottom + 26}
              textAnchor="middle"
              className="chart-dot"
              style={{ animationDelay: `${0.4 + i * 0.18}s` }}
              fill="#8fa3b5"
              fontSize={20}
              fontWeight={600}
            >
              {`'${String(p.year).slice(2)}`}
            </text>
          </g>
        ))}

        {/* the peak, called out */}
        <g className="chart-callout">
          <text x={W - 10} y={y(pts[peakIdx].medianK) - 24} textAnchor="end" fill="#d9ae64" fontSize={30} fontWeight={700}>
            $859.9K
          </text>
          <text x={W - 10} y={y(pts[peakIdx].medianK) - 50} textAnchor="end" fill="#8fa3b5" fontSize={16} fontWeight={600}>
            PEAK · 2025
          </text>
          <text x={x(0) - 6} y={y(pts[0].medianK) + 32} fill="#8fa3b5" fontSize={19} fontWeight={600}>
            $421.6K
          </text>
        </g>
        <text
          className="chart-callout"
          x={(x(flatFrom) + x(flatTo)) / 2}
          y={PAD.top - 16}
          textAnchor="middle"
          fill="#8fa3b5"
          fontSize={17}
          fontWeight={600}
        >
          four years flat
        </text>
        <text
          className="chart-callout"
          x={(x(runFrom) + x(peakIdx)) / 2}
          y={PAD.top - 16}
          textAnchor="middle"
          fill="#d0a050"
          fontSize={17}
          fontWeight={700}
        >
          +70% in five
        </text>
      </svg>
      <p className="mt-[0.8vh] text-[clamp(11px,0.95vw,15px)] text-faint">
        {SERIES_NOTE} · {SERIES_SOURCE}
      </p>
    </div>
  );
}
