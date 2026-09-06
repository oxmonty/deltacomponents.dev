"use client";

import { useState, useRef, type MouseEvent, type ReactNode } from "react";
import { routeKeyboardOnMouseDown } from "@/lib/click-to-focus";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { useIcon } from "@/registry/default/lib/icon-context";
import { Tooltip } from "@/registry/base/tooltip";
import { Switch } from "@/components/ui/switch";
import { InspectOverlay } from "./InspectOverlay";
import { Code } from "@/registry/default/code";

/** Snippets longer than this collapse behind an Expand affordance; shorter
 *  ones render in full. Roughly the point where a reader stops taking the
 *  whole sample in at a glance. */
const COLLAPSE_AFTER_LINES = 12;

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
  /** Height the code panel is clipped to while collapsed. The default leaves
   *  roughly nine readable lines: Code's Expand affordance is a 96px
   *  gradient pinned to the bottom, so a shorter clip is largely covered by
   *  it. Only applies once the snippet is long enough to collapse at all. */
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
  /** Show the Inspect toggle (pixel rulers + box-model inspector). Defaults to
   *  true; set false for previews where an overlay would get in the way. */
  inspectable?: boolean;
  /** Start with Inspect already on — for previews whose subject IS the
   *  geometry. The toggle still works. */
  defaultInspect?: boolean;
  /** Draw the inspector's top/left pixel rulers. Defaults to true; set false
   *  for full-width/full-height demos where the rulers would overlap (or be
   *  masked by) the component's own chrome — the crosshair, box model, and
   *  measurement tooltip still work. */
  inspectRulers?: boolean;
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
  codeCollapsedHeight = "14rem",
  expandLabel = "View code",
  minHeightClass = "min-h-[120px]",
  align = "center",
  inspectable = true,
  defaultInspect = false,
  inspectRulers = true,
  hideHeader = false,
  caption,
  children,
}: ComponentPreviewProps) {
  const [inspect, setInspect] = useState(defaultInspect);
  const shape = useShape();
  const ReplayIcon = useIcon("rotate-ccw");
  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Clicking an empty part of the preview routes keyboard control into the demo
  // (focuses its first interactive element). Clicking outside / Tab away hands
  // keys back to the page. The frame itself stays put: the focused control
  // draws its own ring, and having the border react as well made the frame
  // darken every time someone touched the demo.
  const handlePreviewMouseDown = (e: MouseEvent<HTMLDivElement>) =>
    routeKeyboardOnMouseDown(e, previewRef.current);

  const showButton = !!playbackButton || !!onReplay;
  // The header only carries the extras now that the tabs are gone, so it earns
  // its 52px only when one of them is actually there.
  const showHeader = !hideHeader && (!!title || inspectable || showButton);
  // Collapse the source only when there is enough of it to be worth hiding.
  // Most playground snippets are a line or two, and clipping those buries the
  // whole thing under the Expand gradient for no gain — the affordance would
  // be taller than the code it covers.
  const collapsible = (code?.trim().split("\n").length ?? 0) > COLLAPSE_AFTER_LINES;

  const frame = (
    <div
      ref={frameRef}
      // `isolate` scopes the frame's internal z ladder (the z-[70] tab bar,
      // the inspect overlay's layers) to its own stacking context, so a
      // portalled dialog's z-50 overlay dims the WHOLE frame instead of
      // sliding underneath the header.
      className={`relative isolate flex flex-col gap-0 w-full border border-border/60 ${shape.container}`}
    >
      {/* Control strip. With the Preview/Code tabs gone it carries only the
          extras, so it is slim and right-aligned rather than a tab bar; the
          min-height still reserves the playback button's height so the header
          doesn't shift when that button mounts. Its own opaque background sits
          above the inspect overlay's ruler layer (z-[70] > z-[60]) so the ruler
          ticks tuck cleanly under it. */}
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
          {inspectable && (
            // Toggling Inspect must not dismiss whatever the preview has open
            // (a dropdown, a popover) — inspecting THAT state is the point.
            // The demos' menus are non-modal, so they dismiss on any outside
            // pointerdown reaching the document and on focus moving outside.
            // stopIMMEDIATEPropagation is what blocks them: the App Router
            // hydrates React on `document`, so Radix's document listener sits
            // on the same node as React's delegation and plain stopPropagation
            // can't cut it off. preventDefault on mousedown keeps focus (and
            // the focus-out dismissal) where it is; the Switch still toggles
            // on click.
            <span
              onPointerDown={(e) => e.nativeEvent.stopImmediatePropagation()}
              onMouseDown={(e) => {
                e.preventDefault();
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <Switch
                label="Inspect"
                checked={inspect}
                onToggle={() => setInspect((v) => !v)}
                className="h-8 px-2 rounded-md"
              />
            </span>
          )}
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

      {/* Inspector — sits over the whole frame so its rulers reach the outer
          border and clear the header toggles. Mounted once for the life of
          any inspectable preview (rather than mounted/unmounted with the
          toggle) so the Inspect switch fades it in/out with a plain CSS
          transition instead of framer's exit animation — previews that opt
          out of inspecting entirely (`inspectable={false}`) still never pay
          for it. */}
      {inspectable && (
        <InspectOverlay
          active={inspect}
          frameRef={frameRef}
          contentRef={previewRef}
          rulers={inspectRulers}
        />
      )}
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
