"use client";

import { Button } from "@/registry/ui/button";
import { useThemeContext } from "@/lib/theme-context";

/** shadcn's half-filled-circle mark. Theme-agnostic on purpose: resolvedTheme
 *  is always "light" on the server and the first client render (see
 *  theme-context.tsx), so a glyph that swapped per theme would flash wrong
 *  until the real theme settles.
 *
 *  The viewBox is cropped to the glyph rather than left at Tabler's 24, so the
 *  circle fills its 16px box exactly the way the GitHub mark beside it in the
 *  header does — at 0 0 24 24 the circle was 75% of the box and read a third
 *  smaller than its neighbour. 19.5 units is the 18-unit circle plus its
 *  1.5 stroke, and the stroke steps down from 2 to keep the same weight on
 *  screen at the smaller box. */
function ThemeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="2.25 2.25 19.5 19.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 3l0 18" />
      <path d="M12 9l4.65 -4.65" />
      <path d="M12 14.3l7.37 -7.37" />
      <path d="M12 19.6l8.85 -8.85" />
    </svg>
  );
}

/** Mobile header's theme flip — a single button, not a dropdown. Wired to
 *  this repo's own ThemeProvider rather than next-themes, which this repo
 *  doesn't use (a second provider would give two sources of truth). Clicking
 *  sets the explicit opposite of resolvedTheme, so a "system" starting point
 *  always resolves to a concrete choice on the first click. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeContext();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={() => setTheme(nextTheme)}
    >
      <ThemeIcon />
    </Button>
  );
}
