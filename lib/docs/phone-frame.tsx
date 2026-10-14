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
        "relative mx-auto w-[316px] rounded-[52px] bg-neutral-950 p-2 shadow-xl ring-1 ring-black/10 dark:ring-white/10",
        className
      )}
    >
      <div className="relative flex h-[640px] w-[300px] flex-col overflow-hidden rounded-[44px] bg-background">
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
            iOS Safari, which clipped the bar to a strip mid-screen. Explicit
            height so the scroller's `h-full` resolves. */}
        <div className="relative h-[610px] [&_[data-slot=bottom-nav]]:absolute">
          {/* iOS's scroll indicator (globals.css §4, `.scrollbar-ios`): the
              screen scrolls, and should look like the phone it is drawn as. */}
          <div ref={screenRef} className="scrollbar-ios h-full overflow-y-auto pt-12">
            {children}
          </div>
        </div>
        <div className="flex h-[30px] shrink-0 items-end justify-center bg-background pb-2">
          <span aria-hidden className="h-1 w-[110px] rounded-full bg-foreground/80" />
        </div>
      </div>
    </div>
  );
}

export { PhoneFrame };
