"use client";

import { forwardRef, useId, type SVGAttributes } from "react";
import { cn } from "@/registry/lib/utils";

// Badge outlines, one line each. rosette/shield/hexagon reuse lucide's
// badge-check/shield/hexagon coordinates (ISC license) the same way the
// shipped Glyph does; circle/squircle/seal/ribbon are hand-built for this lab
// (a superellipse-ish rounded square, an 8-point starburst, and a medallion
// with two flared tails).
const SHAPES: Record<string, string> = {
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
};

// Interior glyphs, one line each. Coordinates lifted from lucide-react's icon
// nodes (ISC license) — see credit above — with a multi-part icon's paths
// concatenated into one `d` so a single stroke/fill mode covers the whole
// glyph. No default scale or mode is stored here on purpose: which pairings
// need which is exactly the tuning burden this lab exists to expose (see
// Glyph's JSDoc), so scale/mode/nudge always come from the call site.
const ICONS: Record<string, string> = {
  check: "m9 12 2 2 4-4",
  star: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
  bolt: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
  crown:
    "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
  flame:
    "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",
  pen: "M13 21h8M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
  x: "M18 6 6 18M6 6l12 12",
  exclamation: "M12 8v4M12 16h.01",
  clock: "M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12ZM12 6v6l4 2",
  ellipsis:
    "M6.4 12A1.4 1.4 0 1 1 3.6 12A1.4 1.4 0 1 1 6.4 12ZM13.4 12A1.4 1.4 0 1 1 10.6 12A1.4 1.4 0 1 1 13.4 12ZM20.4 12A1.4 1.4 0 1 1 17.6 12A1.4 1.4 0 1 1 20.4 12Z",
  lock: "M5 11H19A2 2 0 0 1 21 13V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V13A2 2 0 0 1 5 11ZM7 11V7a5 5 0 0 1 10 0v4",
  bot: "M6 8H18A2 2 0 0 1 20 10V18A2 2 0 0 1 18 20H6A2 2 0 0 1 4 18V10A2 2 0 0 1 6 8ZM12 8V4H8M2 14h2M20 14h2M15 13v2M9 13v2",
};

export type LabShape = keyof typeof SHAPES;
export type LabIcon = keyof typeof ICONS;

export interface LabGlyphProps extends SVGAttributes<SVGSVGElement> {
  shape: LabShape;
  /** Interior glyph cut from the shape. Mutually exclusive with `text` —
   *  `text` wins if both are given. */
  icon?: LabIcon;
  /** 1-3 characters cut out instead of an icon path. */
  text?: string;
  /** Fill color of the shape. */
  color?: string;
  /** Size in pixels, applied to both width and height. */
  size?: number;
  /** Icon/text scale, tuned per pairing — see Glyph's JSDoc on why this
   *  can't be a fixed constant: an icon drawn at its native 24x24 extent
   *  swallows the shape it sits inside. */
  scale?: number;
  /** Stroke draws an open path (a check, a lock's outline); fill draws a
   *  closed silhouette (a star, a flame). Ignored for `text`, which is
   *  always filled. */
  mode?: "stroke" | "fill";
  /** Interior nudge in viewBox units, applied after scaling. A shield's
   *  usable interior sits higher than a circle's, so the same icon needs a
   *  different nudge per shape. */
  nudgeX?: number;
  nudgeY?: number;
  label?: string;
  className?: string;
}

export const LabGlyph = forwardRef<SVGSVGElement, LabGlyphProps>(
  (
    {
      shape,
      icon,
      text,
      color = "#1d9bf0",
      size = 20,
      scale = 1,
      mode = "stroke",
      nudgeX = 0,
      nudgeY = 0,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const maskId = `lab-glyph-${useId().replace(/:/g, "")}`;
    const shapePath = SHAPES[shape];
    const iconPath = icon ? ICONS[icon] : undefined;
    // Scale around the 24x24 center, then nudge in outer (unscaled) units so
    // a tuning pass reads as "shift down 0.4" regardless of scale.
    const transform = `translate(${nudgeX} ${nudgeY}) translate(12 12) scale(${scale}) translate(-12 -12)`;

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
          <path d={shapePath} fill="white" />
          <g transform={transform}>
            {text ? (
              <text
                x={12}
                y={12}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
                fontWeight={800}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fill="black"
              >
                {text}
              </text>
            ) : iconPath ? (
              <path
                d={iconPath}
                fill={mode === "fill" ? "black" : "none"}
                stroke={mode === "stroke" ? "black" : "none"}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </g>
        </mask>
        <path d={shapePath} fill={color} mask={`url(#${maskId})`} />
      </svg>
    );
  }
);

LabGlyph.displayName = "LabGlyph";
