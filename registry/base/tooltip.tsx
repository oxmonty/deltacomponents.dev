"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";

// ---------------------------------------------------------------------------
// Portal container context
// ---------------------------------------------------------------------------

const TooltipPortalContainerContext = createContext<HTMLElement | null>(null);

function TooltipPortalContainer({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <TooltipPortalContainerContext.Provider value={value}>
      {children}
    </TooltipPortalContainerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const DEFAULT_DELAY = 200;

// Tracks whether an app-level <TooltipProvider> is above us. Each Tooltip
// only wraps itself in a local primitive Provider when there isn't one —
// a per-instance Provider would defeat cross-tooltip skip-delay grouping
// (moving between adjacent tooltips would re-wait the full delay).
const TooltipGroupContext = createContext(false);

interface TooltipProviderProps {
  children: ReactNode;
  /** Hover delay before tooltips open, in ms. Defaults to 200. */
  delayDuration?: number;
  /** After a tooltip closes, adjacent tooltips opened within this window
   *  skip the hover delay, in ms. Defaults to 300. */
  skipDelayDuration?: number;
}

/** Groups descendant Tooltips so that once one opens, moving to an adjacent
 *  trigger shows its tooltip instantly instead of re-waiting the full delay.
 *  Wrap once at the app (or section) level; bare Tooltips still work without
 *  it via a per-instance fallback. */
function TooltipProvider({
  children,
  delayDuration = DEFAULT_DELAY,
  skipDelayDuration = 300,
}: TooltipProviderProps) {
  return (
    <TooltipGroupContext.Provider value={true}>
      <TooltipPrimitive.Provider
        delay={delayDuration}
        timeout={skipDelayDuration}
      >
        {children}
      </TooltipPrimitive.Provider>
    </TooltipGroupContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  content: ReactNode;
  children: React.ReactElement;
  side?: TooltipSide;
  sideOffset?: number;
  /** Hover delay before this tooltip opens, in ms. Defaults to 200, or to the
   *  ambient TooltipProvider's delayDuration when one is present. */
  delayDuration?: number;
  className?: string;
  /** Extra classes for the portalled positioner element — pass a z utility
   *  here to lift the whole tooltip above other fixed layers (default z-50). */
  contentClassName?: string;
  /** When true, forces the tooltip open. When false, forces it closed. When undefined, uses default hover/focus behavior. */
  forceOpen?: boolean;
  /** Follow the cursor along one axis while hovering the trigger — for tall
   *  or wide triggers (the Sidebar rail) where a centered tooltip sits far
   *  from the pointer. The other axis stays anchored by `side`. */
  followCursor?: "x" | "y";
  /** Called when the tooltip's internal open state changes (before forceOpen is applied). */
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

// The tooltip slides in 4px from this direction and back out on exit.
function getSlideClasses(side: TooltipSide) {
  switch (side) {
    case "top":
      return "data-[starting-style]:translate-y-1 data-[ending-style]:translate-y-1";
    case "bottom":
      return "data-[starting-style]:-translate-y-1 data-[ending-style]:-translate-y-1";
    case "left":
      return "data-[starting-style]:translate-x-1 data-[ending-style]:translate-x-1";
    case "right":
      return "data-[starting-style]:-translate-x-1 data-[ending-style]:-translate-x-1";
  }
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function Tooltip({
  content,
  children,
  side = "top",
  sideOffset = 8,
  delayDuration,
  className,
  contentClassName,
  forceOpen,
  onOpenChange: onOpenChangeProp,
  followCursor,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = forceOpen !== undefined ? forceOpen : internalOpen;
  const shape = useShape();
  const portalContainer = useContext(TooltipPortalContainerContext);
  const hasAmbientProvider = useContext(TooltipGroupContext);

  // Cursor-follow offset from the trigger's center, written straight to a CSS
  // custom property on the popup element so per-move updates skip React
  // re-renders entirely.
  const popupRef = useRef<HTMLDivElement>(null);
  // A force-opened follow-cursor tooltip has no cursor to follow — it rests
  // centered on the trigger until a real pointer takes over.
  useEffect(() => {
    if (forceOpen && followCursor) {
      popupRef.current?.style.setProperty("--tooltip-follow", "0px");
    }
  }, [forceOpen, followCursor]);
  const handleFollowMove = (event: React.PointerEvent) => {
    if (!followCursor) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offset =
      followCursor === "y"
        ? event.clientY - (rect.top + rect.height / 2)
        : event.clientX - (rect.left + rect.width / 2);
    popupRef.current?.style.setProperty("--tooltip-follow", `${offset}px`);
  };

  const tooltip = (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={(v) => {
        setInternalOpen(v);
        onOpenChangeProp?.(v);
      }}
    >
      {/* An explicit delayDuration overrides the ambient provider's delay;
          left undefined, the trigger inherits it from the provider. */}
      <TooltipPrimitive.Trigger
        render={children}
        delay={delayDuration}
        onPointerMove={followCursor ? handleFollowMove : undefined}
      />
      <TooltipPrimitive.Portal container={portalContainer ?? undefined}>
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          className={cn("z-50", contentClassName)}
        >
          <TooltipPrimitive.Popup
            ref={popupRef}
            className={cn(
              // Trim recenters the label; the padding bump only applies
              // where text-box is supported, keeping the same overall
              // height (~26px) as untrimmed browsers.
              "bg-foreground text-background text-[12px] px-2 py-1",
              "[text-box:trim-both_cap_alphabetic] supports-[text-box:trim-both]:py-2",
              shape.bg,
              "transition-[opacity,transform] duration-(--motion-fast) ease-spring",
              "data-[ending-style]:duration-(--motion-fast-exit)",
              "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
              getSlideClasses(side),
              className
            )}
            style={{
              fontVariationSettings: fontWeights.medium,
              ...(followCursor === "y"
                ? { translate: "0 var(--tooltip-follow, 0px)" }
                : followCursor === "x"
                  ? { translate: "var(--tooltip-follow, 0px) 0" }
                  : {}),
            }}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );

  // Fallback: without an ambient TooltipProvider, give this instance its own
  // so a bare <Tooltip> keeps the library's default delay. Grouped skip-delay
  // needs the shared app-level TooltipProvider.
  if (hasAmbientProvider) return tooltip;

  return (
    <TooltipPrimitive.Provider delay={delayDuration ?? DEFAULT_DELAY}>
      {tooltip}
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip, TooltipPortalContainer, TooltipProvider };
export type { TooltipProps, TooltipProviderProps, TooltipSide };
