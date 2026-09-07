"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
  type SVGAttributes,
} from "react";
import { cn } from "@/registry/lib/utils";

// Shape outlines, one path each in a 24x24 viewBox. rosette/shield/hexagon
// reuse lucide's badge-check/shield/hexagon coordinates (ISC license), not a
// dependency — only the coordinates are reused. circle/squircle/seal/ribbon
// are hand-built. All seven were tuned and verified against real icon
// knockouts in the glyph lab before landing here.
const MASKS = {
  rosette:
    "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
  circle: "M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12Z",
  squircle:
    "M10 2H14A8 8 0 0 1 22 10V14A8 8 0 0 1 14 22H10A8 8 0 0 1 2 14V10A8 8 0 0 1 10 2Z",
  shield:
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  hexagon:
    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  seal: "M12.00 1.70 L14.91 4.98 L19.28 4.72 L19.02 9.09 L22.30 12.00 L19.02 14.91 L19.28 19.28 L14.91 19.02 L12.00 22.30 L9.09 19.02 L4.72 19.28 L4.98 14.91 L1.70 12.00 L4.98 9.09 L4.72 4.72 L9.09 4.98 Z",
  ribbon:
    "M18.5 8.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM8 13L11 13L7 22ZM13 13L16 13L17 22Z",
} as const;

export type GlyphMask = keyof typeof MASKS;

export interface GlyphProps extends SVGAttributes<SVGSVGElement> {
  /** Shape to cut the icon out of. */
  mask?: GlyphMask;
  /** The icon to knock out of the shape — any icon element (lucide,
   *  phosphor, a hand-rolled `<svg>`) that colors itself via `currentColor`. */
  children: ReactNode;
  /**
   * Scale of the icon relative to the shape's 24x24 box, applied about the
   * center. Icon libraries draw a path that fills its own viewBox, so at
   * `scale={1}` the icon swallows the shape instead of reading as a mark cut
   * out of it (a star eats a circle whole, a crown notches a squircle). 0.55
   * is where a typical full-bleed icon (lucide's `Check`, `Flame`, `Zap`)
   * reads as a hole rather than a second shape; tune per icon if it's
   * unusually thin, bold, or already small within its own box.
   */
  scale?: number;
  /** Accessible label. Omit to keep the badge decorative (aria-hidden) when
   *  it sits beside text that already announces "verified". */
  label?: string;
  className?: string;
}

/**
 * A shape (`mask`) with an arbitrary icon (`children`) cut out of it as a
 * genuine hole via an SVG mask, so whatever sits behind the badge (a photo,
 * a gradient) shows through instead of a painted icon seaming against it.
 * `className` both paints and sizes the shape: it fills with `currentColor`,
 * so a `text-*` utility colors it, and defaults to `size-5`, so `size-*` (or
 * `h-*`/`w-*`) resizes it the same way it would a lucide icon.
 */
export const Glyph = forwardRef<SVGSVGElement, GlyphProps>(
  (
    { mask = "rosette", children, scale = 0.55, label, className, ...props },
    ref
  ) => {
    // useId() can return characters like ":" (e.g. ":r0:"), which isn't a
    // legal SVG id in every engine.
    const maskId = `glyph-${useId().replace(/:/g, "")}`;
    const shapePath = MASKS[mask];

    // Icon components render their own <svg width height> — left alone,
    // those pixel dimensions win over the scale transform below in some
    // browsers instead of being scaled by it. Forcing them back to the
    // icon's native 24x24 box neutralises that without touching whatever
    // size the consumer's own element requested.
    const icon = isValidElement<SVGAttributes<SVGSVGElement>>(children)
      ? cloneElement(children as ReactElement<SVGAttributes<SVGSVGElement>>, {
          width: 24,
          height: 24,
          // Divided back out of the scale below. SVG scales stroke-width along
          // with the transform, so a stroked icon shrunk to fit also thins out
          // — at the 0.55 default a lucide icon's 2 lands at 1.1 and the mark
          // reads spidery rather than cut. Dividing keeps the rendered weight
          // constant however far the icon is inset. Harmless on a fill-based
          // icon, which ignores it.
          strokeWidth:
            (Number(
              (children as ReactElement<SVGAttributes<SVGSVGElement>>).props
                .strokeWidth
            ) || 2) / scale,
        })
      : children;

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        // Sizing is a class, not a prop, so Glyph behaves like any other icon.
        // The two spellings win differently: `size-4` displaces the default
        // through tailwind-merge, while `h-4 w-4` does not — tailwind-merge
        // treats those as a different group and leaves both classes on the
        // element, so it wins only because Tailwind emits `h-*`/`w-*` after
        // `size-*`. Both were measured; keep the default a `size-*` class so
        // that stays true.
        className={cn("size-5", className)}
        {...(label
          ? { role: "img" }
          : { "aria-hidden": true, role: undefined })}
        {...props}
      >
        {label && <title>{label}</title>}
        <mask id={maskId}>
          <path d={shapePath} fill="white" />
          {/* color: black makes any currentColor-based stroke or fill in the
              icon resolve to black, which is what becomes the hole — this is
              what lets both a stroke-based icon (lucide) and a fill-based one
              (phosphor) knock out without the caller choosing a mode.
              Scaling happens about the 24x24 center so the icon shrinks in
              place instead of drifting toward a corner. */}
          <g
            style={{ color: "black" }}
            transform={`translate(12 12) scale(${scale}) translate(-12 -12)`}
          >
            {icon}
          </g>
        </mask>
        <path d={shapePath} fill="currentColor" mask={`url(#${maskId})`} />
      </svg>
    );
  }
);

Glyph.displayName = "Glyph";
