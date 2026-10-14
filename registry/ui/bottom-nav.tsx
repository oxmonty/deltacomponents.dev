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
          "fixed inset-x-0 bottom-0 z-50 pt-1 pb-[env(safe-area-inset-bottom,4px)]",
          gradient
            ? "bg-linear-to-b from-transparent via-background/80 via-25% to-background to-45%"
            : "bg-background/85 backdrop-blur-lg",
          className
        )}
      >
        <ul data-slot="bottom-nav-list" className="flex items-stretch justify-around">
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
    // every iOS tab bar.
    if (isActive) {
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
          isActive ? "text-foreground" : "text-muted-foreground",
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
