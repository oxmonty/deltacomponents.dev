"use client";

import { type ReactNode } from "react";
import { cn } from "@/registry/lib/utils";
import { fontWeights } from "@/registry/lib/font-weight";
import { componentList, labelOf, neighbours, toLabel } from "@/lib/docs/components";
import { DocPager } from "@/lib/docs/DocPager";
import { DocHeader } from "@/lib/docs/DocHeader";
import { headingId } from "@/lib/docs/heading-id";

interface DocPageProps {
  /** Optional: with a `slug`, the heading comes from that component's entry in
   *  `componentList`, so the name is written once and spaced automatically.
   *  Pass this only for a page that has no entry. */
  title?: string;
  /** The standfirst under the title. A component page passes its .mdx
   *  frontmatter through; a section page passes its own. */
  description?: ReactNode;
  /** Slug used for prev/next navigation (must match a `componentList` entry). */
  slug?: string;
  children: ReactNode;
}

export function DocPage({
  title,
  description,
  slug,
  children,
}: DocPageProps) {
  const entry = slug ? componentList.find((c) => c.slug === slug) : undefined;
  const heading = title ? toLabel(title) : entry ? labelOf(entry) : "";
  const blurb = description ?? "";

  const { prev, next } = neighbours(slug ? `/docs/${slug}` : "");

  return (
    <div className="flex flex-col gap-8 px-6">
      <DocHeader title={heading} description={blurb} prev={prev} next={next} copyable />

      {/* The body writes its own Installation section — it is content, and a
          page that injected it had to teach the contents generator about a
          heading that appeared in no file. */}
      {children}

      {slug && <DocPager prev={prev} next={next} />}
    </div>
  );
}

/** Wraps a heading so the whole thing is a link to itself, with a `#` that
 *  fades in on hover — and on keyboard focus too, which shadcn's version
 *  leaves out: without it the affordance is invisible to anyone tabbing.
 *
 *  A plain fragment link: the site-wide HashScroll listener (mounted in the
 *  root layout) is what actually moves the viewport. */
function HeadingAnchor({ id, children }: { id?: string; children: ReactNode }) {
  if (!id) return <>{children}</>;

  return (
    <a href={`#${id}`} className="group no-underline">
      <span className="underline-offset-4 group-hover:underline">{children}</span>
      <span
        aria-hidden="true"
        className="ml-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        #
      </span>
    </a>
  );
}

interface AnchoredHeadingProps {
  /** Heading level. The site's content pages nest h3s under h2s. */
  as?: "h2" | "h3";
  /** Overrides the slug derived from the text — for a heading whose text would
   *  collide with another on the page, or whose link is already published. */
  id?: string;
  className?: string;
  /** Plain text: it is the anchor's slug as well as what the heading reads. */
  children: string;
}

/** A heading that links to itself. `scroll-mt` keeps it clear of the viewport
 *  edge when someone lands on it from a `#link`. */
export function AnchoredHeading({
  as: Tag = "h2",
  id,
  className,
  children,
}: AnchoredHeadingProps) {
  const anchorId = id ?? headingId(children);

  return (
    <Tag
      id={anchorId}
      className={cn("scroll-mt-20", className)}
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      <HeadingAnchor id={anchorId}>{children}</HeadingAnchor>
    </Tag>
  );
}

/** A body paragraph on a doc page — the one treatment for running text,
 *  wherever it appears.
 *
 *  This is the job an `mdx-components.tsx` map would do if these pages were
 *  MDX; they are plain TSX, so the role lives here beside the heading ones
 *  instead of being spelled out in class strings per page. It already drifted
 *  once: the introduction set the type on a wrapper `<section>` while the API
 *  reference's blurbs carried their own muted, tight-leading version, so the
 *  same kind of sentence read two different ways on two pages.
 *
 *  Not the same thing as DocHeader's description, which is a standfirst under
 *  the title and stays muted on purpose. */
export function DocProse({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("text-prose text-foreground/90 leading-relaxed text-pretty", className)}>
      {children}
    </p>
  );
}

interface DocSectionProps {
  title: string;
  /** Overrides the slug derived from `title` — for a heading whose text would
   *  collide with another on the page, or whose link is already published. */
  id?: string;
  children: ReactNode;
}

export function DocSection({ title, id, children }: DocSectionProps) {
  const anchorId = id ?? headingId(title);

  // Heading rhythm follows www's: 32px above, 12px below. More space over a
  // heading than under it is what makes it read as belonging to the section it
  // opens rather than as a caption for whatever sat above.
  return (
    <div className="flex flex-col gap-4 pt-8">
      {/* py on the heading itself, not just space on the wrapper: `leading-none`
          crops the line box to the glyphs, so the text sat tight against what
          came before and after it. The padding also grows the anchor's hit
          area. Net rhythm is 40px above the text and 20px below — more room
          over a heading than under it, so it reads as opening the section
          rather than captioning the one above.
          scroll-mt keeps it clear of the viewport edge when someone lands on
          it from a #link. */}
      <AnchoredHeading
        id={anchorId}
        className="-mb-1 py-2 text-heading text-foreground leading-none"
      >
        {title}
      </AnchoredHeading>
      {children}
    </div>
  );
}

interface DocSubSectionProps {
  title: string;
  /** Overrides the slug derived from `title` — for a heading whose text would
   *  collide with another on the page, or whose link is already published. */
  id?: string;
  children: ReactNode;
}

/** One step under a DocSection: an example inside "Examples", a sub-component's
 *  props inside "API Reference". Smaller than a section heading and set closer
 *  to what follows it, so a page of six examples reads as one list rather than
 *  six pages stacked. */
export function DocSubSection({ title, id, children }: DocSubSectionProps) {
  const anchorId = id ?? headingId(title);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <AnchoredHeading
        as="h3"
        id={anchorId}
        className="-mb-1 py-1 text-subheading text-foreground leading-none"
      >
        {title}
      </AnchoredHeading>
      {children}
    </div>
  );
}

export { headingId };
