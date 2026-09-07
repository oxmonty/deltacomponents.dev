"use client";

import { useEffect } from "react";
import { useThemeContext } from "@/lib/theme-context";

/**
 * Keeps `<meta name="theme-color">` on the resolved theme's background.
 *
 * Without it iOS Safari leaves its bottom address bar untinted and shows the
 * scrolled page through it — so with the mobile nav popover open, the site
 * content stayed visible in that strip while the panel covered everything
 * above it. shadcn's docs fix it with the same meta tag (their
 * `useMetaColor`, called from their mobile nav and mode toggle); mounted once
 * in the root layout instead, so the bar follows a theme change from
 * anywhere — the right panel's control as well as the header's toggle.
 *
 * The colours come in as a prop rather than living here: the root layout is a
 * server component, and a `"use client"` module's plain exports read as
 * `undefined` there.
 */
export function MetaThemeColor({
  colors,
}: {
  colors: { light: string; dark: string };
}) {
  const { resolvedTheme } = useThemeContext();

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", colors[resolvedTheme]);
  }, [colors, resolvedTheme]);

  return null;
}
