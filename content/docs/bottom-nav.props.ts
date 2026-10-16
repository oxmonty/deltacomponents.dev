import type { PropDef } from "@/lib/docs/props-table";

export const bottomNavProps: PropDef[] = [
  { name: "value", type: "string", description: "The active item's value. The nav never guesses this from the URL, hand it the router's current path (or any state)." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the tapped item's value, link or button, unless it is already active (that tap scrolls to the top instead)." },
  { name: "labels", type: "boolean", default: "true", description: "Caption under each icon. Off gives the icon-only bar." },
  { name: "gradient", type: "boolean", default: "true", description: "Fade the page into the background colour through the bar's top rather than ending it at a hard edge." },
  { name: "fade", type: "number", default: "0.5", description: "How far the bar gives way to the page, 0 to 1. 0 is a solid bar; 0.5 turns solid at the icons' bottom edge, so the page shows through behind them; past that the bar itself thins out, until at 1 nothing is drawn but the items. It never reaches above the bar." },
  { name: "linkComponent", type: "React.ElementType", default: '"a"', description: "What an item with an `href` renders as. A Next app passes `Link` here once to keep client-side routing and prefetching." },
  { name: "className", type: "string", description: "Merged onto the nav. No breakpoint of its own, a layout's own `md:hidden` decides where it hides." },
];

export const bottomNavItemProps: PropDef[] = [
  { name: "value", type: "string", description: "Matches the nav's `value` to mark this item active." },
  { name: "href", type: "string", description: "With it the item renders as `linkComponent`; without it as a button, for an item that opens something rather than going somewhere." },
  { name: "icon", type: "ReactNode", description: "Glyph rendered above the label, sized to 24px." },
  { name: "onClick", type: "(event: MouseEvent) => void", description: "Runs before the item's own selection handler, call `event.preventDefault()` to stop it selecting." },
  { name: "children", type: "ReactNode", description: "The label: text, or a `BottomNavLabel` to restyle it. Also read by screen readers when `labels` is off." },
  { name: "className", type: "string", description: "Merged onto the item's link or button element." },
];

export const bottomNavLabelProps: PropDef[] = [
  { name: "className", type: "string", description: "Merged over the caption's own classes, so its spacing or size can change for one item." },
  { name: "children", type: "ReactNode", description: "The caption text." },
];
