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
  isNew?: boolean;
  isUpdated?: boolean;
  /** Tailwind bg class overriding the default blue `isNew` dot in the sidebar. */
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
  /** Visible while developing, absent from a production build. */
  draft?: boolean;
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
  { slug: "code", name: "Code", isNew: true, gridSize: "large" },
  { slug: "product-card", name: "ProductCard", isNew: true, gridSize: "large" },
  { slug: "tabs", name: "Tabs", isNew: true, gridSize: "medium" },
  { slug: "button", name: "Button", gridSize: "small" },
  { slug: "tooltip", name: "Tooltip", gridSize: "small" },
  { slug: "glyph", name: "Glyph", isNew: true, gridSize: "small", draft: true },
  { slug: "editor", name: "Editor", gridSize: "large", draft: true },
  { slug: "mp3-player", name: "MP3Player", gridSize: "medium", draft: true },
  { slug: "alert", name: "Alert", gridSize: "small", draft: true },
];

/** Drafts survive `next dev` so they can be worked on, and disappear from
 *  `next build` so nothing half-finished reaches production. */
export const visibleComponents = componentList.filter(
  (c) => !c.draft || process.env.NODE_ENV !== "production",
);

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
  ...visibleComponents.map((c) => ({ href: `/docs/${c.slug}`, name: labelOf(c) })),
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
