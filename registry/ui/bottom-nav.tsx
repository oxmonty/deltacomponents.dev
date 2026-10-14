"use client";

import * as React from "react";

import { cn } from "@/registry/lib/utils";

interface BottomNavContextValue {
  value: string;
  onValueChange?: (value: string) => void;
  labels: boolean;
  LinkComponent: React.ElementType;
}

const BottomNavContext = React.createContext<BottomNavContextValue | null>(null);

function useBottomNav() {
  const context = React.useContext(BottomNavContext);
  if (!context) throw new Error("BottomNavItem must be used within a BottomNav");
  return context;
}

interface BottomNavProps
  extends Omit<React.ComponentProps<"nav">, "onChange" | "defaultValue"> {
  /** The active item's `value`. The nav never guesses this from the URL —
   *  hand it the router's current path (or any state) so it works the same
   *  under Next, Remix, Vite or a plain `<a>`. */
  value: string;
  onValueChange?: (value: string) => void;
  /** Caption under each icon. Off gives the icon-only bar. */
  labels?: boolean;
  /** Fade the page into the background colour behind the bar rather than
   *  sitting a solid blurred strip on top of it. */
  gradient?: boolean;
  /** What an item with an `href` renders as. `"a"` by default; a Next app
   *  passes `Link` here once to keep client-side routing and prefetching. */
  linkComponent?: React.ElementType;
}

function BottomNav({
  value,
  onValueChange,
  labels = true,
  gradient = true,
  linkComponent = "a",
  className,
  children,
  ...props
}: BottomNavProps) {
  const contextValue = React.useMemo<BottomNavContextValue>(
    () => ({ value, onValueChange, labels, LinkComponent: linkComponent }),
    [value, onValueChange, labels, linkComponent]
  );

  return (
    <BottomNavContext.Provider value={contextValue}>
      <nav
        data-slot="bottom-nav"
        {...props}
        className={cn(
          // No breakpoint of its own: the layout that mounts it decides where
          // it hides (`md:hidden`), which is also what lets a demo show it on
          // a desktop inside a phone-sized frame.
          // Bottom padding is the home-indicator inset when there is one and
          // the same 8px as the top otherwise (a browser toolbar sitting
          // under the bar zeroes the inset, and 4px there read as the labels
          // being crammed against it).
          "fixed inset-x-0 bottom-0 z-50 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)]",
          // The bar itself is always opaque, so the icons never have page
          // text showing through around them. The gradient is the strip
          // ABOVE it: the page dissolves into the background colour on its
          // way under the bar, as iOS does, rather than the bar being
          // see-through.
          gradient
            ? "bg-background before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-12 before:bg-linear-to-t before:from-background before:to-transparent"
            : "bg-background/85 backdrop-blur-lg",
          className
        )}
      >
        {/* Four or more items fill the bar, as iPhone's own tab bar does at
            any count. Fewer leave a thumb's width of nothing between them, so
            two or three are drawn in toward the middle. Material's
            navigation bar puts three destinations on 60% of the bar; that
            read as crowded at phone widths, so three take 72% here and two
            56%. Counted in CSS, so a conditionally rendered item needs no
            prop to say so. */}
        <ul
          data-slot="bottom-nav-list"
          className={cn(
            "flex items-stretch justify-around",
            "has-[li:nth-child(2):last-child]:px-[22%] has-[li:nth-child(3):last-child]:px-[14%]"
          )}
        >
          {children}
        </ul>
      </nav>
    </BottomNavContext.Provider>
  );
}

interface BottomNavItemProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onClick"> {
  value: string;
  /** With an `href` the item is a link (see `linkComponent`); without one it
   *  is a button, for an item that opens something rather than going
   *  somewhere, or a demo that must not change the page's route. */
  href?: string;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /** The label. */
  children?: React.ReactNode;
}

/** The nearest ancestor that scrolls, or the document. A bar pinned inside
 *  a scrolling panel sends that panel back to the top, not the page. */
function scrollParentOf(el: HTMLElement | null): Element | Window {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return window;
}

function BottomNavItem({
  value,
  href,
  icon,
  onClick,
  className,
  children,
  ...props
}: BottomNavItemProps) {
  const { value: activeValue, onValueChange, labels, LinkComponent } = useBottomNav();
  const isActive = activeValue === value;
  const itemRef = React.useRef<HTMLElement>(null);
  const Element: React.ElementType = href ? LinkComponent : "button";

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Re-tapping the tab you are on scrolls back to the top, as it does in
    // every iOS tab bar — and does not navigate: a link to the page you are
    // already on would reload it, or have the router scroll its first
    // element into view and cut the glide short.
    if (isActive) {
      event.preventDefault();
      scrollParentOf(itemRef.current).scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onValueChange?.(value);
  };

  return (
    <li className="min-w-0 flex-1">
      <Element
        ref={itemRef}
        {...props}
        href={href}
        type={href ? undefined : "button"}
        aria-current={isActive ? "page" : undefined}
        data-slot="bottom-nav-item"
        data-state={isActive ? "active" : "inactive"}
        onClick={handleClick}
        className={cn(
          "group/item flex w-full cursor-pointer flex-col items-center justify-center px-1",
          labels ? "py-2" : "py-3",
          // `touch-manipulation` drops the 300ms double-tap wait, so a tap is
          // answered the instant it lands rather than feeling ignored.
          "touch-manipulation select-none [-webkit-touch-callout:none]",
          "transition-colors duration-(--motion-fast) ease-spring",
          // Inactive sits a step under muted-foreground so the active item
          // reads at a glance, but no lower: 4.0:1 on light and 4.5:1 on
          // dark keeps the 10px labels legible (WCAG wants 4.5 for text,
          // 3 for the icons; iOS's own inactive gray is 3.1 on white).
          isActive
            ? "text-foreground"
            : "text-muted-foreground/85 dark:text-muted-foreground/75",
          "rounded-[var(--radius-bg,var(--radius,0.5rem))] outline-none",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          className
        )}
      >
        {/* The dip is on the glyph, not the whole target: a tap on a phone
            has no hover to confirm it landed, and the icon shrinking under
            the thumb is the acknowledgement before the route changes. */}
        <span
          className={cn(
            "pointer-events-none flex flex-col items-center",
            "transition-transform duration-(--motion-fast) ease-spring",
            "group-active/item:scale-[0.86]"
          )}
        >
          {icon && (
            <span
              data-slot="bottom-nav-icon"
              className="[&_svg]:size-6 [&_svg]:stroke-[1.5] [&_svg]:pointer-events-none"
            >
              {icon}
            </span>
          )}
          {labels && children && (
            <span
              data-slot="bottom-nav-label"
              className="mt-1 truncate text-center text-[10px] leading-tight font-medium"
            >
              {children}
            </span>
          )}
        </span>
        {/* Icon-only bars still name every item for a screen reader. */}
        {!labels && children && <span className="sr-only">{children}</span>}
      </Element>
    </li>
  );
}

export { BottomNav, BottomNavItem, type BottomNavProps, type BottomNavItemProps };
