"use client";

import { type MouseEvent, type ReactNode } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { CodeBlock } from "@/registry/default/code-block";
import { componentList, labelOf, neighbours, toLabel } from "@/lib/docs/components";
import { installUrl } from "@/lib/registry-url";
import { DocPager } from "@/lib/docs/DocPager";
import { DocHeader } from "@/lib/docs/DocHeader";

interface DocPageProps {
  /** Optional: with a `slug`, the heading comes from that component's entry in
   *  `componentList`, so the name is written once and spaced automatically.
   *  Pass this only for a page that has no entry. */
  title?: string;
  description: ReactNode;
  /** Slug used for prev/next navigation (must match a `componentList` entry). */
  slug?: string;
  /** Registry slug used for the auto-injected Installation snippet. Defaults to `slug`.
   *  Set when the install advertises a bundled registry item different from the page slug
   *  (e.g. `slug="surfaces"` but `installSlug="elevated"`). */
  installSlug?: string;
  /** Set to false to skip the auto-injected Installation block (when the page provides its own). */
  showInstall?: boolean;
  /** Optional note rendered under the install command. */
  installNote?: string;
  children: ReactNode;
}

export function DocPage({
  title,
  description,
  slug,
  installSlug,
  showInstall = true,
  installNote,
  children,
}: DocPageProps) {
  const entry = slug ? componentList.find((c) => c.slug === slug) : undefined;
  const heading = title ? toLabel(title) : entry ? labelOf(entry) : "";

  const { prev, next } = neighbours(slug ? `/docs/${slug}` : "");

  return (
    <div className="flex flex-col gap-8 px-6">
      <DocHeader title={heading} description={description} prev={prev} next={next} />

      {slug && showInstall && (
        <div className="flex flex-col gap-3">
          <h2
            className="text-title text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Installation
          </h2>
          {/* A fenced npx command, so CodeBlock expands it into npm / yarn /
              pnpm / bun and the reader copies the one they actually use.
              npm stays selected by default — it is what the shadcn CLI
              documents. */}
          <CodeBlock
            code={`\`\`\`npx\nshadcn@latest add ${installUrl(installSlug ?? slug)}\n\`\`\``}
            defaultPackageManager="npm"
          />
          {installNote && (
            <p className="text-caption text-muted-foreground">{installNote}</p>
          )}
        </div>
      )}
      {children}

      {slug && <DocPager prev={prev} next={next} />}
    </div>
  );
}

/** Slug for a section heading, matching how shadcn's docs build theirs: the
 *  text, spaces to dashes, apostrophes and question marks dropped, lowercased.
 *  Kept identical so `#custom-colors` style links behave the same here. */
export function headingId(text: string): string | undefined {
  return (
    text
      .trim()
      .replace(/\s+/g, "-")
      .replace(/['?]/g, "")
      .toLowerCase() || undefined
  );
}

/** Wraps a heading so the whole thing is a link to itself, with a `#` that
 *  fades in on hover — and on keyboard focus too, which shadcn's version
 *  leaves out: without it the affordance is invisible to anyone tabbing. */
function HeadingAnchor({ id, children }: { id?: string; children: ReactNode }) {
  if (!id) return <>{children}</>;

  // Scrolling the viewport explicitly rather than letting the fragment or
  // scrollIntoView do it: the page content sits inside a clipped ancestor, so
  // both of those resolve to that container instead of the viewport and end up
  // moving nothing. The offset comes from the heading's own scroll-margin, so
  // the two stay in step.
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Leave modified clicks alone — they open a new tab or window.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const heading = document.getElementById(id);
    if (!heading) return;
    event.preventDefault();

    const margin = parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
    window.scrollTo({
      top: heading.getBoundingClientRect().top + window.scrollY - margin,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    window.history.pushState(null, "", `#${id}`);
  };

  return (
    <a href={`#${id}`} onClick={handleClick} className="group no-underline">
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
      <h2
        id={anchorId}
        className="-mb-1 scroll-mt-20 py-2 text-title text-foreground leading-none"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        <HeadingAnchor id={anchorId}>{title}</HeadingAnchor>
      </h2>
      {children}
    </div>
  );
}
