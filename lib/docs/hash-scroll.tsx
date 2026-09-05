"use client";

import { useEffect } from "react";

/** Glide to `id`, parking it clear of the viewport edge by whatever
 *  `scroll-margin-top` the target carries. Returns false if nothing matched,
 *  so the caller can leave the click to the browser. */
function scrollToId(id: string, behavior: ScrollBehavior): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY - margin,
    behavior,
  });
  return true;
}

/**
 * Site-wide smooth scrolling for fragment links. Mount once, in the root
 * layout.
 *
 * The page content sits inside a clipped ancestor, so the browser's own
 * fragment jump — and `scrollIntoView` with it — resolves to that container
 * rather than the viewport and ends up moving nothing. `scroll-behavior` in
 * globals.css can't help with a scroll that never happens. This scrolls the
 * viewport explicitly instead, from one delegated listener, so any page only
 * has to render `<a href="#some-id">` and gets the behaviour for free.
 */
export function HashScroll() {
  useEffect(() => {
    const behavior = (): ScrollBehavior =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      // Modified clicks open a new tab or window — leave them alone.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (!link || link.target === "_blank") return;

      // Only same-page fragments; a bare "#" is a placeholder, not a target.
      const href = link.getAttribute("href");
      if (!href?.startsWith("#") || href.length < 2) return;

      const id = decodeURIComponent(href.slice(1));
      if (!scrollToId(id, behavior())) return;

      event.preventDefault();
      window.history.pushState(null, "", `#${id}`);
    };

    document.addEventListener("click", onClick);

    // Landing on a URL that already carries a hash hits the same wall, and the
    // heading may not exist until hydration has run — hence the frame's wait.
    // No animation for this one: the reader never saw the top of the page.
    const initial = decodeURIComponent(window.location.hash.slice(1));
    const frame = initial
      ? requestAnimationFrame(() => scrollToId(initial, "auto"))
      : 0;

    return () => {
      document.removeEventListener("click", onClick);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
