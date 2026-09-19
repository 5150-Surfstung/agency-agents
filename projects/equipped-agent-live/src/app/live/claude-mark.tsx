// THE CLAUDE ASTERISK.
//
// Drawn rather than fetched: eleven tapered spokes on a shared centre, which
// is the shape people recognise instantly and the fastest way to tell an agent
// scrolling a feed that this hour is about Claude specifically and not "AI" in
// general. As an inline SVG it costs no request, scales to any size without
// going soft, and carries the one colour on the page that is not Mike's navy
// or his gold — which is exactly why it reads as a signal rather than as
// decoration.
//
// It spins slowly, and it stops for anybody who asked for less motion.

const SPOKES = 11;
const OUTER = 46;
const INNER = 11;
const BULGE = 4.1;

export function ClaudeMark({
  size = 44,
  spin = true,
  className = "",
}: {
  size?: number;
  spin?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={`claude-mark${spin ? " is-spinning" : ""} ${className}`.trim()}
    >
      <g fill="currentColor">
        {Array.from({ length: SPOKES }, (_, i) => (
          <path
            key={i}
            transform={`rotate(${(360 / SPOKES) * i} 50 50)`}
            d={`M 50 ${50 - OUTER}
                Q ${50 + BULGE} ${50 - (OUTER + INNER) / 2} 50 ${50 - INNER}
                Q ${50 - BULGE} ${50 - (OUTER + INNER) / 2} 50 ${50 - OUTER} Z`}
          />
        ))}
      </g>
    </svg>
  );
}
