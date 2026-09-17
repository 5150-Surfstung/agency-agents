import { ValAir } from "@/app/stage/val-air";
import { ValParticles } from "@/app/stage/val-particles";
import { eventShort } from "@/lib/event";

// THE SHARE CARD, as a real page so it can be rendered and saved as a PNG.
//
// Not generated at request time: an OG image that depends on a runtime font
// fetch is an OG image that eventually shows up blank in somebody's feed, and
// the feed is the one place you never get a second look. This renders at
// exactly 1200×630 with the real typeface and the real orb, gets screenshotted
// into public/og.png, and ships as a file.
//
// It is deliberately almost wordless. A name, a date, and a machine doing
// something nobody can identify at a glance is what stops a thumb; a paragraph
// is what makes a post look like an ad. The orb is sized in pixels here rather
// than reusing the page's hero, because the hero is measured in viewport units
// and a 630px-tall card is not a viewport.
export const metadata = { robots: { index: false } };

export default function OgCard() {
  return (
    <div
      className="stage relative isolate flex items-center overflow-hidden bg-sheet"
      style={{ width: 1200, height: 630 }}
    >
      <ValAir className="air-mask pointer-events-none absolute inset-0 -z-10" />

      {/* The orb: a square that fits the card's height, sitting off the right
          edge so it reads as bigger than the frame. */}
      <div className="absolute -right-[70px] top-1/2 h-[600px] w-[600px] -translate-y-1/2">
        <ValParticles className="absolute inset-0" />
        <div className="holo-scan pointer-events-none absolute inset-0" aria-hidden />
      </div>

      <div className="relative z-10 w-[620px] pl-[64px]">
        <p className="label text-[15px] tracking-[0.3em] text-gold">
          The AGENT Connection™ · Charleston
        </p>
        <h1 className="mt-4 display text-[112px] font-extrabold leading-[0.84] text-cream [font-variation-settings:'wdth'_112] [letter-spacing:-0.042em]">
          The
          <br />
          Equipped
          <br />
          Agent
        </h1>
        <span className="mt-6 block h-[5px] w-[168px] rounded-full bg-gold" />
        <p className="mt-5 display whitespace-nowrap text-[28px] font-extrabold tracking-tight text-gold-bright">
          {eventShort()}
        </p>
      </div>
    </div>
  );
}
