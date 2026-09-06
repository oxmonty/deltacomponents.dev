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
  { slug: "code", name: "Code", description: "Syntax-highlighted code with a copy button, a filename bar, and a package-manager tab strip.", isNew: true, gridSize: "large" },
  { slug: "product-card", name: "ProductCard", description: "Compound card for commerce rows — image well, overlaid badge, and a title/subtitle/metric footer.", isNew: true, gridSize: "large" },
  { slug: "tabs", name: "Tabs", description: "Tab navigation with underline, background, and ghost variants, and an indicator that follows the shape system.", isNew: true, gridSize: "medium" },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" },
  { slug: "tooltip", name: "Tooltip", description: "Floating tooltip with configurable placement, a follow-cursor mode, and rich content support.", gridSize: "small" },
];

export interface PageLink {
  href: string;
  name: string;
}

/** The standalone pages in the sidebar's Sections group, in the order they
 *  appear there. */
export const sectionList: PageLink[] = [
  { href: "/", name: "Showcase" },
  { href: "/docs", name: "Introduction" },
  { href: "/docs/contributing", name: "Contributing" },
];

/** Every page in the sidebar, in reading order: the sections, then the
 *  components. One list drives the header arrows, the bottom pager and the
 *  left/right keyboard shortcuts, so the three can't disagree about what comes
 *  next. */
export const pageOrder: PageLink[] = [
  ...sectionList,
  ...componentList.map((c) => ({ href: `/docs/${c.slug}`, name: labelOf(c) })),
];

/** The pages either side of `href`, or null at the ends. */
export function neighbours(href: string): { prev: PageLink | null; next: PageLink | null } {
  const i = pageOrder.findIndex((p) => p.href === href);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? pageOrder[i - 1] : null,
    next: i < pageOrder.length - 1 ? pageOrder[i + 1] : null,
  };
}
