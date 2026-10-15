"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/registry/lib/utils";

/**
 * A CSS-only mock of an iPhone 17 Pro Max in portrait, for demos that need a
 * phone-sized viewport rather than the full doc page width. Every dimension
 * derives from `--phone-w`, the screen's width, in the proportions measured
 * off the macOS Simulator: a 440×956pt screen, a 4px titanium rim round a
 * 7px bezel, the island, and the buttons either side. It is 344px wide from
 * `md` up and 300px below, where a phone-width page and the showcase card
 * have no room for more; a `className` of `md:[--phone-w:300px]` pins the
 * small one.
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
        "[--phone-w:300px] md:[--phone-w:344px]",
        "[--phone-rim:calc(var(--phone-w)*0.0117)] [--phone-pad:calc(var(--phone-w)*0.0204)] [--phone-r:calc(var(--phone-w)*0.148)]",
        // Full width up to the phone's own, so the frame shrinks with a
        // narrow container (the showcase card on a phone) rather than
        // overflowing it.
        // No drop shadow: the showcase card clips the frame, and a shadow
        // cut off at the clip reads as a smear.
        "relative mx-auto w-full max-w-[calc(var(--phone-w)+2*(var(--phone-rim)+var(--phone-pad)))] rounded-[calc(var(--phone-w)*0.166)] border-[length:var(--phone-rim)] border-[#3c3c3c] bg-[#141414] p-(--phone-pad)",
        className
      )}
    >
      {/* Action, volume up, volume down on the left; side button on the
          right. Placed as fractions of the body's height, lit from the body
          side and darker at the tip, as the Simulator draws them. Absolute
          offsets count from the padding edge, inside the rim, hence twice
          the rim to clear it. */}
      <span aria-hidden className="absolute top-[18%] left-[calc(-2*var(--phone-rim))] h-[3.2%] w-(--phone-rim) rounded-l-[2px] bg-linear-to-l from-[#5c5c5c] to-[#2b2b2b]" />
      <span aria-hidden className="absolute top-[26.9%] left-[calc(-2*var(--phone-rim))] h-[6.3%] w-(--phone-rim) rounded-l-[2px] bg-linear-to-l from-[#5c5c5c] to-[#2b2b2b]" />
      <span aria-hidden className="absolute top-[35.7%] left-[calc(-2*var(--phone-rim))] h-[6.3%] w-(--phone-rim) rounded-l-[2px] bg-linear-to-l from-[#5c5c5c] to-[#2b2b2b]" />
      <span aria-hidden className="absolute top-[29.5%] right-[calc(-2*var(--phone-rim))] h-[10.1%] w-(--phone-rim) rounded-r-[2px] bg-linear-to-r from-[#5c5c5c] to-[#2b2b2b]" />
      {/* clip-path as well as overflow: a `backdrop-filter` layer (a blurred
          bar) escapes an overflow clip's rounded corners in Chromium and
          pokes square corners out of the screen; the clip-path clips it. */}
      <div className="relative h-[calc(var(--phone-w)*956/440)] w-full overflow-hidden rounded-(--phone-r) bg-background [clip-path:inset(0_round_var(--phone-r))]">
        <div
          aria-hidden
          className="absolute top-[calc(var(--phone-w)*0.032)] left-1/2 z-10 h-[calc(var(--phone-w)*0.081)] w-[calc(var(--phone-w)*0.282)] -translate-x-1/2 rounded-full bg-black"
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
