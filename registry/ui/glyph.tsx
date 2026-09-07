"use client";

import { forwardRef, useId, type SVGAttributes } from "react";
import { cn } from "@/registry/lib/utils";

// Rosette and check outlines are lucide's badge-check paths (ISC license),
// not a dependency — only the coordinates are reused, in a 24x24 viewBox.
const ROSETTE_PATH =
  "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z";
const CHECK_PATH = "m9 12 2 2 4-4";

export interface GlyphProps extends SVGAttributes<SVGSVGElement> {
  /** Fill color of the rosette. */
  color?: string;
  /** Size in pixels, applied to both width and height. */
  size?: number;
  /** Accessible label. Omit to keep the badge decorative (aria-hidden) when
   *  it sits beside text that already announces "verified". */
  label?: string;
  className?: string;
}

/**
 * The Twitter/X-style verified checkmark: a rosette filled with `color`, with
 * the check cut out as a genuine hole via an SVG mask, so whatever sits
 * behind the badge (a photo, a gradient) shows through instead of a painted
 * checkmark seaming against it.
 *
 * The name is broader than the behaviour on purpose: the shape and the glyph
 * are fixed for now, but this is meant to grow into a mask-plus-icon
 * primitive — an arbitrary outline with an arbitrary glyph knocked out of it.
 * Generalising it needs more than another two props. A glyph drawn at icon
 * scale swallows the shape it sits in, so each one needs its own scale, and
 * then its own choice of stroke versus fill (a star wants a solid hole; an
 * open path like this check can only be stroked) and a nudge per shape, since
 * a shield's usable interior sits higher than a circle's. Worth doing against
 * a second real case, not ahead of one.
 */
export const Glyph = forwardRef<SVGSVGElement, GlyphProps>(
  ({ color = "#1d9bf0", size = 20, label, className, ...props }, ref) => {
    // useId() can return characters like ":" (e.g. ":r0:"), which isn't a
    // legal SVG id in every engine.
    const maskId = `glyph-${useId().replace(/:/g, "")}`;

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={cn(className)}
        {...(label
          ? { role: "img" }
          : { "aria-hidden": true, role: undefined })}
        {...props}
      >
        {label && <title>{label}</title>}
        <mask id={maskId}>
          <path d={ROSETTE_PATH} fill="white" />
          <path
            d={CHECK_PATH}
            stroke="black"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
        <path d={ROSETTE_PATH} fill={color} mask={`url(#${maskId})`} />
      </svg>
    );
  }
);

Glyph.displayName = "Glyph";
