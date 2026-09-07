import type { PropDef } from "@/lib/docs/PropsTable";

export const tooltipProps: PropDef[] = [
  {
    name: "content",
    type: "ReactNode",
    description: "The content displayed inside the tooltip.",
  },
  {
    name: "children",
    type: "ReactElement",
    description: "The trigger element. Must accept a ref.",
  },
  {
    name: "side",
    type: '"top" | "right" | "bottom" | "left"',
    default: '"top"',
    description: "Preferred side of the trigger to render the tooltip.",
  },
  {
    name: "sideOffset",
    type: "number",
    default: "8",
    description: "Distance in pixels between the tooltip and the trigger.",
  },
  {
    name: "delayDuration",
    type: "number",
    default: "200",
    description: "Milliseconds to wait before showing the tooltip on hover.",
  },
  {
    name: "followCursor",
    type: '"x" | "y"',
    description: "Track the cursor along one axis while hovering the trigger; the other axis stays anchored by side. Used by the Sidebar rail.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the tooltip content container.",
  },
  {
    name: "contentClassName",
    type: "string",
    description: "Classes for the portalled content element — pass a z-index utility here to lift the whole tooltip above other fixed layers (defaults to z-50).",
  },
];
