"use client";

import { useEffect, useState } from "react";

/**
 * True below 768px — the sidebar's own default breakpoint, shared so the docs
 * chrome breaks where the components do.
 *
 * Used by ComponentPreview, which collapses a demo's source far sooner on a
 * phone: the frame is the whole screen there, so a handful of lines pushes the
 * demo it belongs to off the top.
 *
 * Starts false so the server and first client render agree; the media query
 * corrects it in an effect, exactly as the sidebar's own `useIsMobile` does.
 */
export function useNarrowFrame(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setNarrow(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return narrow;
}
