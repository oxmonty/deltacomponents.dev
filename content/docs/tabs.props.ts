import type { PropDef } from "@/lib/docs/props-table";

export const tabsProps: PropDef[] = [
  { name: "defaultValue", type: "string", description: "Value of the tab selected on first render, when uncontrolled." },
  { name: "value", type: "string", description: "Selected tab. Pass it with `onValueChange` to control the component." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value when a trigger is clicked." },
  { name: "variant", type: '"default" | "underline" | "ghost"', default: '"default"', description: "`default` fills a tray, `ghost` drops the tray, `underline` swaps the pill for a bar." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Drives the list height, trigger padding, and underline thickness together." },
  { name: "concentric", type: "boolean", default: "false", description: "Nest the radii so the list's corners sit concentric with the triggers'." },
  { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "`automatic` selects a tab as the arrow keys move focus onto it; `manual` only moves focus, and Enter/Space commits the selection." },
  { name: "indicatorClassName", type: "string", description: "Extra classes merged onto the active indicator — its background, or the underline bar's thickness (e.g. `h-0.5`)." },
];

export const listProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "TabsTrigger elements to render in the strip." },
  { name: "className", type: "string", description: "Extra classes merged onto the tab strip." },
];

export const triggerProps: PropDef[] = [
  { name: "value", type: "string", description: "Matches the `value` of the panel this trigger reveals." },
  { name: "icon", type: "ReactNode", description: "Glyph rendered before the label, sized to 16px." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the trigger and stops it taking pointer events." },
];

export const contentProps: PropDef[] = [
  { name: "value", type: "string", description: "Matches the `value` of the trigger that reveals this panel." },
  { name: "forceMount", type: "boolean", default: "false", description: "Render this panel from the first render instead of waiting for it to become active." },
];

export const fromArrayProps: PropDef[] = [
  { name: "tabs", type: "TabItem[]", description: "Tabs to render from data instead of JSX; each item's `id` becomes both the trigger and panel value." },
  { name: "defaultValue", type: "string", description: "Value of the tab selected on first render, when uncontrolled." },
  { name: "value", type: "string", description: "Selected tab. Pass it with `onValueChange` to control the component." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value when a trigger is clicked." },
  { name: "variant", type: '"default" | "underline" | "ghost"', default: '"default"', description: "`default` fills a tray, `ghost` drops the tray, `underline` swaps the pill for a bar." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Drives the list height, trigger padding, and underline thickness together." },
  { name: "listClassName", type: "string", description: "Extra classes on the tab strip." },
  { name: "triggerClassName", type: "string", description: "Extra classes on every trigger." },
  { name: "contentClassName", type: "string", description: "Extra classes on every panel." },
  { name: "children", type: "(tab: TabItem) => ReactNode", description: "Renders each tab's panel content; omit to render the triggers with panels supplied separately." },
];
