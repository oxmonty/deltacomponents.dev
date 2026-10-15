"use client";

import { forwardRef, useId, type HTMLAttributes } from "react";

import { cn } from "@/registry/lib/utils";
import { Switch as SwitchControl } from "@/registry/ui/switch";
import { useSize, type SizeVariant } from "@/lib/docs/size-context";

/** Docs-chrome toggle: the boolean controls in the right-panel playgrounds.
 *
 *  A labelled row around the registry's Switch, so the chrome bounces the
 *  same way the documented control does. Only the row — the label, the
 *  click target, the size ladder — is the site's own. */
interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Pins the switch to one step of the size ladder. Omitted, it follows the
   *  surrounding SizeProvider. */
  size?: SizeVariant;
}

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  ({ label, checked, onToggle, disabled = false, size, className, ...props }, ref) => {
    const labelId = useId();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";

    return (
      <div
        ref={ref}
        data-checked={checked}
        className={cn(
          "relative z-10 flex cursor-pointer items-center select-none",
          sizeClasses.gap,
          sizeClasses.px,
          compact ? "py-1" : "py-2",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={() => !disabled && onToggle()}
        {...props}
      >
        <SwitchControl
          checked={checked}
          aria-labelledby={labelId}
          onCheckedChange={onToggle}
          disabled={disabled}
          size={compact ? "sm" : "default"}
          onClick={(e) => e.stopPropagation()}
        />

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
