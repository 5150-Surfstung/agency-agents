// THE CLAUDE ASTERISK.
//
// First attempt drew each ray as a filled lens, which at 30px came out as a
// thin spiky star — a sparkle, not the mark. The real thing is CHUNKY: eleven
// rounded strokes radiating from a tight centre, each one gently tapered, the
// negative space between them as much a part of the shape as the rays. So it
// is drawn as strokes with round caps and a taper built from two overlapping
// passes, which is what gives the ends their weight without going spiky.
//
// Inline SVG: no request, no soft edges at any size, and one colour that is
// neither Mike's navy nor his gold — which is the entire job. An agent
// scrolling a feed full of "AI" should know in half a second that this hour is
// about Claude specifically.

const SPOKES = 11;

export function ClaudeMark({
  size = 44,
  spin = true,
  className = "",
}: {
  size?: number;
  spin?: boolean;
  className?: string;
}) {
  const rays = Array.from({ length: SPOKES }, (_, i) => (360 / SPOKES) * i);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={`claude-mark${spin ? " is-spinning" : ""} ${className}`.trim()}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        fill="none"
        transform="translate(50 50)"
      >
        {/* The body of each ray: thick, reaching almost to the edge. */}
        {rays.map((a) => (
          <line
            key={`b${a}`}
            x1="0"
            y1="-4"
            x2="0"
            y2="-41"
            strokeWidth="9.4"
            transform={`rotate(${a})`}
          />
        ))}
        {/* A second, narrower pass a little further out. Where it overhangs the
            first it makes the tip read as tapered rather than clipped flat. */}
        {rays.map((a) => (
          <line
            key={`t${a}`}
            x1="0"
            y1="-30"
            x2="0"
            y2="-45.5"
            strokeWidth="6.2"
            transform={`rotate(${a})`}
          />
        ))}
      </g>
    </svg>
  );
}
