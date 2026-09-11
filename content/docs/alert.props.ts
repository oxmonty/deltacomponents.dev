import type { PropDef } from "@/lib/docs/props-table";

export const alertProps: PropDef[] = [
  {
    name: "type",
    type: '"note" | "tip" | "info" | "warning" | "danger" | "success" | "caution"',
    default: '"note"',
    description: "Picks the pastel fill, the only cue to severity.",
  },
  {
    name: "title",
    type: "ReactNode",
    description: "Medium-weight heading above the body. Omit for a body-only alert.",
  },
  {
    name: "children",
    type: "ReactNode",
    description: "The body. Nested elements inherit the alert's ink and size.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the root.",
  },
];
