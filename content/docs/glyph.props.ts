import type { PropDef } from "@/lib/docs/PropsTable";

export const glyphProps: PropDef[] = [
  {
    name: "mask",
    type: '"rosette" | "circle" | "squircle" | "shield" | "hexagon" | "seal" | "ribbon"',
    default: '"rosette"',
    description: "Shape to cut the icon out of.",
  },
  {
    name: "children",
    type: "ReactNode",
    description:
      "The icon to knock out of the shape — any icon element (lucide, phosphor, a hand-rolled <svg>) that colors itself via currentColor.",
  },
  {
    name: "scale",
    type: "number",
    default: "0.55",
    description:
      "Scale of the icon relative to the shape's 24x24 box, applied about the center. An icon path fills its own viewBox by design, so at scale 1 it swallows the shape instead of reading as a mark cut out of it. Tune per icon if it's unusually thin, bold, or already small within its own box.",
  },
  {
    name: "label",
    type: "string",
    description: 'Accessible label. Adds role="img" and an <svg><title>; omit to keep the badge decorative (aria-hidden) beside text that already says "verified".',
  },
  {
    name: "className",
    type: "string",
    default: '"size-5"',
    description:
      'Additional classes applied to the svg element. Paints the shape (fill="currentColor") — pass a text-* utility to color it — and sizes it — pass size-* (or h-*/w-*) the same way you would a lucide icon.',
  },
];
