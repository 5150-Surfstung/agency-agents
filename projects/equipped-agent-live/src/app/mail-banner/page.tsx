import { ValParticles } from "@/app/stage/val-particles";

// A 1200x480 banner, rendered once by Playwright and committed as an image.
// Email cannot run the engine, so the engine gets photographed: the same orb,
// the same lighting, the same HUD, held on the shape that reads fastest at a
// glance.
//
// The drifting vocabulary layer is deliberately NOT here. It is designed for a
// tall stage; in a letterbox its words run off both edges and a clipped word
// reads as a broken image rather than as atmosphere.
export default function MailBanner() {
  return (
    <div
      className="stage relative flex items-center justify-center overflow-hidden bg-sheet"
      style={{ width: 1200, height: 480 }}
    >
      <div className="relative" style={{ width: 400, height: 400 }}>
        <ValParticles className="absolute inset-0" pin="sold" />
      </div>

      {[
        "left-[30px] top-[26px] border-l-2 border-t-2",
        "right-[30px] top-[26px] border-r-2 border-t-2",
        "left-[30px] bottom-[26px] border-l-2 border-b-2",
        "right-[30px] bottom-[26px] border-r-2 border-b-2",
      ].map((cls) => (
        <span key={cls} className={`absolute h-[30px] w-[30px] border-gold/55 ${cls}`} aria-hidden />
      ))}

      <p className="label absolute bottom-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] tracking-[0.34em] text-gold-bright">
        AI REvealed · first Friday · Charleston
      </p>
    </div>
  );
}
