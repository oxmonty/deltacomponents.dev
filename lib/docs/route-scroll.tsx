"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Lands a route change at the top of the page. Mount once, in the root
 * layout.
 *
 * Next's own scroll sets `documentElement.scrollTop = 0` and then — because
 * `scroll-behavior: smooth` makes that a request rather than a jump — checks
 * whether the new segment's first element is in view. It checks synchronously,
 * while the viewport is still where the reader left it, so the answer is
 * always no, and Next follows up with `scrollIntoView()` on that element. The
 * glide then ends at the element's own offset (112px, under the layout's top
 * padding) instead of at the document top.
 *
 * Re-issuing the scroll here retargets the animation Next just started rather
 * than adding a second one — a scrolling box runs one scroll animation at a
 * time, and this effect runs after layout-router's. One `scrollTo` per
 * navigation, no polling and no rAF loop of our own.
 */
export function RouteScrollTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The first load is already at the top — or is a deep link, below.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // A link into a section of another page is a deep link: Next scrolls the
    // heading into view and hauling the page to the top would undo it.
    if (window.location.hash) return;

    // An explicit `behavior` overrides the stylesheet, so the reduced-motion
    // rule in globals.css can't speak for this one — same check HashScroll
    // makes for fragment links.
    const behavior: ScrollBehavior = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
      ? "auto"
      : "smooth";

    const toTop = () => window.scrollTo({ top: 0, behavior });
    toTop();

    // An instant scroll is already there; only a glide can be taken away.
    if (behavior === "auto") return;

    // Safari drops an in-flight smooth scroll when the document height changes
    // under it — which is what the route commit does a frame or two after this
    // runs. Leaving a tall page for a shorter one, the clamp to the new maximum
    // cancels the glide before it moves a pixel, and the reader lands on the
    // new page still at the bottom (product-card → editor, at phone widths, did
    // exactly this). Nothing reports the cancellation, so the only way to know
    // is to watch: if the position stalls short of the top, ask again.
    //
    // A scroll of the reader's own ends it. They have taken over, and hauling
    // them back to the top would be the worse bug.
    const takeover = ["wheel", "touchstart", "keydown"] as const;
    let frame = 0;
    let elapsed = 0;
    let stalled = 0;
    let lastY = -1;

    const stop = () => {
      cancelAnimationFrame(frame);
      for (const event of takeover) window.removeEventListener(event, stop);
    };

    const watch = () => {
      const y = window.scrollY;
      // Landed, or out of budget — a second is far longer than the glide.
      if (y === 0 || elapsed++ > 60) return stop();
      if (y === lastY) {
        // Three still frames is a stall, not the easing's slow tail.
        if (++stalled >= 3) {
          toTop();
          stalled = 0;
        }
      } else {
        stalled = 0;
      }
      lastY = y;
      frame = requestAnimationFrame(watch);
    };

    for (const event of takeover)
      window.addEventListener(event, stop, { passive: true });
    frame = requestAnimationFrame(watch);

    return stop;
  }, [pathname]);

  return null;
}
