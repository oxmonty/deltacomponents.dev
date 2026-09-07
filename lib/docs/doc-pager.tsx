"use client";

import Link from "next/link";
import { Button } from "@/registry/ui/button";
import { useIcon } from "@/registry/lib/icon-context";

export interface PagerLink {
  href: string;
  name: string;
}

/** Bottom-of-page previous/next navigation, shared by the showcase, the
 *  introduction and every component page so the three end the same way.
 *
 *  Ghost buttons, like the icon arrows in each page header, so the pair reads
 *  as the same control rather than as a filled call to action. No fixed
 *  height: at narrow widths two long names wrap, and a fixed box either
 *  clipped them or pinned them against the rule — padding owns the spacing so
 *  the row grows with its content.
 *
 *  Sized to the sidebar's rows (13px), not the compact step: this is primary
 *  navigation at the end of a page, and at 12px it read as a footnote. */
export function DocPager({ prev, next }: { prev?: PagerLink | null; next?: PagerLink | null }) {
  const ArrowRight = useIcon("arrow-right");
  const ArrowLeft = (props: { size?: number; className?: string }) => (
    <ArrowRight {...props} className={`rotate-180 ${props.className ?? ""}`} />
  );

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Page pager"
      className="mt-10 flex w-full flex-wrap items-center gap-3 border-t border-border/60 pt-8 pb-6"
    >
      {prev && (
        <Link href={prev.href} className="outline-none" tabIndex={-1}>
          <Button variant="ghost" size="default" leadingIcon={ArrowLeft}>
            {prev.name}
          </Button>
        </Link>
      )}
      {next && (
        <Link href={next.href} className="ml-auto outline-none" tabIndex={-1}>
          <Button variant="ghost" size="default" trailingIcon={ArrowRight}>
            {next.name}
          </Button>
        </Link>
      )}
    </nav>
  );
}
