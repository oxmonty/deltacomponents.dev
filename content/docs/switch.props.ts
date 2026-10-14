import type { PropDef } from "@/lib/docs/props-table";

export const switchProps: PropDef[] = [
  { name: "checked", type: "boolean", description: "Whether the switch is on. Pass it with `onCheckedChange` to control the component." },
  { name: "defaultChecked", type: "boolean", default: "false", description: "Whether the switch is on when first rendered, when uncontrolled." },
  { name: "onCheckedChange", type: "(checked: boolean, eventDetails) => void", description: "Called with the new state when the switch is toggled." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the switch and stops it taking pointer events." },
  { name: "name", type: "string", description: "Name submitted with the switch's form, when it has one." },
  { name: "className", type: "string", description: "Merged onto the track." },
];
