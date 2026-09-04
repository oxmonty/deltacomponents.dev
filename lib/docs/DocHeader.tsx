"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Button } from "@/registry/base/button";
import { Tooltip } from "@/registry/base/tooltip";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useIcon } from "@/lib/icon-context";
import { useSizeVariant } from "@/lib/size-context";
import type { PageLink } from "@/lib/docs/components";

/** The title / description / arrows block every page opens with.
 *
 *  Shared rather than repeated: the showcase, the introduction and each
 *  component page had their own copy, and they had already drifted — different
 *  spacing under the title, and a description that ran under the arrows on the
 *  narrower ones.
 *
 *  The title and description are one gap-2 stack, and the description is
 *  capped short of the arrows so a second line breaks evenly instead of
 *  orphaning a word beneath a full one. */
export function DocHeader({
  title,
  description,
  prev,
  next,
  children,
}: {
  title: string;
  description: ReactNode;
  prev?: PageLink | null;
  next?: PageLink | null;
  /** Anything that belongs under the description — the showcase's call to
   *  action, say. */
  children?: ReactNode;
}) {
  const ArrowRight = useIcon("arrow-right");
  // Square buttons have no provider-following value, so the arrows derive their
  // step explicitly (see the size ladder in globals.css).
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);

  const arrow = (link: PageLink | null | undefined, direction: "prev" | "next") => {
    const rotate = direction === "prev" ? "rotate-180" : undefined;
    const key = direction === "prev" ? "←" : "→";

    if (!link) {
      return (
        <Button
          variant="ghost"
          size={iconSize}
          disabled
          aria-label={direction === "prev" ? "No previous page" : "No next page"}
        >
          <ArrowRight className={rotate} />
        </Button>
      );
    }

    return (
      <Tooltip
        content={
          <span>
            {link.name} &ensp;<kbd className="font-mono opacity-50">{key}</kbd>
          </span>
        }
      >
        <Link
          href={link.href}
          aria-label={`${direction === "prev" ? "Previous" : "Next"}: ${link.name}`}
          className="outline-none"
          tabIndex={-1}
        >
          <Button variant="ghost" size={iconSize}>
            <ArrowRight className={rotate} />
          </Button>
        </Link>
      </Tooltip>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <h1
          className="text-display text-foreground leading-none"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          {arrow(prev, "prev")}
          {arrow(next, "next")}
        </div>
      </div>
      {/* Full column width, not a percentage of it. shadcn caps its
          description at 80%, but its reading column is wider than this one —
          at 632px that cap cuts the line to ~50 characters, short of the
          comfortable 45-75 measure, and adds a line. Full width lands at ~63.
          Nothing collides: the arrows sit in the row above, not beside this. */}
      <p className="text-prose text-muted-foreground text-pretty">{description}</p>
      {children}
    </div>
  );
}
