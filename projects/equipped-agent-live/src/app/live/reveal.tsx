"use client";

// MOTION THAT CANNOT HIDE THE PAGE.
//
// The rule every scroll-reveal gets wrong: it sets opacity to 0 in a
// stylesheet and then relies on JavaScript to put it back. When the script is
// slow, blocked, or the browser is Facebook's in-app one on a bad connection,
// the visitor gets a blank invite and leaves. So nothing is hidden until this
// component has mounted and proved it can un-hide things — the `reveal-on`
// class it adds to the document is the switch, and without it every section
// renders exactly as it would have with no animation at all.
//
// Reduced motion is honoured by the stylesheet rather than here: the class
// still goes on, the transition is just a fade with no travel.

import { useEffect } from "react";

export function Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    // Only now does anything become hidden, and only because we are certain we
    // are about to show it again.
    document.documentElement.classList.add("reveal-on");

    // Anything already on screen at load gets its entrance immediately, in
    // order, rather than waiting for a scroll that may never come on a short
    // viewport.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const group = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
          el.style.transitionDelay = `${Math.min(group, 5) * 70}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    for (const el of els) io.observe(el);

    // A hard backstop. If the observer never fires for any reason — an old
    // engine, a container that never scrolls — everything is visible within a
    // second and a half anyway. A missed animation is nothing; a blank page
    // that somebody paid to send traffic to is the whole budget.
    const backstop = window.setTimeout(() => {
      for (const el of els) el.classList.add("is-in");
    }, 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(backstop);
    };
  }, []);

  return null;
}
