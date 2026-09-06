/** Shared demo content for the showcase previews — structure and styling
 *  live in `bento-previews.tsx`, copy lives here. */

export const BUTTON_ITEMS = [
  { label: "Primary", variant: "primary" },
  { label: "Secondary", variant: "secondary" },
  { label: "Tertiary", variant: "tertiary" },
  { label: "Ghost", variant: "ghost" },
] as const;

export const TOOLTIP_COPY = {
  trigger: "Hover me",
  content: "Copy to clipboard",
} as const;

export const TABS_ITEMS = [
  { value: "published", label: "Published (2)", copy: "\"Q3 roadmap\" and \"Why we rewrote onboarding\" are live." },
  { value: "scheduled", label: "Scheduled", copy: "\"Migrating to Postgres\" goes out Thursday at 9am." },
  { value: "draft", label: "Draft (0)", copy: "Nothing here yet — start writing to see it in this tab." },
] as const;
