"use client";

// The top of the invite: the orb, then what this is, then where and when.
//
// The desk used to live here — paste what a client texted you, get a draft
// back. It was the best demo on the page and it still came out, because four
// things to try is not a page, it is a menu, and a menu is how somebody
// decides later. There is one thing to do on this page now, and it is take a
// seat. The demo moved into the hour itself, which is where it lands harder
// anyway.

import { ValReel } from "./val-reel";
import { LEARNS } from "./learns";

export function Top({ head, details }: { head: React.ReactNode; details: React.ReactNode }) {
  return (
    <>
      <ValReel facts={LEARNS} />
      {head}
      {details}
    </>
  );
}
