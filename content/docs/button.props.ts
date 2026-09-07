import type { PropDef } from "@/lib/docs/PropsTable";

export const buttonProps: PropDef[] = [
  { name: "variant", type: '"primary" | "secondary" | "tertiary" | "ghost"', default: '"primary"', description: "Visual style of the button." },
  { name: "size", type: '"default" | "compact" | "icon" | "icon-compact"', default: "from SizeProvider", description: "Step on the size ladder (36px default, 28px compact — see the size ladder in globals.css). Legacy sm/md/lg values resolve as aliases." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a spinner and disables the button." },
  { name: "active", type: "boolean", default: "false", description: "Forces the pressed/held visual — e.g. while a dropdown or popover the button opened is showing." },
  { name: "leadingIcon", type: "IconComponent", description: "Icon displayed before the label." },
  { name: "trailingIcon", type: "IconComponent", description: "Icon displayed after the label." },
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto the child element instead of rendering a <button>." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
];
