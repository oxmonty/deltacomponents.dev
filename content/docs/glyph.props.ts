import type { PropDef } from "@/lib/docs/PropsTable";

export const glyphProps: PropDef[] = [
  {
    name: "color",
    type: "string",
    default: '"#1d9bf0"',
    description: "Fill color of the rosette.",
  },
  {
    name: "size",
    type: "number",
    default: "20",
    description: "Size in pixels, applied to both width and height.",
  },
  {
    name: "label",
    type: "string",
    description: 'Accessible label. Adds role="img" and an <svg><title>; omit to keep the badge decorative (aria-hidden) beside text that already says "verified".',
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the svg element.",
  },
];
