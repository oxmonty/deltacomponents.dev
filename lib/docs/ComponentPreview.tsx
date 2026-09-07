"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { routeKeyboardOnMouseDown } from "@/lib/click-to-focus";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { useIcon } from "@/registry/default/lib/icon-context";
import { Tooltip } from "@/registry/base/tooltip";
import { Code } from "@/registry/default/code";
import { useNarrowFrame } from "@/lib/use-narrow-frame";

/** Snippets longer than this collapse behind an Expand affordance; shorter
 *  ones render in full. Roughly the point where a reader stops taking the
 *  whole sample in at a glance.
 *
 *  That point is much earlier on a phone. The frame is the full width of the
 *  screen there, so the source sits directly under the demo with nothing
 *  beside it, and five or six lines are enough to push the demo they document
 *  off the top of the viewport. */
const COLLAPSE_AFTER_LINES = 12;
const COLLAPSE_AFTER_LINES_NARROW = 4;

export interface PlaybackButton {
  icon: ReactNode;
  tooltip: string;
  onClick: () => void;
}

interface ComponentPreviewProps {
  title?: string;
  /** Source snippet rendered under the demo. Omit to show the demo alone —
   *  gallery rows do that, where one sample covers several frames. */
  code?: string;
  /** Height the code panel is clipped to while collapsed. The default is a
   *  teaser, not a preview: Code's Expand affordance is a 96px gradient
   *  pinned to the bottom, so 8rem leaves roughly two clear lines above it —
   *  enough to see it is the demo's source without the frame turning into a
   *  wall of code. Only applies once the snippet is long enough to collapse
   *  at all. */
  codeCollapsedHeight?: string;
  /** Label on the affordance that opens the collapsed source. */
  expandLabel?: string;
  /** Legacy replay callback */
  onReplay?: () => void;
  /** Custom playback button (overrides onReplay) */
  playbackButton?: PlaybackButton;
  /** Padding around the preview content. Use "compact" when the demo
   *  is a self-contained block that already supplies its own breathing
   *  room (dialogs, full-bleed cards). "responsive" is compact on mobile
   *  and default on desktop — for big demos that feel cramped on phones.
   *  "none" removes the padding entirely so the demo bleeds to the
   *  preview frame (full-width tables, scroll areas).
   *  Defaults to "default". */
  padding?: "default" | "compact" | "responsive" | "none";
  /** Override the minimum height of the preview area. Accepts any Tailwind
   *  min-height class (e.g. `min-h-[280px]`). Defaults to `min-h-[120px]`.
   *  Useful when a demo opens floating UI (popovers, dropdowns) that needs
   *  vertical room. */
  minHeightClass?: string;
  /** Vertical alignment of the preview content. Defaults to "center".
   *  "top" suits content that grows downward — an accordion opening a panel
   *  shouldn't shift the rows above it. */
  align?: "top" | "center" | "bottom";
  /** Drop the header row entirely — the frame shows just the demo (and the
   *  code, if given). For gallery-style rows where the chrome would repeat
   *  three times for one code sample. */
  hideHeader?: boolean;
  /** Centered label rendered under the frame — the gallery rows' captions. */
  caption?: string;
  children: ReactNode;
}

export function ComponentPreview({
  title,
  code,
  onReplay,
  playbackButton,
  padding = "default",
  codeCollapsedHeight = "8rem",
  expandLabel = "View code",
  minHeightClass = "min-h-[120px]",
  align = "center",
  hideHeader = false,
  caption,
  children,
}: ComponentPreviewProps) {
  const narrow = useNarrowFrame();
  const shape = useShape();
  const ReplayIcon = useIcon("rotate-ccw");
  const previewRef = useRef<HTMLDivElement>(null);

  // Clicking an empty part of the preview routes keyboard control into the demo
  // (focuses its first interactive element). Clicking outside / Tab away hands
  // keys back to the page. The frame itself stays put: the focused control
  // draws its own ring, and having the border react as well made the frame
  // darken every time someone touched the demo.
  const handlePreviewMouseDown = (e: MouseEvent<HTMLDivElement>) =>
    routeKeyboardOnMouseDown(e, previewRef.current);

  const showButton = !!playbackButton || !!onReplay;
  // The header carries a title and the replay button and nothing else, so it
  // earns its height only when one of them is actually there — most previews
  // have neither and the demo owns the whole frame.
  const showHeader = !hideHeader && (!!title || showButton);
  // Collapse the source only when there is enough of it to be worth hiding.
  // Most playground snippets are a line or two, and clipping those buries the
  // whole thing under the Expand gradient for no gain — the affordance would
  // be taller than the code it covers. A one- or two-line sample stays open on
  // a phone for the same reason.
  const collapsible =
    (code?.trim().split("\n").length ?? 0) >
    (narrow ? COLLAPSE_AFTER_LINES_NARROW : COLLAPSE_AFTER_LINES);

  const frame = (
    <div
      // `isolate` scopes the frame's internal z ladder to its own stacking
      // context, so a portalled dialog's z-50 overlay dims the WHOLE frame
      // instead of sliding underneath the header.
      className={`relative isolate flex flex-col gap-0 w-full border border-border/60 ${shape.container}`}
    >
      {/* Control strip. It carries only the title and the replay button, so it
          is slim and right-aligned rather than a tab bar; the min-height still
          reserves the button's height so the header doesn't shift when that
          button mounts. */}
      {showHeader && (
      <div
        className="relative z-[70] flex items-center gap-0 px-3 py-2 min-h-[44px] border-b border-border/60 bg-background"
        style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      >
        {title && (
          <span
            className="px-4 py-2.5 text-body text-foreground mr-auto"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {title}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {showButton && (
            <Tooltip content={playbackButton?.tooltip ?? "Replay animation"} side="top">
              <button
                onClick={playbackButton?.onClick ?? onReplay}
                className={`w-10 h-10 flex items-center justify-center ${shape.button} text-muted-foreground/60 hover:text-foreground hover:bg-hover transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]`}
                aria-label={playbackButton?.tooltip ?? "Replay animation"}
              >
                {playbackButton?.icon ?? <ReplayIcon size={16} strokeWidth={1.5} />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      )}

      {/* Content. Wrapped so its rectangular bottom corners get clipped to the
          outer container's rounded shape (rounded-xl / rounded-3xl depending on
          shape). `border-bottom-*-radius: inherit` adopts whichever shape is
          active, and leaves the top corners square when a header sits above. */}
      <div
        className="overflow-hidden"
        // With no header above it, the content owns all four corners.
        style={
          showHeader
            ? {
                borderBottomLeftRadius: "inherit",
                borderBottomRightRadius: "inherit",
              }
            : { borderRadius: "inherit" }
        }
      >
        <div
          ref={previewRef}
          // Focus target for empty-space clicks (see routeKeyboardOnMouseDown)
          // — holds keyboard scope for the demo without ringing any control.
          tabIndex={-1}
          onMouseDown={handlePreviewMouseDown}
          className={`relative flex outline-none ${
            align === "bottom"
              ? "items-end"
              : align === "top"
                ? "items-start"
                : "items-center"
          } justify-center ${minHeightClass} bg-background ${
            padding === "none"
              ? ""
              : padding === "compact"
                ? "px-4 py-4"
                : padding === "responsive"
                  ? "px-4 py-4 sm:px-8 sm:py-12"
                  : "px-8 py-12"
          }`}
        >
          {children}
        </div>

        {/* The source sits UNDER the demo rather than behind a tab, clipped to a
            teaser with a gradient and an Expand affordance — the shape shadcn's
            docs use. Code already owns that behaviour, so this composes it
            rather than reimplementing the collapse. Its own border and corners
            come off: the frame around it supplies both, and only the hairline
            separating it from the demo is kept. */}
        {code && (
          <Code
            code={code}
            language="tsx"
            showLineNumbers={false}
            expandable={collapsible}
            collapsedHeight={codeCollapsedHeight}
            expandLabel={expandLabel}
            className="rounded-none border-0 border-t border-border/60"
            textClassName="text-body"
          />
        )}
      </div>
    </div>
  );

  if (!caption) return frame;
  return (
    <div className="flex flex-col gap-3">
      {frame}
      <p className="pb-2 text-center text-caption text-muted-foreground">{caption}</p>
    </div>
  );
}
