import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The type-scale role utilities (see the size ladder in globals.css) are font sizes, but
// tailwind-merge can't know that for custom classes — by default anything
// text-<word> it doesn't recognize is treated as a text *color*, so
// cn("text-body", "text-muted-foreground") would silently drop the size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // EVERY role in the ladder has to be listed. One that is missing is not
      // a styling nit: tailwind-merge classifies it as a colour, drops it
      // against the `text-foreground` beside it, and the element falls back to
      // preflight's `font-size: inherit` — 16px, which silently matches the
      // prose role and hides the bug until a heading looks like body copy.
      "font-size": [
        "text-display",
        "text-heading",
        "text-subheading",
        "text-title",
        "text-prose",
        "text-subtitle",
        "text-table",
        "text-body",
        "text-caption",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
