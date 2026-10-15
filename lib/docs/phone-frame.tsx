"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/registry/lib/utils";

/**
 * A CSS-only mock of an iPhone Pro Max in portrait, for demos that need a
 * phone-sized viewport rather than the full doc page width.
 */
function PhoneFrame({
  route,
  children,
  className,
}: {
  /** Whatever the demo treats as its current page. The frame plays the
   *  router: when this changes the screen jumps to the top, the way a real
   *  navigation lands a new page. */
  route?: string;
  children: ReactNode;
  className?: string;
}) {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: 0 });
  }, [route]);

  return (
    <div
      className={cn(
        // Full width up to the phone's own, so the frame shrinks with a
        // narrow container (the showcase card on a phone) rather than
        // overflowing it.
        // No drop shadow: the showcase card clips the frame, and a shadow
        // cut off at the clip reads as a smear.
        "relative mx-auto w-full max-w-[316px] rounded-[52px] bg-neutral-950 p-2 ring-1 ring-black/10 dark:ring-white/10",
        className
      )}
    >
      <div className="relative h-[640px] w-full overflow-hidden rounded-[44px] bg-background">
        <div
          aria-hidden
          className="absolute top-2 left-1/2 z-10 h-[26px] w-[90px] -translate-x-1/2 rounded-full bg-neutral-950"
        />
        {/* The bar is `position: fixed` in the wild. Here the frame pins it
            to this box instead by making it absolute — this box is the
            nearest positioned ancestor, so it sits at the box's bottom and
            stays there while the (static) scroller underneath moves. Plain
            positioning on purpose: `contain: paint` as a fixed-position
            containing block looked right in every desktop engine and broke on
            iOS Safari, which clipped the bar to a strip mid-screen. The bar's
            bottom padding is pinned too: it reads the real safe-area inset,
            which on a phone grows as the browser's toolbar hides, but the
            bar should not move for the toolbar of the page it is pictured
            on. 24px is the home-indicator inset at this scale, so the bar
            runs to the screen's bottom edge with the indicator drawn over
            it, as on the phone — a blurred bar blurs that strip too. */}
        <div className="relative h-full [&_[data-slot=bottom-nav]]:absolute [&_[data-slot=bottom-nav]]:pb-6">
          {/* iOS's scroll indicator (globals.css §4, `.scrollbar-ios`): the
              screen scrolls, and should look like the phone it is drawn as. */}
          {/* A classic scrollbar takes its width out of the content box and
              nudges everything left of the screen's centre; reserving the
              same gutter on both edges keeps the feed centred. Overlay
              scrollbars reserve nothing, so this costs them nothing. */}
          <div
            ref={screenRef}
            className="scrollbar-ios h-full overflow-y-auto pt-12 [scrollbar-gutter:stable_both-edges]"
          >
            {children}
          </div>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-1/2 z-[60] h-1 w-[110px] -translate-x-1/2 rounded-full bg-foreground/80"
        />
      </div>
    </div>
  );
}

export { PhoneFrame };
