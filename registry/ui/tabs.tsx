"use client";

import * as React from "react";

import { cn } from "@/registry/lib/utils";
import { useSurface } from "@/registry/lib/surface-context";
import { surfaceClasses } from "@/registry/lib/surface-classes";

type TabVariant = "default" | "underline" | "ghost";
type TabSize = "sm" | "default" | "lg";
type ActivationMode = "automatic" | "manual";

interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabVariant;
  size: TabSize;
  indicatorClassName?: string;
  concentric: boolean;
  activationMode: ActivationMode;
  baseId: string;
  /** Keyed by trigger `value`, not position — populated and cleaned up from
   *  each trigger's ref callback. Nothing reads triggers by index anymore, so
   *  a conditionally-rendered or reordered tab can't leave a stale slot or
   *  point the indicator at the wrong element. */
  triggerElements: Map<string, HTMLButtonElement>;
  /** Values that have been the active tab at least once. A panel mounts the
   *  first time it appears here and then stays mounted (see `TabsContent`). */
  activatedTabs: Set<string>;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("useTabs must be used within a Tabs component");
  return context;
}

interface TabsProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabVariant;
  size?: TabSize;
  /** Override the active indicator's classes — its background, or the
   *  underline bar's thickness (e.g. `h-0.5`). Merges over the defaults, so
   *  only the utilities that actually conflict (bg-*, h-*, …) are replaced. */
  indicatorClassName?: string;
  /** Nest the radii: the list takes the shape system's container radius, the
   *  triggers its element radius. The two differ by exactly the list's 4px
   *  padding in both `rounded` and `pill`, so the corners stay concentric
   *  whichever the reader picks — see the note on `radii` below. */
  concentric?: boolean;
  /** `automatic` (default) selects a tab as the arrow keys move focus onto
   *  it, per the WAI-ARIA Tabs pattern. `manual` only moves focus; the reader
   *  commits with Enter/Space. Use `manual` when selecting a tab has a cost
   *  (e.g. it fires a request) that shouldn't happen for every tab arrowed
   *  past on the way to the one they want. */
  activationMode?: ActivationMode;
}

function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  variant = "default",
  size = "default",
  indicatorClassName,
  concentric = false,
  activationMode = "automatic",
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const baseId = React.useId();
  const triggerElements = React.useRef<Map<string, HTMLButtonElement>>(new Map()).current;
  const activatedTabs = React.useRef<Set<string>>(new Set()).current;

  const activeTab = value ?? internalValue;
  const setActiveTab = React.useCallback(
    (id: string) => {
      if (value === undefined) setInternalValue(id);
      onValueChange?.(id);
    },
    [value, onValueChange]
  );

  const contextValue = React.useMemo<TabsContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      variant,
      size,
      indicatorClassName,
      concentric,
      activationMode,
      baseId,
      triggerElements,
      activatedTabs,
    }),
    [
      activeTab,
      setActiveTab,
      variant,
      size,
      indicatorClassName,
      concentric,
      activationMode,
      baseId,
      triggerElements,
      activatedTabs,
    ]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/* Size presets. Each one sets only the LIST's box and type; everything inside
 * derives from that — the triggers stretch to the list's height, the indicator
 * and the hover wash inset to its padding, and every label inherits its font
 * size.
 *
 * That is what makes `size` a preset rather than a separate axis:
 * `className="h-12 text-sm"` on TabsList moves the strip exactly the way a
 * size step does. Five per-part height tables made that impossible — an `h-*`
 * from outside reached the list and nothing else, so the triggers stayed at
 * whatever literal their own table held and the strip came apart. */
// Box and type read the globals.css tokens with a fallback, the way Button
// does, so a strip stands exactly as tall as a button beside it on every step
// (sm 32, default 36, lg 40) and follows the compact scope with it. Type:
// `--control-text` is the 13px label step every control shares, and `lg` steps
// up to `--fs-subtitle` so its taller row does not carry the small one's label.
const listSize: Record<TabSize, string> = {
  sm: "h-[var(--control-h-sm,32px)] text-[length:var(--control-text,13px)]",
  default: "h-[var(--control-h,36px)] text-[length:var(--control-text,13px)]",
  lg: "h-[var(--control-h-lg,40px)] text-[length:var(--fs-subtitle,15px)]",
};

/* The one thing that cannot be derived: the underline's weight is a design
 * choice, not a function of the row's height. Override it through
 * `indicatorClassName`. */
const underlineThickness: Record<TabSize, string> = {
  sm: "h-[2px]",
  default: "h-[3px]",
  lg: "h-[4px]",
};

/** Outer (list) and inner (trigger, indicator) radius classes.
 *
 *  Both read the `--radius-*` custom properties in globals.css rather than
 *  fixed pixels, so the Radius control in the docs — and any consumer's own
 *  `data-radius` scope — moves the tabs with everything else. The concentric
 *  pair works out because `--radius-container` sits exactly 4px above
 *  `--radius-bg` in both shapes (12/8 rounded, 24/20 pill) and 4px is the
 *  list's padding: outer = inner + padding, which is the whole rule. */
function radii(concentric: boolean) {
  return {
    outer: concentric ? "rounded-[var(--radius-container,calc(var(--radius,0.5rem)_+_4px))]" : "rounded-[var(--radius-bg,var(--radius,0.5rem))]",
    inner: "rounded-[var(--radius-bg,var(--radius,0.5rem))]",
  };
}

// The indicator (and the hover wash) sit at 0,0 and read their real position
// from `--tab-x`/`--tab-w` (or `--tab-hover-x`/`--tab-hover-w`), written
// straight to the list's style from a layout effect and from pointer
// handlers — never through React state, so hovering or selecting a tab
// re-renders nothing and can't be stalled by a panel that's busy rendering.
// Both the transition and the indicator's own visibility are gated on
// `[data-placed=true]` on the list, set by the layout effect after its first
// run. So the indicator is simply *there* on first paint and only animates on
// subsequent moves — and the server-rendered markup, which has no measurement
// yet, doesn't paint a zero-width box whose ring reads as a sliver at the
// left edge until hydration.
const PLACED_TRANSITION =
  "group-data-[placed=true]/tabs:transition-[translate,width] group-data-[placed=true]/tabs:duration-(--motion-moderate) group-data-[placed=true]/tabs:ease-spring";

type TabsListProps = React.ComponentProps<"div">;

function TabsList({ children, className, ref, ...props }: TabsListProps) {
  const {
    activeTab,
    variant,
    size,
    concentric,
    indicatorClassName,
    activationMode,
    setActiveTab,
    triggerElements,
  } = useTabs();
  const { outer, inner } = radii(concentric);
  const substrate = useSurface();
  // bg two steps up so the pill clears the track in both themes; shadow one
  // step up so the chip stays quiet rather than reading as a popover.
  const pill = surfaceClasses(substrate + 2, substrate + 1);

  const listRef = React.useRef<HTMLDivElement>(null);
  const placedRef = React.useRef(false);

  // The list measures itself, so it needs its own ref — but a caller may want
  // one too (to scroll the strip, or measure it). Both get the node.
  const setListRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      listRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref]
  );

  // Re-measures the active trigger's box whenever it changes identity, and
  // keeps watching it (and the list) for as long as it stays active — a
  // resize from a web font loading, the container changing width, or a
  // relabel all move the trigger without a selection change to key off.
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const el = triggerElements.get(activeTab);
      if (!el) return;
      list.style.setProperty("--tab-x", `${el.offsetLeft}px`);
      list.style.setProperty("--tab-w", `${el.offsetWidth}px`);
      if (!placedRef.current) {
        placedRef.current = true;
        list.dataset.placed = "true";
      }
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    const activeEl = triggerElements.get(activeTab);
    if (activeEl) ro.observe(activeEl);
    return () => ro.disconnect();
  }, [activeTab, triggerElements]);

  // WAI-ARIA Tabs pattern: Left/Right move and wrap, Home/End jump to the
  // ends, disabled tabs are skipped. The order comes from the DOM at the
  // moment of the keypress rather than a stored array, so it's always right
  // even if tabs were reordered or added/removed since the last render.
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      const list = listRef.current;
      if (!list) return;
      const tabs = Array.from(
        list.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      ).filter((tab) => !tab.disabled);
      if (tabs.length === 0) return;

      e.preventDefault();
      // Keep the handled arrow from also reaching window-level listeners
      // (the docs site's ←/→ page navigation).
      e.stopPropagation();

      const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
      let next: HTMLButtonElement;
      if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      else {
        const delta = e.key === "ArrowRight" ? 1 : -1;
        const base = current === -1 ? 0 : current;
        next = tabs[(base + delta + tabs.length) % tabs.length];
      }

      next.focus();
      if (activationMode === "automatic") {
        const nextValue = next.dataset.value;
        if (nextValue) setActiveTab(nextValue);
      }
    },
    [activationMode, setActiveTab]
  );

  // Underline's hover wash: event-delegated on the list instead of wired to
  // each trigger, so it needs no registry of its own — the hovered element's
  // own offsetLeft/offsetWidth (relative to this list, its offsetParent) is
  // all the position it takes. Written straight to CSS custom properties, so
  // moving the pointer across the strip touches no React state.
  const handlePointerOver = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (variant !== "underline") return;
      const list = listRef.current;
      const tab = (e.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
      if (!list || !tab || tab.disabled) return;
      list.style.setProperty("--tab-hover-x", `${tab.offsetLeft}px`);
      list.style.setProperty("--tab-hover-w", `${tab.offsetWidth}px`);
      list.dataset.tabHover = "true";
    },
    [variant]
  );

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (variant !== "underline") return;
      // Mouse only. A touch pointer fires pointerleave the instant the finger
      // lifts, so on a phone the wash appeared and vanished inside the same
      // tap — invisible, which is the whole reason it looked like touch had no
      // press state at all. There it is dismissed by the next tap elsewhere
      // instead, so the tapped tab keeps its ground the way a native control
      // holds a press until you move on.
      if (e.pointerType !== "mouse") return;
      delete listRef.current?.dataset.tabHover;
    },
    [variant]
  );

  // The touch half of the above: a tap outside the strip puts the wash away.
  React.useEffect(() => {
    if (variant !== "underline") return;
    const dismiss = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const list = listRef.current;
      if (!list || list.contains(e.target as Node)) return;
      delete list.dataset.tabHover;
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [variant]);

  return (
    <div
      ref={setListRef}
      data-slot="tabs-list"
      role="tablist"
      onKeyDown={handleKeyDown}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
      {...props}
      className={cn(
        // items-stretch, not items-center: it is what makes every trigger
        // fill the list's height, so the list's `h-*` is the only height in
        // the strip and an override of it carries the triggers along.
        "text-muted-foreground group/tabs relative inline-flex items-stretch",
        listSize[size],
        variant === "default" && ["bg-muted w-fit justify-center p-1", outer],
        variant === "ghost" && "w-fit justify-center gap-1 bg-transparent p-0",
        variant === "underline" &&
          "border-border w-full justify-start gap-0 border-b",
        className
      )}
    >
      {/* Underline's hover wash: appears instantly under the pointer, slides
          between triggers on the moderate tier, and fades out where it stood
          rather than snapping away (hover is the highest-frequency
          interaction there is — an entrance animation on it would replay its
          attention cost on every pass). Zero width until the first hover, so
          it's invisible rather than misplaced before that. */}
      {variant === "underline" && (
        <div
          aria-hidden="true"
          data-slot="tabs-hover"
          className={cn(
            // Insets rather than a height table, so the wash follows whatever
            // height the list is given. The extra 2px at the bottom keeps it
            // clear of the underline bar it shares the row with.
            "bg-muted pointer-events-none absolute top-1 bottom-1.5 z-0 left-0",
            "w-(--tab-hover-w) translate-x-(--tab-hover-x) opacity-0",
            "group-data-[tab-hover=true]/tabs:opacity-100",
            PLACED_TRANSITION,
            inner
          )}
        />
      )}

      {(variant === "default" || variant === "ghost") && (
        <div
          aria-hidden="true"
          data-slot="tabs-indicator"
          className={cn(
            // inset-y-1 is the list's own 4px tray, so the pill tracks the
            // list's height instead of a table of its own.
            "absolute inset-y-1 z-0 left-0 w-(--tab-w) translate-x-(--tab-x)",
            "hidden group-data-[placed=true]/tabs:block",
            PLACED_TRANSITION,
            inner,
            variant === "ghost" ? "bg-muted" : pill,
            indicatorClassName
          )}
        />
      )}

      {variant === "underline" && (
        <div
          aria-hidden="true"
          data-slot="tabs-indicator"
          className={cn(
            "bg-foreground absolute bottom-0 z-10 left-0 w-(--tab-w) translate-x-(--tab-x)",
            "hidden group-data-[placed=true]/tabs:block",
            PLACED_TRANSITION,
            underlineThickness[size],
            indicatorClassName
          )}
        />
      )}

      {children}
    </div>
  );
}

// Padding only. The height comes from the list (the triggers stretch to it)
// and the label size is inherited, so a `text-*` or `h-*` on TabsList — or on
// one trigger — lands instead of losing to a literal written here.
const triggerPadding: Record<TabSize, string> = {
  sm: "px-2.5",
  default: "px-2.5",
  lg: "px-3.5",
};

// The underline's label rides high in its row so the bar has somewhere to sit,
// which is the one place vertical padding still does real work.
const underlineTriggerPadding: Record<TabSize, string> = {
  sm: "px-2.5 pt-2 pb-2.5",
  default: "px-3 pt-2 pb-3",
  lg: "px-4 pt-2.5 pb-4",
};

interface TabsTriggerProps extends React.ComponentProps<"button"> {
  value: string;
  icon?: React.ReactNode;
}

function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
  icon,
  onClick,
  ref,
  ...props
}: TabsTriggerProps) {
  const { activeTab, setActiveTab, variant, size, concentric, baseId, triggerElements } =
    useTabs();
  const { inner } = radii(concentric);
  const isActive = activeTab === value;

  // Registers this trigger by its value, not a mount-order index, so a
  // conditionally-rendered or reordered tab can't leave a stale slot behind
  // or drift the indicator to the wrong element. The cleanup (React 19 ref
  // callbacks may return one) removes it again on unmount.
  const setTabRef = React.useCallback<React.RefCallback<HTMLButtonElement>>(
    (el) => {
      if (el) triggerElements.set(value, el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
      return () => {
        triggerElements.delete(value);
        if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [value, triggerElements, ref]
  );

  return (
    <button
      ref={setTabRef}
      // Spread first: everything after it — role, the id the panel's
      // aria-labelledby points at, aria-selected, the roving tabindex — is
      // what makes this a tab rather than a button, and none of it is a
      // caller's to overwrite. Anything else (aria-label, data-*, onFocus)
      // still lands.
      {...props}
      id={`${baseId}-trigger-${value}`}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      aria-controls={`${baseId}-panel-${value}`}
      disabled={disabled}
      // Roving tabindex: only the selected trigger is in the Tab order —
      // Left/Right/Home/End (handled on the list) move focus among the rest.
      tabIndex={isActive ? 0 : -1}
      data-state={isActive ? "active" : "inactive"}
      data-slot="tabs-trigger"
      data-value={value}
      onClick={(event) => {
        if (disabled) return;
        setActiveTab(value);
        // After ours, not instead of it: spreading a caller's onClick over
        // the handler that selects the tab would leave the trigger inert.
        onClick?.(event);
      }}
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap",
        "transition-colors duration-80",
        // Ring on the element, no offset: Button's treatment, and inside the
        // list's 4px tray an offset ring would spill over the tray's edge.
        "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        "disabled:pointer-events-none disabled:opacity-50",
        inner,
        (variant === "default" || variant === "ghost") && [
          triggerPadding[size],
          // The visible pill is smaller than the row it sits in, which left
          // 4px of dead target above and below it. The pseudo-element takes
          // the hit area back out to the list's full height without touching
          // the pill — horizontal only at the edges, so neighbouring targets
          // never overlap.
          "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground/80",
        ],
        variant === "underline" && [
          underlineTriggerPadding[size],
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        ],
        className
      )}
    >
      <span className="relative z-10 flex items-center gap-1.5">
        {/* stroke-1.5 beside a medium label — the weight Button's icons rest
            at. Lucide's default 2 reads bolder than the text beside it. */}
        {icon && (
          <span className="shrink-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:stroke-[1.5]">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  );
}

interface TabsContentProps extends React.ComponentProps<"div"> {
  value: string;
  /** Render this panel from the first render instead of waiting for it to
   *  become active — for crawlers, or content that must exist up front. */
  forceMount?: boolean;
}

function TabsContent({
  value,
  children,
  className,
  forceMount = false,
  ...props
}: TabsContentProps) {
  const { activeTab, baseId, activatedTabs } = useTabs();
  const isActive = activeTab === value;

  // A panel mounts the first time it becomes active and then stays mounted —
  // hidden via the `hidden` attribute rather than unmounted, so a panel
  // backed by an API doesn't refetch (and flash empty) on every revisit.
  // `forceMount` mounts every panel up front instead of waiting for a visit.
  if (isActive) activatedTabs.add(value);
  if (!forceMount && !activatedTabs.has(value)) return null;

  return (
    <div
      {...props}
      id={`${baseId}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${baseId}-trigger-${value}`}
      // `inert` drops the panel from the accessibility tree and out of the
      // tab order the instant it goes inactive, regardless of how long the
      // fade-out that follows takes to finish painting.
      inert={!isActive || undefined}
      hidden={!isActive}
      data-state={isActive ? "active" : "inactive"}
      data-slot="tabs-content"
      tabIndex={0}
      className={cn(
        "mt-2 outline-none",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsFromArrayProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabVariant;
  size?: TabSize;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  children?: (tab: TabItem) => React.ReactNode;
}

/** The same tabs, driven by data rather than JSX — for a list that comes from
 *  a config or an API rather than being written out by hand. */
function TabsFromArray({
  tabs,
  defaultValue,
  value,
  onValueChange,
  variant,
  size,
  className,
  listClassName,
  triggerClassName,
  contentClassName,
  children,
}: TabsFromArrayProps) {
  return (
    <Tabs
      defaultValue={defaultValue ?? tabs[0]?.id}
      value={value}
      onValueChange={onValueChange}
      variant={variant}
      size={size}
      className={className}
    >
      <TabsList className={listClassName}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            icon={tab.icon}
            className={triggerClassName}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children &&
        tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className={contentClassName}>
            {children(tab)}
          </TabsContent>
        ))}
    </Tabs>
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsFromArray,
  type TabItem,
  type TabVariant,
  type TabSize,
  type ActivationMode,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
  type TabsFromArrayProps,
};
