"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/registry/lib/utils";

type SwitchSize = "sm" | "default" | "lg";

interface SwitchProps extends SwitchPrimitive.Root.Props {
  size?: SwitchSize;
}

/** The track and thumb geometry per size, as custom properties, so every
 *  derived value — the travel, the hover pill, the press squash — follows,
 *  and a consumer can still resize from `style`. The tracks are Ant
 *  Design's default (44×22) and small (28×16), and the default scaled by
 *  iOS's 51×31 proportion; the thumb is iOS 26's: a wide pill filling most
 *  of the track's height behind a thin inset, rather than a ball floating
 *  in it. */
const GEOMETRY: Record<SwitchSize, React.CSSProperties> = {
  sm: {
    "--switch-w": "28px",
    "--switch-h": "16px",
    "--switch-pad": "1.5px",
    "--switch-thumb-w": "17px",
    "--switch-thumb-h": "13px",
    "--switch-pill": "1px",
    "--switch-press": "2px",
    "--switch-overshoot": "1px",
  } as React.CSSProperties,
  default: {
    "--switch-w": "44px",
    "--switch-h": "22px",
    "--switch-pad": "2px",
    "--switch-thumb-w": "26px",
    "--switch-thumb-h": "18px",
    "--switch-pill": "2px",
    "--switch-press": "4px",
    "--switch-overshoot": "1px",
  } as React.CSSProperties,
  lg: {
    "--switch-w": "56px",
    "--switch-h": "28px",
    "--switch-pad": "2.5px",
    "--switch-thumb-w": "33px",
    "--switch-thumb-h": "23px",
    "--switch-pill": "3px",
    "--switch-press": "5px",
    "--switch-overshoot": "1.5px",
  } as React.CSSProperties,
};

function Switch({
  size = "default",
  className,
  style,
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked ?? false);
  const isChecked = checked ?? uncontrolledChecked;
  // The double bounce is a keyframe sequence, and a keyframe plays whenever
  // its selector matches — so with it attached from the start the "off"
  // sequence would run on mount. It is keyed to the resolved checked value
  // actually flipping, not to the change attempt, so a controlled switch
  // whose parent declines the change stays still. It is dropped again when
  // it ends, which also hands `translate` back to the transition below, so
  // a hover that widens the thumb slides it rather than snapping it.
  const [animate, setAnimate] = React.useState(false);
  const [lastChecked, setLastChecked] = React.useState(isChecked);
  if (lastChecked !== isChecked) {
    setLastChecked(isChecked);
    setAnimate(true);
  }
  // Hover is a promise of what a press will do, and the press just
  // happened. So a change takes the hover state away until the pointer
  // re-enters — after a click the pointer is already inside, so the next
  // enter is the re-entry; a keyboard or label-text toggle made with the
  // pointer elsewhere gets its hover back the moment the pointer arrives.
  const [hoverSuspended, setHoverSuspended] = React.useState(false);
  const thumbRef = React.useRef<HTMLSpanElement>(null);
  const [from, setFrom] = React.useState("0px");

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-animate={animate || undefined}
      data-no-hover={hoverSuspended || undefined}
      {...props}
      checked={isChecked}
      onCheckedChange={(next, eventDetails) => {
        // A toggle mid-flight continues from the thumb's current position
        // rather than wherever the keyframes' first frame would otherwise
        // snap it to.
        const thumb = thumbRef.current;
        if (thumb) {
          const translate = getComputedStyle(thumb).translate;
          setFrom(translate === "none" ? "0px" : translate.split(" ")[0]);
        }
        setUncontrolledChecked(next);
        setHoverSuspended(true);
        onCheckedChange?.(next, eventDetails);
      }}
      onPointerEnter={(event) => {
        setHoverSuspended(false);
        props.onPointerEnter?.(event);
      }}
      data-size={size}
      style={{ ...GEOMETRY[size], ...({ "--switch-from": from } as React.CSSProperties), ...style }}
      className={cn(
        "group/switch relative inline-flex h-(--switch-h) w-(--switch-w) shrink-0 cursor-pointer items-center rounded-full outline-none select-none",
        // Derived geometry. The thumb's live width and height start at the
        // resting ones; hover widens it into a pill, press widens it further
        // and squashes it. The thumb is centred in the track's height, so a
        // consumer's --switch-h override and the press squash both
        // re-centre themselves.
        "[--switch-travel:calc(var(--switch-w)-var(--switch-thumb-w)-2*var(--switch-pad))]",
        "[--switch-tw:var(--switch-thumb-w)] [--switch-th:var(--switch-thumb-h)] [--switch-top:calc((var(--switch-h)-var(--switch-th))/2)]",
        // The hover rule's `:not()` selectors outrank `:active`, so it has
        // to exclude the press itself.
        "not-data-[no-hover]:not-active:hover:[--switch-tw:calc(var(--switch-thumb-w)+var(--switch-pill))]",
        "active:[--switch-tw:calc(var(--switch-thumb-w)+var(--switch-press))] active:[--switch-th:calc(var(--switch-thumb-h)-var(--switch-press))]",
        // A widening thumb stays pinned to the track's far edge when on, so
        // the travel gives back whatever width it gained.
        "[--switch-end:calc(var(--switch-travel)-(var(--switch-tw)-var(--switch-thumb-w)))]",
        // The target is 44px tall at every size: 8px either side, and
        // whatever makes the height up to the 44px a thumb needs.
        "before:absolute before:-inset-x-2 before:-inset-y-[calc((44px-var(--switch-h))/2)] before:content-['']",
        // Light is input-grey off and primary on with a white thumb; dark
        // follows iOS 26's dark switch — the off track is the input fill
        // with a white thumb, on is primary with a primary-foreground
        // thumb, so on/off is a jump in lightness in both themes; the
        // hairline inset ring (12% overlay) defines the off pill against
        // the page and disappears into the on track.
        "bg-input not-data-[no-hover]:hover:bg-[color-mix(in_oklab,var(--input),rgb(var(--overlay))_10%)]",
        "data-[checked]:bg-primary not-data-[no-hover]:data-[checked]:hover:bg-primary/90",
        "inset-ring inset-ring-[rgb(var(--overlay)/0.12)]",
        "transition-colors [transition-duration:var(--motion-fast,80ms)]",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <SwitchPrimitive.Thumb
        ref={thumbRef}
        data-slot="switch-thumb"
        onAnimationEnd={() => setAnimate(false)}
        className={cn(
          "pointer-events-none absolute top-(--switch-top) left-(--switch-pad) block h-(--switch-th) w-(--switch-tw) rounded-full shadow-sm",
          "bg-white dark:group-data-[checked]/switch:bg-primary-foreground",
          "translate-x-0 group-data-[checked]/switch:translate-x-(--switch-end)",
          "transition-[translate,width,height,top,background-color] [transition-duration:var(--motion-moderate,160ms)] [transition-timing-function:var(--motion-ease,ease)]",
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

export { Switch, type SwitchProps, type SwitchSize };
