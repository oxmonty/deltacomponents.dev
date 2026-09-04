export interface ComponentEntry {
  slug: string;
  /** The exported React component's identifier, in PascalCase — what a reader
   *  types after `import {`. UI never prints this directly; it prints
   *  `labelOf(entry)`, which spaces it out. */
  name: string;
  /** Overrides the derived label when splitting on case gets it wrong —
   *  a name with a deliberate compound ("GitHub"), or one whose spaced form
   *  reads worse than the original. */
  label?: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
  /** Tailwind bg class overriding the default blue `isNew` dot in the sidebar. */
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
}

/** "CodeBlock" → "Code Block", "AskUserQuestions" → "Ask User Questions",
 *  "APIKey" → "API Key". Two passes: the first splits a lower/digit → upper
 *  boundary, the second splits the tail of an acronym run off the word that
 *  follows it, so "APIKey" doesn't come out as "A P I Key". A single-word name
 *  is returned untouched, so this is safe to apply to every label. */
export function toLabel(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

/** The human-readable name for an entry — every piece of chrome that prints a
 *  component name (sidebar, showcase card, prev/next nav, doc title) goes
 *  through here, so a new PascalCase entry spaces itself with no extra work. */
export function labelOf(entry: Pick<ComponentEntry, "name" | "label">): string {
  return entry.label ?? toLabel(entry.name);
}

export const componentList: ComponentEntry[] = [
  { slug: "code-block", name: "CodeBlock", description: "Syntax-highlighted code with a copy button, a filename bar, and a package-manager tab strip.", isNew: true, gridSize: "large" },
  { slug: "product-card", name: "ProductCard", description: "Compound card for commerce rows — image well, overlaid badge, and a title/subtitle/metric footer.", isNew: true, gridSize: "large" },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" },
  { slug: "tooltip", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small" },
];

/** Prev/next navigation order for doc pages. Used by DocPage's arrow nav.
 *  Keep in sync with the sidebar order in `app/components/sidebar.tsx`. */
export const docOrder: Array<{ slug: string; name: string }> = componentList.map((c) => ({
  slug: c.slug,
  name: labelOf(c),
}));
