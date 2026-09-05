/** One entry in a page's table of contents. */
export interface TocEntry {
  id: string;
  text: string;
  /** 2 for a section, 3 for a subsection. */
  depth: 2 | 3;
}

/** Slug for a section heading, matching how shadcn's docs build theirs: the
 *  text, spaces to dashes, apostrophes and question marks dropped, lowercased.
 *  Kept identical so `#custom-colors` style links behave the same here.
 *  Commas go too — no shipped heading has one, and a prose heading that does
 *  would otherwise carry it into the URL.
 *
 *  Lives in its own module, free of React, so the build-time TOC generator
 *  (scripts/build-toc.ts) can share it. If the two computed slugs differently,
 *  every link in the table of contents would miss its heading. */
export function headingId(text: string): string | undefined {
  return (
    text
      .trim()
      .replace(/\s+/g, "-")
      .replace(/['?,]/g, "")
      .toLowerCase() || undefined
  );
}
