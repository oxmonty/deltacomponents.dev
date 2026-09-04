"use client";

import { useEffect, useState } from "react";

/**
 * True below the sidebar's own 768px default breakpoint.
 *
 * For the site's *previews* of the Sidebar — the doc-page examples and the
 * home bento card. Those run inside bounded frames a few hundred pixels wide,
 * so the component's real mobile rule doesn't apply to them: turning into a
 * drawer, or keeping a 12rem rail beside an 83px sliver of main region, hides
 * the very thing the preview exists to show. Each one pins
 * `mobileBreakpoint={0}` to stay a rail and asks this instead, so the frame
 * can spend its width on the rail alone.
 *
 * Starts false so the server and first client render agree; the media query
 * corrects it in an effect, exactly as the component's own `useIsMobile` does.
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
