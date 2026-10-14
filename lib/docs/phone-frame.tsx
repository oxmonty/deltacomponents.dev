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
        {/* `contain: paint` makes this the containing block for any `fixed`
            descendant, so BottomNav pins to the frame's content area instead
            of the real viewport, letting the demo use it exactly as a
            consumer would. The scroller is a child, not this box: a fixed
            element whose containing block is itself the scroller scrolls
            away with the content. */}
        <div className="relative min-h-0 flex-1 [contain:paint]">
          <div ref={screenRef} className="scrollbar-hide absolute inset-0 overflow-y-auto pt-12">
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
