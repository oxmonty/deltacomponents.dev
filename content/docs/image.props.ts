import type { PropDef } from "@/lib/docs/props-table";

export const imageProps: PropDef[] = [
  {
    name: "src",
    type: "string",
    description: "The image URL.",
  },
  {
    name: "alt",
    type: "string",
    description: "Alt text, required. Pass \"\" for a decorative image.",
  },
  {
    name: "caption",
    type: "React.ReactNode",
    description: "Text under the image, centred and muted.",
  },
  {
    name: "zoomable",
    type: "boolean",
    default: "true",
    description: "Wraps the image in a button that opens it in a dialog sized from its own proportions.",
  },
  {
    name: "bleed",
    type: 'boolean | "always"',
    default: "false",
    description: 'Runs a landscape image to the screen edge: true below md, "always" at every width.',
  },
  {
    name: "width",
    type: "number",
    description: "Paired with height, reserves the image's space and tells the component its proportions before the file arrives.",
  },
  {
    name: "height",
    type: "number",
    description: "Paired with width.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the <img>.",
  },
  {
    name: "figureClassName",
    type: "string",
    description: "Additional classes applied to the <figure>.",
  },
  {
    name: "onZoomChange",
    type: "(open: boolean) => void",
    description: "Called when the zoomed dialog opens or closes.",
  },
  {
    name: "children",
    type: "ReactNode",
    description: "Rendered inside the enlarged view, over the picture — `ImageClose` is the one that ships — except an `ImageCaption`, which goes under the picture. Ignored when `zoomable` is false.",
  },
];

export const imageCaptionProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "The caption text.",
  },
  {
    name: "className",
    type: "string",
    description: "Merged onto the <figcaption>: muted, centred, small by default.",
  },
];

export const imageCloseProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "The control itself, usually a `Button`. It needs no handler, because any click inside the enlarged view closes it, and the registry's `Button` comes out pill-shaped here.",
  },
  {
    name: "className",
    type: "string",
    description: "Merged onto the wrapper. It is pinned to the top right corner of the screen, clear of a notch; override the position or the `--radius-button` it sets from here.",
  },
];
