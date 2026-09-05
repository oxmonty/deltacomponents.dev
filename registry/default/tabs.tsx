"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";

type TabVariant = "default" | "underline" | "ghost";
type TabSize = "sm" | "default" | "lg";

interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/** Where the sliding indicator currently sits, in the list's own coordinates. */
interface Rect {
  left: number;
  width: number;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabVariant;
  size: TabSize;
  indicatorThickness?: string;
  indicatorClassName?: string;
  concentric: boolean;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  tabRefs: React.RefObject<(HTMLButtonElement | null)[]>;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("useTabs must be used within a Tabs component");
  return context;
}

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  variant?: TabVariant;
  size?: TabSize;
  /** Override the underline indicator thickness (e.g. "2px", "4px"). */
  indicatorThickness?: string;
  /** Override the active indicator's background (e.g. "bg-muted"). */
  indicatorClassName?: string;
  /** Nest the radii: the list takes the shape system's container radius, the
   *  triggers its element radius. The two differ by exactly the list's 4px
   *  padding in both `rounded` and `pill`, so the corners stay concentric
   *  whichever the reader picks — see the note on `radii` below. */
  concentric?: boolean;
}

function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  variant = "default",
  size = "default",
  indicatorThickness,
  indicatorClassName,
  concentric = false,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const activeTab = value ?? internalValue;
  const setActiveTab = React.useCallback(
    (id: string) => {
      if (value === undefined) setInternalValue(id);
      onValueChange?.(id);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider
      value={{
        activeTab,
        setActiveTab,
        variant,
        size,
        indicatorThickness,
        indicatorClassName,
        concentric,
        hoveredIndex,
        setHoveredIndex,
        activeIndex,
        setActiveIndex,
        tabRefs,
      }}
    >
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

const listHeight: Record<TabSize, string> = {
  sm: "h-8",
  default: "h-10",
  lg: "h-12",
};

const hoverHeight: Record<TabSize, string> = {
  sm: "h-6",
  default: "h-7",
  lg: "h-9",
};

const hoverOffset: Record<TabSize, string> = {
  sm: "-1px",
  default: "-2px",
  lg: "-3px",
};

const underlineThickness: Record<TabSize, string> = {
  sm: "h-[2px]",
  default: "h-[3px]",
  lg: "h-[4px]",
};

const indicatorHeight: Record<TabSize, string> = {
  sm: "h-6",
  default: "h-8",
  lg: "h-10",
};

/** Outer (list) and inner (trigger, indicator) radius classes.
 *
 *  Both come from the shape system rather than fixed pixels, so the Radius
 *  control in the docs — and any consumer's own ShapeProvider — moves the tabs
 *  with everything else. The concentric pair works out because `container` sits
 *  exactly 4px above `bg` in both shapes (12/8 rounded, 24/20 pill) and 4px is
 *  the list's padding: outer = inner + padding, which is the whole rule. */
function radii(shape: ReturnType<typeof useShape>, concentric: boolean) {
  return { outer: concentric ? shape.container : shape.bg, inner: shape.bg };
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  const {
    variant,
    size,
    hoveredIndex,
    activeIndex,
    tabRefs,
    concentric,
    indicatorThickness,
    indicatorClassName,
  } = useTabs();
  const shape = useShape();
  const { outer, inner } = radii(shape, concentric);

  const [hoverRect, setHoverRect] = React.useState<Rect | null>(null);
  const [activeRect, setActiveRect] = React.useState<Rect | null>(null);

  // The rect is kept after the pointer leaves so the wash can fade out where it
  // stood. Clearing it would unmount the element and make the wash vanish.
  React.useEffect(() => {
    if (hoveredIndex === null || variant !== "underline") return;
    const el = tabRefs.current[hoveredIndex];
    if (el) setHoverRect({ left: el.offsetLeft, width: el.offsetWidth });
  }, [hoveredIndex, variant, tabRefs]);

  const hoverVisible = variant === "underline" && hoveredIndex !== null;

  // The indicator tracks the active trigger's box. Measured after layout
  // rather than from a ref during render, because the triggers register
  // themselves as they mount and a width read during the first pass is zero.
  React.useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) setActiveRect({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIndex, tabRefs, size, variant]);

  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "text-muted-foreground relative inline-flex items-center",
        listHeight[size],
        variant === "default" && ["bg-muted w-fit justify-center p-1", outer],
        variant === "ghost" && "w-fit justify-center gap-1 bg-transparent p-0",
        variant === "underline" &&
          "border-border w-full justify-start gap-0 border-b",
        className
      )}
    >
      {/* Underline's hover wash: instant under the pointer (hover is the highest
          -frequency interaction there is — an entrance animation on it would
          replay its attention cost on every pass), sliding between triggers on
          the selection's tier, and fading out where it stood rather than
          snapping away. */}
      {variant === "underline" && hoverRect && (
        <motion.div
          className={cn("bg-muted absolute z-0", hoverHeight[size], inner)}
          initial={false}
          animate={{
            left: hoverRect.left,
            width: hoverRect.width,
            opacity: hoverVisible ? 1 : 0,
          }}
          transition={{ ...spring.moderate, opacity: { duration: 0.08 } }}
          style={{
            top: `calc(50% + ${hoverOffset[size]})`,
            translateY: "-50%",
          }}
          aria-hidden="true"
        />
      )}

      {(variant === "default" || variant === "ghost") && activeRect && (
        <motion.div
          className={cn(
            "absolute z-0",
            indicatorClassName ||
              (variant === "ghost" ? "bg-muted" : "bg-background"),
            indicatorHeight[size],
            inner,
            variant === "default" && "shadow-sm"
          )}
          // initial={false} so the indicator is simply *there* on first paint
          // instead of flying in from the left edge on mount.
          initial={false}
          animate={{ left: activeRect.left, width: activeRect.width }}
          transition={spring.moderate}
          aria-hidden="true"
        />
      )}

      {variant === "underline" && activeRect && (
        <motion.div
          className={cn(
            "bg-foreground absolute bottom-0 z-10",
            !indicatorThickness && underlineThickness[size]
          )}
          initial={false}
          animate={{ left: activeRect.left, width: activeRect.width }}
          transition={spring.moderate}
          style={{ height: indicatorThickness || undefined }}
          aria-hidden="true"
        />
      )}

      {children}
    </div>
  );
}

// 13px is the control-label step the size system uses everywhere (see
// `size-context`). `lg` steps the type up as well as the box — `text-body` is
// 13px in this ladder, the same as `text-caption`, so leaving it there gave the
// large variant a taller row with a label no bigger than the small one's.
const triggerSize: Record<TabSize, string> = {
  sm: "h-7 px-2.5 py-1 text-[13px]",
  default: "h-8 px-2.5 py-1.5 text-[13px]",
  lg: "h-10 px-3.5 py-2 text-subtitle",
};

const underlineTriggerSize: Record<TabSize, string> = {
  sm: "h-9 px-2.5 pt-2 pb-2.5 text-[13px]",
  default: "h-10 px-3 pt-2 pb-3 text-[13px]",
  lg: "h-12 px-4 pt-2.5 pb-4 text-subtitle",
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, className, disabled = false, icon }, forwardedRef) => {
    const {
      activeTab,
      setActiveTab,
      variant,
      size,
      concentric,
      setHoveredIndex,
      setActiveIndex,
      tabRefs,
    } = useTabs();
    const shape = useShape();
    const { inner } = radii(shape, concentric);
    const isActive = activeTab === value;
    const indexRef = React.useRef(-1);

    const setTabRef = React.useCallback(
      (el: HTMLButtonElement | null) => {
        if (el) {
          const existing = tabRefs.current.indexOf(el);
          if (existing === -1) {
            indexRef.current = tabRefs.current.length;
            tabRefs.current.push(el);
          } else {
            indexRef.current = existing;
          }
        }

        if (typeof forwardedRef === "function") forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      },
      [tabRefs, forwardedRef]
    );

    React.useEffect(() => {
      if (isActive && indexRef.current >= 0) setActiveIndex(indexRef.current);
    }, [isActive, setActiveIndex]);

    return (
      <button
        ref={setTabRef}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-disabled={disabled}
        disabled={disabled}
        data-state={isActive ? "active" : "inactive"}
        data-slot="tabs-trigger"
        data-value={value}
        onClick={() => {
          if (disabled) return;
          setActiveTab(value);
          setActiveIndex(indexRef.current);
        }}
        onMouseEnter={() =>
          variant === "underline" && setHoveredIndex(indexRef.current)
        }
        onMouseLeave={() => variant === "underline" && setHoveredIndex(null)}
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap",
          "transition-colors duration-80",
          // Ring on the element, no offset: Button's treatment, and inside the
          // list's 4px tray an offset ring would spill over the tray's edge.
          "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          "disabled:pointer-events-none disabled:opacity-50",
          inner,
          (variant === "default" || variant === "ghost") && [
            triggerSize[size],
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
            underlineTriggerSize[size],
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
);

TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  /** Keep every panel in the DOM. Costs nothing to switch and leaves the
   *  content readable by crawlers, at the price of rendering it all up front. */
  forceMount?: boolean;
  /** Fade the panel in on entry. Off by default: for heavy panels the fade is
   *  the thing that makes a tab switch feel slow. */
  animate?: boolean;
  /** Rise this many pixels on entry. */
  animateY?: number;
  /** Overrides `animate` when set explicitly. */
  animateOpacity?: boolean;
}

function TabsContent({
  value,
  children,
  className,
  forceMount = false,
  animate = false,
  animateY,
  animateOpacity,
}: TabsContentProps) {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;
  const shouldFade = animateOpacity ?? animate;
  const hasAnimation = animateY !== undefined || shouldFade;

  if (!forceMount && !isActive) return null;

  const panelProps = {
    role: "tabpanel",
    "data-state": isActive ? "active" : "inactive",
    "data-slot": "tabs-content",
    className: cn(
      "mt-2 outline-none",
      "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
      !isActive && forceMount && "hidden",
      className
    ),
    tabIndex: 0,
  } as const;

  if (!hasAnimation) return <div {...panelProps}>{children}</div>;

  // The motion props go on the panel itself, never on a wrapper: a wrapper
  // would have to be `display: contents` to stay out of the layout, and an
  // element with no box takes neither opacity nor transform — the animation
  // would be written to the DOM and paint nothing.
  //
  // Enters on `moderate`, the tier the indicator that sent it uses. `animate`
  // (not just `initial`) carries the state so a forceMount panel, which never
  // remounts, still fades between active and inactive.
  return (
    <motion.div
      {...panelProps}
      initial={{ opacity: shouldFade ? 0 : 1, y: animateY ?? 0 }}
      animate={{
        opacity: shouldFade && !isActive ? 0 : 1,
        y: isActive ? 0 : (animateY ?? 0),
      }}
      transition={spring.moderate}
    >
      {children}
    </motion.div>
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
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
  type TabsFromArrayProps,
};
