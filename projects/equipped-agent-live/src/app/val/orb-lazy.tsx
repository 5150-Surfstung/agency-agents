"use client";

// THE ORB, MOUNTED ONLY WHERE IT IS ACTUALLY VISIBLE.
//
// This page used to render the particle field with `hidden sm:block`, which
// is a CSS instruction and not a React one: below 640px the canvas was set to
// display:none while the component stayed mounted and its simulation loop kept
// running at full rate, forever, on the device least able to afford it. The
// page answered 200 with a clean console and then locked the main thread —
// which is exactly the kind of fault that never shows up in a status check.
//
// A media query in JavaScript decides whether it exists at all, and it
// unmounts again if the window is narrowed.

import { useEffect, useState } from "react";
import { ValParticles } from "@/app/stage/val-particles";

export function OrbLazy({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setShow(mq.matches && !calm.matches);
    sync();
    mq.addEventListener("change", sync);
    calm.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
    };
  }, []);

  if (!show) return null;
  return <ValParticles className={className} />;
}
