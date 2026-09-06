"use client";

import Link from "next/link";
import { type ReactNode, type CSSProperties } from "react";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Badge } from "@/registry/default/badge";
import { useIcon } from "@/lib/icon-context";

const sizeClasses: Record<string, string> = {
  large: "md:col-span-2 md:row-span-2",
  medium: "md:col-span-2",
  small: "col-span-1",
};

interface BentoCardProps {
  slug: string;
  name: string;
  isNew?: boolean;
  gridSize?: string;
  /** Overrides the stage's padding for a preview that needs a taller window.
   *  Rows are pinned at 300px (`grid-auto-rows`), so a preview can only be
   *  shown more fully by spending less of that height on padding. */
  previewClassName?: string;
  /** Optional control pinned to the preview area's bottom-right corner —
   *  the /demo page puts the playground pen menu here. Rendered outside the
   *  (possibly scaled) preview content so it keeps its natural size. */
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function BentoCard({ slug, name, isNew, gridSize = "small", action, className: extraClassName, previewClassName, style, children }: BentoCardProps) {
  // Rotated arrow-right rather than a dedicated arrow-up-right key: that key
  // would have to be added to the IconName union and to all five icon packs
  // for one glyph that a 45deg turn already draws correctly in every pack.
  const ArrowRight = useIcon("arrow-right");
  // No click-to-focus wiring here. Previously a mousedown on empty space
  // inside the card routed focus to the preview's first interactive element
  // (so the user could keyboard-drive the demo afterwards). In practice it
  // caused unintended visual focus state on the first item — the
  // checked-state on radios, the selected tab on TabsSubtle, the open
  // accordion section, etc. — making cards look "primed" the moment a user
  // clicked anywhere in them. Now clicking only focuses what the user
  // actually clicked; Tab still routes into the card naturally.
  const footerLabel = (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "text-body text-muted-foreground transition-colors duration-80",
          slug && "group-hover/link:text-foreground"
        )}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        {name}
      </span>
      {slug && (
        <ArrowRight
          aria-hidden
          className="-ml-1 size-3.5 -rotate-45 text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground"
        />
      )}
      {isNew && (
        <Badge variant="dot" color="blue" size="sm">
          New
        </Badge>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        // No unnamed `group` here — many of the components rendered inside
        // (Button, Select, InputCopy, …) use Tailwind's unnamed `group-hover:`
        // for their own hover styling. Tailwind's `.group-hover:` matches the
        // nearest *any* `.group` ancestor, so an unnamed group on the card
        // would fire every inner button's hover state at once whenever the
        // card itself was hovered. The footer link below uses a NAMED
        // `group/link`, which is properly scoped.
        "relative flex flex-col rounded-xl border overflow-hidden outline-none transition-[shadow,border-color] duration-80 bento-card-border",
        sizeClasses[gridSize],
        extraClassName,
      )}
      style={style}
    >
      <div
        className={cn(
          "flex-1 min-h-0 flex items-center justify-center px-6 py-16",
          previewClassName
        )}
      >
        {children}
      </div>

      {/* Footer row: the name (a link to the docs when `slug` is set) on the
          left, the optional action pinned to the right.

          The link spans the FULL row so its hover fill runs the whole footer
          edge-to-edge; the action is layered on top of it, absolutely
          positioned, rather than sitting beside it as a flex sibling. It has to
          stay outside the anchor — a button nested in an anchor is invalid
          markup, and a click on the pen must not navigate — so overlaying is
          what buys the link its full width. */}
      <div className="relative shrink-0 border-t border-border/40">
        {slug ? (
          <Link
            href={`/docs/${slug}`}
            aria-label={`View ${name} documentation`}
            className="group/link flex items-center gap-2 px-4 py-3 rounded-b-xl transition-colors duration-80 hover:bg-hover outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--focus-ring,#6B97FF)]"
          >
            {footerLabel}
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3">{footerLabel}</div>
        )}
        {action && (
          <div className="absolute inset-y-0 right-2 z-10 flex items-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
