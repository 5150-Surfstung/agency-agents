// THE VAL ORB.
//
// Val is the least visible thing in the room — a library, a set of rules, a
// memory. Everything else in this hour has something to LOOK at: a histogram,
// a leaderboard, a QR that turns into a lead. So Val gets a body.
//
// It is drawn, not fetched: layered gradients, three tilted rings on their own
// clocks, and particles riding the outer edge. No image, no video, no asset to
// go missing five minutes before a class starts on somebody else's projector.
// It respects prefers-reduced-motion, because a slow strobe in a dark room is
// a real problem for real people.

export function ValOrb({ className = "", label = true }: { className?: string; label?: boolean }) {
  // The caller's className owns POSITION and SIZE; `.val-orb` owns the drawing
  // and must stay `position: relative` for its layers. Putting both on one
  // element let the stylesheet's `relative` beat Tailwind's `absolute`, which
  // dropped a 400px orb into the middle of the layout. Two elements, no fight.
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      <div className="val-orb">
      <span className="val-orb__glow" />
      <span className="val-orb__core" />
      <span className="val-orb__sheen" />
      <span className="val-orb__ring val-orb__ring--a" />
      <span className="val-orb__ring val-orb__ring--b" />
      <span className="val-orb__ring val-orb__ring--c" />
      {/* Each mote is one confirmed pattern going around again. */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`val-orb__mote val-orb__mote--${i}`} />
      ))}
        {label && <span className="val-orb__label">VAL</span>}
      </div>
    </div>
  );
}
