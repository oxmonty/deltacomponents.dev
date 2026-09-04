"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useSizeVariant } from "@/lib/size-context";
import { CodeBlock } from "@/registry/default/code-block";
import { Button } from "@/registry/base/button";
import { useIcon } from "@/lib/icon-context";
import { componentList, docOrder, labelOf, toLabel } from "@/lib/docs/components";
import { Tooltip } from "@/registry/base/tooltip";
import { installUrl } from "@/lib/registry-url";
import { DocPager } from "@/lib/docs/DocPager";

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
  const ArrowRight = useIcon("arrow-right");
  // Square buttons have no provider-following value, so the prev/next arrows
  // derive their step explicitly (see the size ladder in globals.css).
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);

  const currentIndex = slug ? docOrder.findIndex((c) => c.slug === slug) : -1;
  const prev = currentIndex > 0
    ? docOrder[currentIndex - 1]
    : currentIndex === 0
      ? { slug: "", name: "Introduction" }
      : null;
  const next = currentIndex >= 0 && currentIndex < docOrder.length - 1 ? docOrder[currentIndex + 1] : null;

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          {/* Page chrome rides the type-scale roles (see the size ladder in
              globals.css): display for the h1, prose for the description. */}
          <h1
            className="text-display text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            {heading}
          </h1>
          {slug && (
            <div className="flex shrink-0 items-center gap-1">
              {prev ? (
                <Tooltip content={<span>{prev.name} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
                  <Link href={`/docs/${prev.slug}`} aria-label={`Previous: ${prev.name}`} className="outline-none" tabIndex={-1}>
                    <Button variant="ghost" size={iconSize}>
                      <ArrowRight className="rotate-180" />
                    </Button>
                  </Link>
                </Tooltip>
              ) : (
                <Button variant="ghost" size={iconSize} disabled aria-label="No previous component">
                  <ArrowRight className="rotate-180" />
                </Button>
              )}
              {next ? (
                <Tooltip content={<span>{next.name} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
                  <Link href={`/docs/${next.slug}`} aria-label={`Next: ${next.name}`} className="outline-none" tabIndex={-1}>
                    <Button variant="ghost" size={iconSize}>
                      <ArrowRight />
                    </Button>
                  </Link>
                </Tooltip>
              ) : (
                <Button variant="ghost" size={iconSize} disabled aria-label="No next component">
                  <ArrowRight />
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Balanced and capped short of the arrows, so a two-line description
            breaks evenly instead of leaving one orphaned word under a full
            line — the shape shadcn's docs use. */}
        <p className="text-prose text-muted-foreground text-pretty md:max-w-[80%]">
          {description}
        </p>
      </div>

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

      {slug && (
        <DocPager
          prev={prev ? { href: `/docs/${prev.slug}`, name: prev.name } : null}
          next={next ? { href: `/docs/${next.slug}`, name: next.name } : null}
        />
      )}
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
      {/* scroll-mt keeps the heading clear of the viewport edge when someone
          lands on it from a #link. */}
      <h2
        id={anchorId}
        className="-mb-1 scroll-mt-20 text-title text-foreground leading-none"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        <HeadingAnchor id={anchorId}>{title}</HeadingAnchor>
      </h2>
      {children}    </div>
  );
}
