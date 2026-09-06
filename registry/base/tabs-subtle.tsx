"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { Tabs } from "@base-ui/react/tabs";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { useProximityHover, type ItemRect } from "@/hooks/use-proximity-hover";

interface TabsSubtleContextValue {
  registerTab: (index: number, element: HTMLElement | null) => void;
  hoveredIndex: number | null;
  selectedIndex: number;
  idPrefix: string | undefined;
  activeLabel: boolean;
}

const TabsSubtleContext = createContext<TabsSubtleContextValue | null>(null);

function useTabsSubtle() {
  const ctx = useContext(TabsSubtleContext);
  if (!ctx) throw new Error("useTabsSubtle must be used within a TabsSubtle");
  return ctx;
}

interface TabsSubtleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  idPrefix?: string;
  /** When true, only the selected tab shows its text label. Requires icons on tabs. */
  activeLabel?: boolean;
  /** Pins the tabs to one step of the size ladder (default 36px, compact
   *  28px — see /docs/sizes). Omitted, they follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

const TabsSubtle = forwardRef<HTMLDivElement, TabsSubtleProps>(
  ({ children, selectedIndex, onSelect, idPrefix, activeLabel = false, size, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isMouseInside = useRef(false);
    const shape = useShape();

    const {
      activeIndex: hoveredIndex,
      setActiveIndex: setHoveredIndex,
      itemRects: tabRects,
      handlers,
      registerItem,
      measureItems: measureTabs,
    } = useProximityHover(containerRef, { axis: "x" });

    // Track tab elements locally so we can observe their individual resizes
    const tabElementsRef = useRef(new Map<number, HTMLElement>());
    const registerTab = useCallback(
      (index: number, element: HTMLElement | null) => {
        registerItem(index, element);
        if (element) {
          tabElementsRef.current.set(index, element);
        } else {
          tabElementsRef.current.delete(index);
        }
      },
      [registerItem]
    );

    useEffect(() => {
      measureTabs();
    }, [measureTabs, children]);

    // Observe individual tab buttons for resize (label expand/collapse in activeLabel mode)
    useEffect(() => {
      const elements = tabElementsRef.current;
      if (elements.size === 0) return;
      const ro = new ResizeObserver(() => measureTabs());
      elements.forEach((el) => ro.observe(el));
      return () => ro.disconnect();
    }, [measureTabs, children]);

    // Wrap handlers to track isMouseInside
    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        isMouseInside.current = true;
        handlers.onMouseMove(e);
      },
      [handlers]
    );

    const handleMouseLeave = useCallback(() => {
      isMouseInside.current = false;
      handlers.onMouseLeave();
    }, [handlers]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const selectedRect = tabRects[selectedIndex];
    const hoverRect =
      hoveredIndex !== null ? tabRects[hoveredIndex] : null;
    const focusRect = focusedIndex !== null ? tabRects[focusedIndex] : null;
    const isHoveringSelected = hoveredIndex === selectedIndex;
    const isHovering = hoveredIndex !== null && !isHoveringSelected;

    // The hover/focus pills stay permanently mounted and just fade out in
    // place instead of unmounting — these refs hold the last real rect so the
    // fade has somewhere to sit while it plays. The hover pill's fade-out has
    // one exception: leaving the tablist entirely (not just onto the selected
    // tab) also slides it back to the selected pill's position first, so it
    // reads as merging back in rather than fading wherever the cursor left it.
    const hoverPillRef = useRef<ItemRect | null>(null);
    const isHoverPillVisible = hoverRect !== null && !isHoveringSelected;
    if (isHoverPillVisible) {
      hoverPillRef.current = hoverRect;
    } else if (!isMouseInside.current && selectedRect) {
      hoverPillRef.current = selectedRect;
    }
    const hoverPillRect = hoverPillRef.current;

    const focusPillRef = useRef<ItemRect | null>(null);
    if (focusRect) focusPillRef.current = focusRect;
    const focusPillRect = focusPillRef.current;

    const root = (
      <TabsSubtleContext.Provider
        value={{ registerTab, hoveredIndex, selectedIndex, idPrefix, activeLabel }}
      >
        {/* Root is merged into List via `render` so a single <div> is emitted,
            matching the previous DOM structure. Base UI owns role="tablist",
            roving tabindex, and Arrow/Home/End keyboard navigation.
            `activateOnFocus={false}` keeps manual activation: arrows move
            focus, Enter/Space selects. */}
        <Tabs.Root
          value={selectedIndex}
          onValueChange={(value) => {
            if (typeof value === "number") onSelect(value);
          }}
          render={
            <Tabs.List
              activateOnFocus={false}
              ref={(node: HTMLDivElement | null) => {
                containerRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
                const indexAttr = (e.target as HTMLElement)
                  .closest("[data-proximity-index]")
                  ?.getAttribute("data-proximity-index");
                if (indexAttr != null) {
                  const idx = Number(indexAttr);
                  setHoveredIndex(idx);
                  setFocusedIndex(
                    (e.target as HTMLElement).matches(":focus-visible") ? idx : null
                  );
                }
              }}
              onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
                if (containerRef.current?.contains(e.relatedTarget as Node)) return;
                setFocusedIndex(null);
                if (isMouseInside.current) return;
                setHoveredIndex(null);
              }}
              className={cn(
                // -mx-1 px-1 / -my-1 py-1 give the 2px-outset focus ring room
                // to draw without being clipped by overflow-x-auto. The
                // max-width allows for the negative margins: fit-content
                // parents size against the margin box (8px narrower than the
                // border box), so a plain max-w-full would clamp the list 8px
                // too small and clip the first/last tab's ring.
                "relative flex items-center gap-0.5 select-none overflow-x-auto max-w-[calc(100%_+_8px)] scrollbar-hide -mx-1 px-1 -my-1 py-1",
                className
              )}
              {...props}
            >
              {/* Selected pill. Stays mounted and just tracks selectedRect, so a
                  plain style update is enough — no enter/exit to animate. */}
              {selectedRect && (
                <div
                  className={cn("absolute bg-active pointer-events-none", shape.bg)}
                  style={{
                    left: selectedRect.left,
                    width: selectedRect.width,
                    top: selectedRect.top,
                    height: selectedRect.height,
                    opacity: isHovering ? 0.8 : 1,
                    transition:
                      "left var(--motion-moderate) var(--motion-ease), top var(--motion-moderate) var(--motion-ease), width var(--motion-moderate) var(--motion-ease), height var(--motion-moderate) var(--motion-ease), opacity var(--motion-fast) var(--motion-ease)",
                  }}
                />
              )}

              {/* Hover pill. Permanently mounted (see hoverPillRect above) so
                  its fade-out has a rect to sit at instead of unmounting. */}
              {hoverPillRect && (
                <div
                  className={cn("absolute bg-active pointer-events-none", shape.bg)}
                  style={{
                    left: hoverPillRect.left,
                    width: hoverPillRect.width,
                    top: hoverPillRect.top,
                    height: hoverPillRect.height,
                    opacity: isHoverPillVisible ? 0.4 : 0,
                    transition: isHoverPillVisible
                      ? "left var(--motion-fast) var(--motion-ease), top var(--motion-fast) var(--motion-ease), width var(--motion-fast) var(--motion-ease), height var(--motion-fast) var(--motion-ease), opacity var(--motion-fast) var(--motion-ease)"
                      : "left var(--motion-moderate) var(--motion-ease), top var(--motion-moderate) var(--motion-ease), width var(--motion-moderate) var(--motion-ease), height var(--motion-moderate) var(--motion-ease), opacity var(--motion-fast-exit) var(--motion-ease)",
                  }}
                />
              )}

              {/* Focus ring. Permanently mounted like the hover pill; opacity
                  snaps to 1 instantly on the way in (matching the old
                  initial={false}) and fades over motion-fast-exit on the way
                  out, frozen at the last focused rect. */}
              {focusPillRect && (
                <div
                  className={cn("absolute pointer-events-none z-20 border border-[color:var(--focus-ring,#6B97FF)]", shape.focusRing)}
                  style={{
                    left: focusPillRect.left - 2,
                    top: focusPillRect.top - 2,
                    width: focusPillRect.width + 4,
                    height: focusPillRect.height + 4,
                    opacity: focusRect ? 1 : 0,
                    transition: `left var(--motion-fast) var(--motion-ease), top var(--motion-fast) var(--motion-ease), width var(--motion-fast) var(--motion-ease), height var(--motion-fast) var(--motion-ease), opacity ${focusRect ? "0ms" : "var(--motion-fast-exit)"} var(--motion-ease)`,
                  }}
                />
              )}

              {children}
            </Tabs.List>
          }
        />
      </TabsSubtleContext.Provider>
    );

    // A size prop pins every tab to one ladder step.
    return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
  }
);

TabsSubtle.displayName = "TabsSubtle";

interface TabsSubtleItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: IconComponent;
  label: string;
  index: number;
}

const TabsSubtleItem = forwardRef<HTMLButtonElement, TabsSubtleItemProps>(
  ({ icon: Icon, label, index, className, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement | null>(null);
    // The collapsing label transitions to a MEASURED layout width, not CSS
    // "auto" (browsers can't transition to/from auto). offsetWidth and
    // ResizeObserver read layout space, so the measurement is immune to an
    // ancestor's transform (e.g. /demo's scaled card) — same setup as the
    // accordions' height animation.
    const [labelWidth, setLabelWidth] = useState<number | null>(null);
    const labelRoRef = useRef<ResizeObserver | null>(null);
    const measureLabel = useCallback((el: HTMLSpanElement | null) => {
      labelRoRef.current?.disconnect();
      labelRoRef.current = null;
      if (!el) return;
      const update = () => setLabelWidth(el.offsetWidth);
      update();
      labelRoRef.current = new ResizeObserver(update);
      labelRoRef.current.observe(el);
    }, []);
    const shape = useShape();
    const sizeClasses = useSize();
    const { registerTab, hoveredIndex, selectedIndex, idPrefix, activeLabel } =
      useTabsSubtle();

    useEffect(() => {
      registerTab(index, internalRef.current);
      return () => registerTab(index, null);
    }, [index, registerTab]);

    const isSelected = selectedIndex === index;
    const isActive = hoveredIndex === index || isSelected;
    const collapseLabel = activeLabel && !!Icon;
    const showLabel = !collapseLabel || isSelected;

    const labelContent = (
      // Both stacked spans carry the text-box trim so the invisible bold
      // sizer and the visible label keep identical boxes.
      <span
        ref={measureLabel}
        className={cn("inline-grid whitespace-nowrap", sizeClasses.text)}
      >
        <span
          className="col-start-1 row-start-1 invisible [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: fontWeights.semibold }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
          style={{
            fontVariationSettings: isSelected
              ? fontWeights.semibold
              : fontWeights.normal,
          }}
        >
          {label}
        </span>
      </span>
    );

    return (
      // Base UI Tab renders a native <button type="button"> and wires
      // role="tab", aria-selected, roving tabindex, and activation for us.
      // id/aria-controls are only overridden when an idPrefix is supplied so
      // externally rendered TabsSubtlePanel elements stay linked.
      <Tabs.Tab
        ref={(node: HTMLElement | null) => {
          const button = node as HTMLButtonElement | null;
          internalRef.current = button;
          if (typeof ref === "function") ref(button);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = button;
        }}
        value={index}
        data-proximity-index={index}
        id={idPrefix ? `${idPrefix}-tab-${index}` : undefined}
        aria-controls={idPrefix ? `${idPrefix}-panel-${index}` : undefined}
        aria-label={collapseLabel && !showLabel ? label : undefined}
        className={cn(
          // Fixed heights (was py-2 around a 19.5px line box ≈ 35.5px) so the
          // text-box trim on the label doesn't shrink the tab. Standalone
          // pills sit directly on the ladder's control height.
          "relative z-10 flex items-center cursor-pointer bg-transparent border-none outline-none",
          sizeClasses.control,
          sizeClasses.px,
          !collapseLabel && sizeClasses.gap,
          shape.bg,
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={sizeClasses.icon}
            strokeWidth={isActive ? 2 : 1.5}
            className={cn(
              "shrink-0 transition-[color,stroke-width] duration-80",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          />
        )}
        {collapseLabel ? (
          <span
            className="overflow-hidden"
            style={{
              // Until the measurement lands, let CSS resolve the true layout
              // width instead of animating toward a guessed number — under a
              // scaled ancestor (the /demo card, ~1.76x) a premature target
              // would be wrong and then jump when the real measurement
              // arrives.
              width: !showLabel ? 0 : labelWidth == null ? "auto" : labelWidth,
              opacity: showLabel ? 1 : 0,
              // Matches the ladder's icon-to-label gap (gap-2 / gap-1.5).
              marginLeft: showLabel ? (sizeClasses.variant === "compact" ? 6 : 8) : 0,
              transition:
                "width var(--motion-fast) var(--motion-ease), opacity var(--motion-fast-exit) var(--motion-ease), margin-left var(--motion-fast) var(--motion-ease)",
            }}
            aria-hidden={!showLabel || undefined}
          >
            {labelContent}
          </span>
        ) : (
          labelContent
        )}
      </Tabs.Tab>
    );
  }
);

TabsSubtleItem.displayName = "TabsSubtleItem";

interface TabsSubtlePanelProps extends HTMLAttributes<HTMLDivElement> {
  index: number;
  selectedIndex: number;
  idPrefix: string;
  children: ReactNode;
}

// Rendered outside <TabsSubtle> at every call site, so it cannot use Base UI's
// Tabs.Panel (which requires the Tabs.Root context). It stays a plain tabpanel
// linked to its tab through the shared idPrefix.
const TabsSubtlePanel = forwardRef<HTMLDivElement, TabsSubtlePanelProps>(
  ({ index, selectedIndex, idPrefix, children, className, ...props }, ref) => {
    const isSelected = selectedIndex === index;

    return (
      <div
        ref={ref}
        id={`${idPrefix}-panel-${index}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${index}`}
        hidden={!isSelected}
        tabIndex={-1}
        className={cn("outline-none", className)}
        {...props}
      >
        {isSelected && children}
      </div>
    );
  }
);

TabsSubtlePanel.displayName = "TabsSubtlePanel";

export { TabsSubtle, TabsSubtleItem, TabsSubtlePanel };
export default TabsSubtle;
