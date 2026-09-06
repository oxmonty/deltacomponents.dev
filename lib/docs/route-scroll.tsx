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

    window.scrollTo({
      top: 0,
      // An explicit `behavior` overrides the stylesheet, so the reduced-motion
      // rule in globals.css can't speak for this one — same check HashScroll
      // makes for fragment links.
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [pathname]);

  return null;
}
