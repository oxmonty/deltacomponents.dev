"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/registry/lib/utils";

type SwitchProps = SwitchPrimitive.Root.Props;

/** The track and thumb geometry, as custom properties so a consumer can
 *  resize the whole control from `style` (the docs' compact step does) and
 *  every derived value — the travel, the hover pill, the press squash —
 *  follows. The defaults are transitions.dev's toggle: a 44×22 track and a
 *  wide pill thumb inset 3.67px. */
const GEOMETRY = {
  "--switch-w": "44px",
  "--switch-h": "22px",
  "--switch-pad": "3.67px",
  "--switch-thumb-w": "22px",
  "--switch-thumb-h": "14.67px",
  "--switch-pill": "2px",
  "--switch-press": "4px",
  "--switch-overshoot": "1px",
} as React.CSSProperties;

function Switch({ className, style, onCheckedChange, ...props }: SwitchProps) {
  // The double bounce is a keyframe sequence, and a keyframe plays whenever
  // its selector matches — so with it attached from the start the "off"
  // sequence would run on mount. It is attached on the first change and
  // dropped again when it ends, which also hands `translate` back to the
  // transition below, so a hover that widens the thumb slides it rather
  // than snapping it.
  const [animate, setAnimate] = React.useState(false);

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-animate={animate || undefined}
      {...props}
      onCheckedChange={(checked, eventDetails) => {
        setAnimate(true);
        onCheckedChange?.(checked, eventDetails);
      }}
      style={{ ...GEOMETRY, ...style }}
      className={cn(
        "group/switch relative inline-flex h-(--switch-h) w-(--switch-w) shrink-0 cursor-pointer items-center rounded-full outline-none select-none",
        // Derived geometry. The thumb's live width and height start at the
        // resting ones; hover widens it into a pill, press widens it further
        // and squashes it, re-centred by half the lost height.
        "[--switch-travel:calc(var(--switch-w)-var(--switch-thumb-w)-2*var(--switch-pad))]",
        "[--switch-tw:var(--switch-thumb-w)] [--switch-th:var(--switch-thumb-h)] [--switch-top:var(--switch-pad)]",
        "hover:[--switch-tw:calc(var(--switch-thumb-w)+var(--switch-pill))]",
        "active:[--switch-tw:calc(var(--switch-thumb-w)+var(--switch-press))] active:[--switch-th:calc(var(--switch-thumb-h)-var(--switch-press))] active:[--switch-top:calc(var(--switch-pad)+var(--switch-press)/2)]",
        // A widening thumb stays pinned to the track's far edge when on, so
        // the travel gives back whatever width it gained.
        "[--switch-end:calc(var(--switch-travel)-(var(--switch-tw)-var(--switch-thumb-w)))]",
        // The target is the track plus 8px all round: a 22px-tall control
        // is under the 44px a thumb needs.
        "before:absolute before:-inset-2 before:content-['']",
        "bg-accent hover:bg-[color-mix(in_oklab,var(--accent),rgb(var(--overlay))_10%)]",
        "data-[checked]:bg-primary data-[checked]:hover:bg-primary/90",
        "transition-colors [transition-duration:var(--motion-fast,80ms)]",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        onAnimationEnd={() => setAnimate(false)}
        className={cn(
          "pointer-events-none absolute top-(--switch-top) left-(--switch-pad) block h-(--switch-th) w-(--switch-tw) rounded-full shadow-sm",
          // shadcn's scheme: on a dark page the resting thumb is light on
          // the muted track and dark on the primary one, or it vanishes.
          "bg-background dark:bg-foreground dark:group-data-[checked]/switch:bg-primary-foreground",
          "translate-x-0 group-data-[checked]/switch:translate-x-(--switch-end)",
          "transition-[translate,width,height,top] [transition-duration:var(--motion-moderate,160ms)] [transition-timing-function:var(--motion-ease,ease)]",
          // Thumb slides with a double bounce: past the end, back, settle.
          // transitions.dev's toggle, on the slow tier; the curve is its
          // own, the overshoot is in the keyframes.
          "group-data-[animate]/switch:group-data-[checked]/switch:animate-[switch-on_var(--motion-slow,240ms)_cubic-bezier(0.34,1.35,0.64,1)_both]",
          "group-data-[animate]/switch:group-data-[unchecked]/switch:animate-[switch-off_var(--motion-slow,240ms)_cubic-bezier(0.34,1.35,0.64,1)_both]"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch, type SwitchProps };
