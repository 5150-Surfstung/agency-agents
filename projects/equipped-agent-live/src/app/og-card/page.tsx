import { ValAir } from "@/app/stage/val-air";
import { ValParticles } from "@/app/stage/val-particles";
import { EVENT, eventShort } from "@/lib/event";

// THE SHARE CARD, as a real page so it can be rendered and saved as a PNG.
//
// Not generated at request time: an OG image that depends on fetching a font
// at request time is an OG image that eventually shows up blank in somebody's
// feed, and the feed is the one place you never get a second look. This renders
// at exactly 1200×630 with the real typeface and the real orb, gets
// screenshotted into public/og.png, and ships as a file. Change the date and
// re-render it.
//
// Two decisions that matter more than anything else here:
//
// THE ORB IS PINNED. Left cycling, the card would be whatever shape happened
// to be mid-flight when the screenshot fired — sometimes a lit Charleston
// single, sometimes an unreadable cloud. Pinned to the house it is the same
// silhouette every time, which is the difference between a designed poster and
// a lucky frame.
//
// IT HAS TO READ AT THUMBNAIL SIZE. Most people will see this two inches wide
// in a feed, so there are exactly three things big enough to survive that: the
// silhouette, the wordmark, and the date. Everything else — the series line,
// the pillars, the corner brackets — is detail for the people who stop.
export const metadata = { robots: { index: false } };

const PILLARS = ["Smarter tools", "Stronger agents", "Bigger opportunities", "Real impact"];

export default function OgCard() {
  return (
    <div
      className="stage relative isolate flex items-center overflow-hidden bg-sheet"
      style={{ width: 1200, height: 630 }}
    >
      <ValAir className="air-mask pointer-events-none absolute inset-0 -z-10" />

      {/* The orb sits fully inside the frame. It was bleeding off the right
          edge, which cropped the roof and cut the HUD readout in half — and a
          half-cut line of type reads as a bug rather than a crop. */}
      <div className="absolute right-[10px] top-1/2 h-[560px] w-[560px] -translate-y-1/2">
        <ValParticles pin="house" className="absolute inset-0" />
        <div className="holo-scan pointer-events-none absolute inset-0" aria-hidden />
      </div>

      {/* A gradient scrim under the type: the orb's own light would otherwise
          crawl into the wordmark's counters and mush it at small sizes. */}
      <div
        className="absolute inset-y-0 left-0 w-[70%]"
        style={{ background: "linear-gradient(90deg, #071320 52%, rgba(7,19,32,0.82) 78%, transparent 100%)" }}
        aria-hidden
      />

      {/* Corner brackets — the same language the HUD on the canvas speaks. */}
      {[
        "left-[30px] top-[30px] border-l-2 border-t-2",
        "right-[30px] top-[30px] border-r-2 border-t-2",
        "left-[30px] bottom-[30px] border-l-2 border-b-2",
        "right-[30px] bottom-[30px] border-r-2 border-b-2",
      ].map((cls) => (
        <span key={cls} className={`absolute h-[34px] w-[34px] border-gold/55 ${cls}`} aria-hidden />
      ))}

      <div className="relative z-10 w-[660px] pl-[64px]">
        <p className="label text-[14px] tracking-[0.26em] text-gold">{EVENT.series}</p>

        <h1 className="mt-4 display text-[116px] font-extrabold leading-[0.82] text-cream [font-variation-settings:'wdth'_114] [letter-spacing:-0.045em]">
          The
          <br />
          Equipped
          <br />
          Agent
        </h1>

        <div className="mt-6 flex items-center gap-4">
          <span className="block h-[5px] w-[64px] rounded-full bg-gold" />
          <p className="display whitespace-nowrap text-[29px] font-extrabold tracking-tight text-gold-bright">
            {eventShort()}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-x-2 gap-y-2">
          {PILLARS.map((p) => (
            <span
              key={p}
              className="label rounded-full border border-gold/45 px-[11px] py-[5px] text-[10px] tracking-[0.16em] text-gold-bright"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <p className="label absolute bottom-[34px] left-[64px] text-[11px] tracking-[0.28em] text-faint">
        The AGENT Connection™ · Charleston, SC
      </p>
    </div>
  );
}
