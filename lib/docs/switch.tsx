"use client";

import { forwardRef, useId, type HTMLAttributes } from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/registry/lib/utils";
import { useSize, type SizeVariant } from "@/lib/docs/size-context";

/** Docs-chrome toggle: the boolean controls in the right-panel playgrounds.
 *
 *  Not a published component — it lives here rather than in `registry/` on
 *  purpose. The registry's Switch was retired with framer-motion, and nothing
 *  the site needs from it justified porting its drag-to-toggle gesture: a
 *  checkbox you click is the whole requirement here.
 *
 *  Everything moves in CSS. The geometry is a handful of custom properties so
 *  the hover pill-extend and the press squash scale with the ladder step
 *  instead of being written out twice. */
interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Pins the switch to one step of the size ladder. Omitted, it follows the
   *  surrounding SizeProvider. */
  size?: SizeVariant;
}

const METRICS: Record<
  SizeVariant,
  { track: [number, number]; thumb: number; pill: number; press: number }
> = {
  default: { track: [34, 20], thumb: 16, pill: 2, press: 4 },
  compact: { track: [28, 16], thumb: 12, pill: 2, press: 3 },
};

const THUMB_OFFSET = 2;

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  ({ label, checked, onToggle, disabled = false, size, className, ...props }, ref) => {
    const labelId = useId();
    const sizeClasses = useSize(size);
    const m = METRICS[sizeClasses.variant];
    const [trackWidth, trackHeight] = m.track;

    return (
      <div
        ref={ref}
        data-checked={checked}
        className={cn(
          "group relative z-10 flex cursor-pointer items-center select-none",
          sizeClasses.gap,
          sizeClasses.px,
          sizeClasses.variant === "compact" ? "py-1" : "py-2",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        style={
          {
            "--sw-thumb": `${m.thumb}px`,
            "--sw-offset": `${THUMB_OFFSET}px`,
            "--sw-travel": `${trackWidth - m.thumb - THUMB_OFFSET * 2}px`,
            "--sw-w": `${m.thumb}px`,
            "--sw-h": `${m.thumb}px`,
            "--sw-top": `${THUMB_OFFSET}px`,
          } as React.CSSProperties
        }
        onClick={() => !disabled && onToggle()}
        {...props}
      >
        <SwitchPrimitive.Root
          checked={checked}
          aria-labelledby={labelId}
          onCheckedChange={onToggle}
          disabled={disabled}
          tabIndex={0}
          className={cn(
            "relative shrink-0 cursor-pointer rounded-full outline-none",
            "bg-accent group-hover:bg-[color-mix(in_oklab,var(--accent),rgb(var(--overlay))_10%)]",
            "data-[checked]:bg-[#6B97FF] data-[checked]:group-hover:bg-[#5C89F2]",
            "transition-colors duration-80",
            "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            // Hover widens the thumb into a pill; press widens it further and
            // squashes it, re-centering with half the lost height.
            "group-hover:[--sw-w:calc(var(--sw-thumb)+var(--sw-pill))]",
            "group-active:[--sw-w:calc(var(--sw-thumb)+var(--sw-press))]",
            "group-active:[--sw-h:calc(var(--sw-thumb)-var(--sw-press))]",
            "group-active:[--sw-top:calc(var(--sw-offset)+var(--sw-press)/2)]"
          )}
          style={
            {
              width: trackWidth,
              height: trackHeight,
              "--sw-pill": `${m.pill}px`,
              "--sw-press": `${m.press}px`,
            } as React.CSSProperties
          }
          onClick={(e) => e.stopPropagation()}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              "absolute left-(--sw-offset) block rounded-full bg-white shadow-sm",
              "top-(--sw-top) h-(--sw-h) w-(--sw-w)",
              // A widening thumb stays pinned to the track's right edge when
              // checked, so the travel gives back whatever width it gained.
              "translate-x-0 group-data-[checked=true]:translate-x-[calc(var(--sw-travel)-(var(--sw-w)-var(--sw-thumb)))]",
              "transition-[translate,width,height,top] duration-(--motion-moderate) ease-spring"
            )}
          />
        </SwitchPrimitive.Root>

        <span
          id={labelId}
          className={cn(
            // text-box trim recenters the letterforms against the track; the
            // track is taller than the label, so layout doesn't change.
            "[text-box:trim-both_cap_alphabetic] transition-[color] duration-80",
            sizeClasses.text,
            checked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
export type { SwitchProps };
