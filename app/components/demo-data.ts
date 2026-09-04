/** Shared demo content for the showcase previews — structure and styling
 *  live in `bento-previews.tsx`, copy lives here. */

export const BUTTON_ITEMS = [
  { label: "Primary", variant: "primary" },
  { label: "Secondary", variant: "secondary" },
  { label: "Tertiary", variant: "tertiary" },
  { label: "Ghost", variant: "ghost" },
] as const;

export const SWITCH_ITEMS = [
  { id: "notifications", label: "Notifications", initial: true },
  { id: "sound", label: "Sound effects", initial: false },
] as const;

export const TOOLTIP_COPY = {
  trigger: "Hover me",
  content: "Copy to clipboard",
} as const;
