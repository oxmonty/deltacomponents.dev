"use client";

import * as React from "react";
import { Bookmark, Play, SlidersHorizontal } from "lucide-react";
import { cn } from "@/registry/lib/utils";

/* A 1:1 reproduction of the landing-page card on bencho.dev, taken from its
 * computed styles and stylesheet on 2026-11-08. Every pixel value, colour and
 * timing below is theirs, not this site's token system — it is a reference
 * for what the product card could grow, not a component to publish.
 *
 * Anatomy, in paint order:
 *   stage  — absolute, clips a centred `w-max` scale wrapper
 *   tag    — top-left pill ("New" white / "Sponsored" slab), always visible
 *   save   — top-right 36px ghost round button, hover-revealed
 *   veil   — bottom-left name pill, hover-revealed with a 4px spring rise
 *   play   — bottom-right-minus-60 38px elevated round button, hover-revealed
 *   open   — bottom-right 38px elevated round button, hover-revealed
 *
 * The reveal is `opacity: 0` only under `@media (hover: hover)`, so a touch
 * screen sees every control from the start, 44px instead of 36/38, and the
 * veil (which is NOT inside that query on bencho) stays hidden there. */

// --ink: #17181a, --ink-2: #3c3b37, --ink-3: #5c5b56; bencho's dark theme
// uses rgb(242 241 238) as ink and mixes its pills 14% ink into the page.
const elevated = cn(
  "bg-white/94 text-[#5c5b56] hover:text-[#17181a] hover:bg-white",
  "dark:bg-[color-mix(in_srgb,rgb(242_241_238)_14%,var(--background))] dark:text-white/78",
  "dark:hover:bg-[color-mix(in_srgb,rgb(242_241_238)_20%,var(--background))] dark:hover:text-white"
);

const revealOnHover = cn(
  "[@media(hover:hover)]:opacity-0 group-hover/bench:opacity-100",
  "focus-visible:opacity-100 data-[on=true]:opacity-100"
);

const roundAction = cn(
  "absolute z-[3] grid size-[38px] place-items-center rounded-full border-0 cursor-pointer",
  "pointer-coarse:size-11 pointer-coarse:bottom-3 pointer-coarse:right-3",
  "[transition:opacity_.18s,scale_.24s_cubic-bezier(.28,1.3,.36,1),background-color_.2s,color_.16s]",
  "hover:scale-95 active:scale-90",
  "outline-none focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_rgba(23,24,26,.35)]",
  elevated,
  revealOnHover
);

interface BenchoCardProps extends Omit<React.ComponentProps<"article">, "title"> {
  name: string;
  tag?: "New" | "Sponsored";
  height: number;
  /** Where the sliders button points — bencho opens the block's editor. */
  href?: string;
}

export function BenchoCard({ name, tag, height, href = "#", className, children, ...props }: BenchoCardProps) {
  const [saved, setSaved] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);

  return (
    <article
      data-tone="light"
      className={cn(
        "group/bench relative w-full cursor-pointer overflow-hidden rounded-[28px]",
        "bg-[rgba(23,24,26,.06)] text-[13px] leading-[1.5] text-[#17181a]",
        "dark:bg-[rgba(242,241,238,.06)] dark:text-[rgb(242,241,238)]",
        className
      )}
      style={{ height }}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 cursor-auto select-none">
          {children}
        </div>
      </div>

      {tag && (
        <span
          className={cn(
            "absolute top-4 left-4 z-[2] inline-flex h-6 items-center rounded-full px-2.5",
            "text-[11px] leading-none tracking-[0.01em] whitespace-nowrap",
            tag === "New"
              ? "bg-white font-medium text-[#17181a] dark:bg-white/14 dark:text-white"
              : "bg-[#17181a] font-semibold text-white"
          )}
        >
          {tag}
        </span>
      )}

      <button
        type="button"
        aria-label="Save"
        title="Save"
        aria-pressed={saved}
        data-on={saved}
        onClick={() => setSaved((s) => !s)}
        className={cn(
          "absolute top-2.5 right-2.5 z-[2] grid size-9 place-items-center rounded-full border-0 bg-transparent cursor-pointer",
          "pointer-coarse:rounded-[10px]",
          "text-[#5c5b56] hover:text-[#17181a] data-[on=true]:text-[#17181a]",
          "dark:text-[rgba(242,241,238,.5)] dark:hover:text-[rgb(242,241,238)] dark:data-[on=true]:text-[rgb(242,241,238)]",
          "[transition:opacity_.18s,color_.16s] motion-reduce:[transition-duration:1ms]",
          // The hover wash is a ::before that pops from 86% so the circle
          // reads as arriving, not as a background switching on.
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:content-['']",
          "before:bg-[rgba(23,24,26,.08)] dark:before:bg-white/10 before:opacity-0 before:scale-[.86]",
          "before:[transition:opacity_.15s,scale_.26s_cubic-bezier(.3,1.12,.4,1)]",
          "hover:before:opacity-100 hover:before:scale-100 focus-visible:before:opacity-100 focus-visible:before:scale-100",
          "[&>svg]:relative [&>svg]:[transition:scale_.26s_cubic-bezier(.3,1.12,.4,1)]",
          "hover:[&>svg]:scale-[1.04] active:[&>svg]:scale-[.96] active:[&>svg]:[transition-duration:90ms]",
          "outline-none",
          revealOnHover
        )}
      >
        <Bookmark aria-hidden className="size-[18px]" strokeWidth={2} fill={saved ? "currentColor" : "none"} />
      </button>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex items-end gap-2",
          "pr-[106px] pb-3.5 pl-3.5 pointer-coarse:pr-[116px] pointer-coarse:pb-3 pointer-coarse:pl-3",
          "translate-y-1 opacity-0 group-hover/bench:translate-y-0 group-hover/bench:opacity-100",
          "[transition:opacity_.2s,translate_.26s_cubic-bezier(.28,1.3,.36,1)] motion-reduce:[transition-duration:1ms]"
        )}
      >
        <span
          className={cn(
            "block h-[38px] min-w-0 overflow-hidden rounded-full px-3.5 text-[12.5px] leading-[38px] tracking-[-0.01em] text-ellipsis whitespace-nowrap",
            "pointer-coarse:h-11 pointer-coarse:px-4 pointer-coarse:text-[13.5px] pointer-coarse:leading-[44px]",
            "bg-white/94 text-[#3c3b37]",
            "dark:bg-[color-mix(in_srgb,rgb(242_241_238)_14%,var(--background))] dark:text-white/78"
          )}
        >
          {name}
        </span>
      </div>

      <button
        type="button"
        aria-label="Show me how"
        title="Show me how"
        aria-pressed={playing}
        data-on={playing}
        onClick={() => setPlaying((p) => !p)}
        className={cn(
          roundAction,
          "right-[60px] bottom-3.5 pointer-coarse:right-16",
          "data-[on=true]:bg-[#17181a] data-[on=true]:text-white data-[on=true]:hover:bg-[#17181a] data-[on=true]:hover:text-white"
        )}
      >
        <Play aria-hidden className="size-[15px]" strokeWidth={2} />
      </button>

      <a
        href={href}
        aria-label={`Edit ${name}`}
        title="Edit"
        className={cn(roundAction, "right-3.5 bottom-3.5 no-underline")}
      >
        <SlidersHorizontal aria-hidden className="size-[18px]" strokeWidth={2} />
      </a>
    </article>
  );
}
