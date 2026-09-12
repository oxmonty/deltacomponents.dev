import type { PropDef } from "@/lib/docs/props-table";

export const buttonProps: PropDef[] = [
  { name: "variant", type: '"primary" | "secondary" | "tertiary" | "ghost"', default: '"primary"', description: "Visual style of the button." },
  { name: "size", type: '"sm" | "default" | "lg" | "icon-sm" | "icon" | "icon-lg" | "compact" | "icon-compact"', default: "from SizeProvider", description: "Step on the size ladder: 32px, 36px, 40px, with the `icon-*` squares to match. `compact` is the dense 28px control, and omitting the prop follows the site's size step (see the `--control-*` tokens in globals.css)." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a spinner and disables the button." },
  { name: "active", type: "boolean", default: "false", description: "Forces the pressed/held visual — e.g. while a dropdown or popover the button opened is showing." },
  { name: "leadingIcon", type: "IconComponent", description: "Icon displayed before the label." },
  { name: "trailingIcon", type: "IconComponent", description: "Icon displayed after the label." },
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto the child element instead of rendering a <button>." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
];
