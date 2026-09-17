// The house mark for the pre-show, set in type.
//
// There is no logo file in this repo, and a broken <img> on a projector in
// front of forty people is worse than no logo at all — so this is a
// typographic lockup built from the brand's own language. Drop the real mark
// in `public/` and swap the wordmark block for an <img> when it exists.

export function TacLockup() {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="font-[family-name:var(--font-display)] text-[clamp(18px,2.3vw,40px)] font-semibold leading-none tracking-[0.12em] text-cream">
        The <span className="text-gold">AGENT</span> Connection
        <span className="align-super text-[0.42em] tracking-normal">™</span>
      </p>
      <span className="mt-[1.4vh] h-px w-[min(34vw,26rem)] bg-gold/60" />
      <p className="mt-[1.4vh] text-[clamp(10px,1.05vw,17px)] font-bold uppercase tracking-[0.34em] text-gold">
        AI Strategy Course
      </p>
      <p className="mt-[0.9vh] text-[clamp(9px,0.8vw,13px)] font-semibold uppercase tracking-[0.28em] text-faint">
        People · Tools · Opportunity
      </p>
    </div>
  );
}
