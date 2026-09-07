import type { PropDef } from "@/lib/docs/PropsTable";

export const codeBlockProps: PropDef[] = [
  { name: "code", type: "string", description: "The source to render. A fenced markdown block (```lang) is unwrapped, and its language wins over `language`." },
  { name: "language", type: "string", default: '"typescript"', description: "Prism grammar name. Common aliases (ts, js, sh, yml, py) resolve automatically." },
  { name: "filename", type: "string", description: "Shows a header bar with a file-type icon, the name, and the copy button. Without it, the copy button floats over the code." },
  { name: "showLineNumbers", type: "boolean", default: "true", description: "Renders a sticky line-number gutter that survives horizontal scroll." },
  { name: "expandable", type: "boolean", default: "false", description: "Clips the block to `collapsedHeight` behind a fade, with an Expand/Collapse toggle." },
  { name: "defaultExpanded", type: "boolean", default: "false", description: "Starts an expandable block open." },
  { name: "collapsedHeight", type: "string", default: '"12rem"', description: "Height of an expandable block while collapsed." },
  { name: "expandLabel", type: "string", default: '"Expand"', description: "Text on the affordance that opens a collapsed block; the docs previews pass \"View code\". Expanding is one-way — there is no collapse control, so a reader never re-opens what they just opened." },
  { name: "npm / yarn / pnpm / bun", type: "string", description: "Install commands. Supplying any renders the package-manager tab strip instead of a plain block." },
  { name: "defaultPackageManager", type: '"npm" | "yarn" | "pnpm" | "bun"', default: '"npm"', description: "Which tab opens selected." },
  { name: "theme", type: "PrismTheme", description: "Pins one palette regardless of the site theme." },
  { name: "adaptiveTheme", type: "{ light, dark }", description: "A palette pair chosen by the resolved site theme. Overrides `theme`." },
  { name: "useThemeBackground", type: "boolean", default: "true when a custom theme is set", description: "Paints the header and code surface from the Prism theme's own background instead of the page's card token. A supplied `theme` or `adaptiveTheme` turns this on by default, since a palette from elsewhere carries its own ground." },
  { name: "scrollbar", type: "boolean", default: "true", description: "Set false to hide the scrollbar while keeping the block scrollable." },
  { name: "textClassName", type: "string", default: '"text-[14px]"', description: "Font size for the code. A `text-*` class in `className` overrides it." },
];
