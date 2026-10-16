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
  /** Fade the page into the background colour through the bar's top
   *  rather than ending it at a hard edge. */
  gradient?: boolean;
  /** How far the bar gives way to the page, 0 to 1. 0 is a solid bar; 0.5
   *  turns solid at the icons' bottom edge, so the page shows through behind
   *  them; past that the bar itself thins out, until at 1 nothing is drawn
   *  but the items. It never reaches above the bar, and the bar's own box
   *  never changes with it. */
  fade?: number;
  /** What an item with an `href` renders as. `"a"` by default; a Next app
   *  passes `Link` here once to keep client-side routing and prefetching. */
  linkComponent?: React.ElementType;
}

function BottomNav({
  value,
  onValueChange,
  labels = true,
  gradient = true,
  fade = 0.5,
  linkComponent = "a",
  className,
  style,
  children,
  ...props
}: BottomNavProps) {
  const contextValue = React.useMemo<BottomNavContextValue>(
    () => ({ value, onValueChange, labels, LinkComponent: linkComponent }),
    [value, onValueChange, labels, linkComponent]
  );

  // Two halves of one dial. Up to 0.5 the fade reaches further down the bar,
  // to the icons' bottom edge; past it the reach stays there and the colour
  // itself thins out, so at 1 the bar draws nothing but its items.
  const dial = Math.min(Math.max(fade, 0), 1);
  const reach = Math.min(dial, 0.5) * 2;
  const strength = Math.min(1, (1 - dial) * 2);

  return (
    <BottomNavContext.Provider value={contextValue}>
      <nav
        data-slot="bottom-nav"
        {...props}
        // The icons' bottom edge: the bar's 4px padding, the item's (8px
        // with labels, 12px without) and the 24px glyph.
        style={
          {
            "--bottom-nav-fade": `${reach * (labels ? 36 : 40)}px`,
            "--bottom-nav-bg": `color-mix(in srgb, var(--background) ${strength * 100}%, transparent)`,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          // No breakpoint of its own: the layout that mounts it decides where
          // it hides (`md:hidden`), which is also what lets a demo show it on
          // a desktop inside a phone-sized frame.
          // Bottom padding is the home-indicator inset when there is one and
          // the same 4px as the top otherwise. The fade is painted inside
          // this box, so lengthening it never changes it.
          "fixed inset-x-0 bottom-0 z-50 pt-1 pb-[max(env(safe-area-inset-bottom,0px),0.25rem)]",
          // The fade runs from the bar's top edge, never above it: clear
          // there, solid at --bottom-nav-fade, eased through the stops between
          // (15%, 40%, 60%, 80% at 1/9, 2/9, 3/9, 5/9 of the way) so it
          // builds quickly and settles gently rather than ramping evenly.
          gradient
            ? "bg-[linear-gradient(transparent,color-mix(in_srgb,var(--bottom-nav-bg)_15%,transparent)_calc(var(--bottom-nav-fade)/9),color-mix(in_srgb,var(--bottom-nav-bg)_40%,transparent)_calc(var(--bottom-nav-fade)*2/9),color-mix(in_srgb,var(--bottom-nav-bg)_60%,transparent)_calc(var(--bottom-nav-fade)/3),color-mix(in_srgb,var(--bottom-nav-bg)_80%,transparent)_calc(var(--bottom-nav-fade)*5/9),var(--bottom-nav-bg)_var(--bottom-nav-fade))]"
            : "bg-background",
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

type BottomNavLabelProps = React.ComponentProps<"span">;

/** The caption under an icon. An item wraps plain children in one of these
 *  itself; pass one explicitly to restyle it (its spacing, its size) for
 *  that item. */
function BottomNavLabel({ className, ...props }: BottomNavLabelProps) {
  return (
    <span
      data-slot="bottom-nav-label"
      className={cn("mt-1.5 truncate text-center text-[10px] leading-tight font-medium", className)}
      {...props}
    />
  );
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

  // Children are the label: either a ready-made BottomNavLabel, kept as is,
  // or text to wrap in one. The bare text is also what an icon-only bar
  // gives a screen reader.
  const isLabelElement =
    React.isValidElement<BottomNavLabelProps>(children) && children.type === BottomNavLabel;
  const labelText = isLabelElement ? children.props.children : children;
  const label = isLabelElement ? children : children ? <BottomNavLabel>{children}</BottomNavLabel> : null;

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
          // h-full: the row stretches every item to the tallest, and this is
          // what centres each one's glyph in that height rather than at the
          // top of its own.
          "group/item flex h-full w-full cursor-pointer flex-col items-center justify-center px-1",
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
            the thumb is the acknowledgement before the route changes.
            Button's press, exactly: the `scale` property (what `scale-*`
            sets — transitioning `transform` leaves it snapping), in on the
            moderate tier and out a tier quicker, to 0.9 and no deeper, on
            its own compositor layer so the glyph is scaled as a cached
            raster rather than re-rasterised and pixel-snapped every frame. */}
        <span
          className={cn(
            "pointer-events-none flex flex-col items-center will-change-transform",
            "transition-[scale] [transition-duration:var(--motion-moderate-exit)] ease-spring",
            "group-active/item:scale-90 group-active/item:[transition-duration:var(--motion-moderate)]"
          )}
        >
          {icon && (
            <span
              data-slot="bottom-nav-icon"
              // inline-flex, not inline: the slot hugs the glyph rather than
              // sitting it on a text baseline with line-height slack under
              // it, which shows the moment the slot is given a background.
              className="inline-flex [&_svg]:size-6 [&_svg]:stroke-[1.5] [&_svg]:pointer-events-none"
            >
              {icon}
            </span>
          )}
          {labels && label}
        </span>
        {/* Icon-only bars still name every item for a screen reader. */}
        {!labels && labelText && <span className="sr-only">{labelText}</span>}
      </Element>
    </li>
  );
}

export {
  BottomNav,
  BottomNavItem,
  BottomNavLabel,
  type BottomNavProps,
  type BottomNavItemProps,
  type BottomNavLabelProps,
};
