"use client";

import Link from "next/link";
import { type ReactNode, type CSSProperties } from "react";
import { cn } from "@/registry/lib/utils";
import { fontWeights } from "@/registry/lib/font-weight";
import { Badge } from "@/app/components/ui/badge";
import { useIcon } from "@/registry/lib/icon-context";
import { ProductCard, ProductCardImage, ProductCardOverlay } from "@/registry/ui/product-card";
import { showcase } from "@/lib/config";

// From `xl` the columns are narrow, slim, narrow. A wide tile takes a narrow
// one plus the slim one, a little under two thirds, and can do so from either
// side; a narrow tile is a little over a third. Every row is one of each, so
// each size is pinned: wide to the left and narrow to the right unless a tile's
// own `gridClassName` in lib/docs/components.ts says otherwise.
const sizeClasses: Record<string, string> = {
  large: "md:col-span-2 md:row-span-2 xl:col-start-1",
  medium: "md:col-span-2 xl:col-start-1",
  small: "col-span-1 xl:col-start-3",
  tall: "col-span-1 md:row-span-2 xl:col-start-3",
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

/** The showcase tile. `showcase.tile` in lib/config.ts picks the build. */
export function BentoCard(props: BentoCardProps) {
  return showcase.tile === "overlay" ? <OverlayTile {...props} /> : <BorderedTile {...props} />;
}

function BorderedTile({ slug, name, isNew, gridSize = "small", action, className: extraClassName, previewClassName, style, children }: BentoCardProps) {
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
        {slug && <span className="sr-only"> documentation</span>}
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
        {/* Named by its content (plus the hidden "documentation"), not an
            aria-label: the New badge is visible text too, and a label that
            omits it fails the label-in-name check. */}
        {slug ? (
          <Link
            href={`/docs/${slug}`}
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

// The ProductCard build: the well is the whole tile, the demo sits on the
// stage, the New badge holds the top-left corner, and the docs link waits in
// the bottom-left until the pointer (or keyboard focus) arrives.
function OverlayTile({ slug, name, isNew, gridSize = "small", action, className, previewClassName, style, children }: BentoCardProps) {
  const ArrowRight = useIcon("arrow-right");

  return (
    // `animated={false}`: there is no image to lift, so the well should not
    // listen for the touch press-to-hold either. The root's own `text-sm` is
    // undone so every demo inside keeps the size it was designed at.
    <ProductCard
      animated={false}
      className={cn("h-full w-full max-w-none rounded-[28px] text-[length:inherit]", sizeClasses[gridSize], className)}
      style={style}
    >
      {/* No `src`: the well is a stage. Its named `group/card-image` is what
          the overlays key their reveal on, and being named it never fires the
          unnamed `group-hover:` styling the demos inside use for themselves.
          A ProductCard demo nested in here would otherwise sit on the same
          grey as the tile, so its well steps up to the card surface. */}
      <ProductCardImage
        className={cn(
          "flex aspect-auto h-full items-center justify-center rounded-[28px] px-6 py-16",
          "**:data-[slot=product-card-image]:bg-card",
          previewClassName
        )}
      >
        {children}

        {isNew && (
          <ProductCardOverlay position="top-left">
            <Badge variant="dot" color="blue" size="sm">
              New
            </Badge>
          </ProductCardOverlay>
        )}

        {slug && (
          <ProductCardOverlay position="bottom-left" reveal="hover">
            <Link
              href={`/docs/${slug}`}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full bg-background/95 px-3.5 shadow-surface-2",
                "text-body text-muted-foreground transition-colors duration-80 hover:text-foreground",
                "outline-none focus-visible:shadow-[0_0_0_1px_var(--focus-ring,#6B97FF)]"
              )}
              style={{ fontVariationSettings: fontWeights.medium }}
            >
              {name}
              <span className="sr-only"> documentation</span>
              <ArrowRight aria-hidden className="-ml-1 size-3.5 -rotate-45" />
            </Link>
          </ProductCardOverlay>
        )}

        {action && <ProductCardOverlay position="bottom-right">{action}</ProductCardOverlay>}
      </ProductCardImage>
    </ProductCard>
  );
}
