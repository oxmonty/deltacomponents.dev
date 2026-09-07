"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/registry/default/lib/utils";
import { useIcon } from "@/lib/icon-context";
import { useShape } from "@/registry/default/lib/shape-context";

/**
 * A real `<select>`, dressed to sit in the properties card.
 *
 * Ported from shadcn's `native-select` and retoned onto this repo's tokens:
 * theirs reaches for `border-input`, `ring` and `primary`, which this design
 * system does not define. The structure is theirs — `appearance-none` on the
 * select with the chevron drawn over it — because that is the only way to
 * restyle the closed control while leaving the open list to the platform.
 *
 * Site chrome, not a registry component: it is what the docs' own settings
 * panel and playground controls want — the OS list, opened where the OS opens
 * it, with no popover to position, no keyboard handling to own and nothing to
 * animate. It replaced the library's own Select at both call sites, and that
 * component is gone with them.
 *
 * The options are the platform's, so they cannot carry the per-item icons the
 * library's Select shows. `icon` keeps the current value's glyph on the closed
 * control, which is where it was doing the work.
 */
export function NativeSelect({
  className,
  icon,
  children,
  ...props
}: ComponentProps<"select"> & {
  /** Glyph shown before the value on the closed control. */
  icon?: ReactNode;
  children: ReactNode;
}) {
  const ChevronDown = useIcon("chevron-down");
  const shape = useShape();

  return (
    // A fixed width, not `w-fit`: these sit in a column of settings rows whose
    // values differ in length ("System" against "Untitled UI"), and sized to
    // content every row started at a different x. 124px is the width the
    // playground's text field already uses, so selects and inputs share one
    // left edge down the rail.
    <div className="relative w-[124px] has-[select:disabled]:opacity-50">
      {icon && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2 flex -translate-y-1/2 items-center [&_svg]:size-4"
        >
          {icon}
        </span>
      )}
      <select
        // `appearance-none` strips the platform's own chevron so the row keeps
        // the card's arrow; the padding reserves the two glyph wells.
        className={cn(
          "text-body text-foreground h-7 w-full cursor-pointer appearance-none border-none bg-transparent py-0 pr-7 outline-none",
          "transition-colors duration-80 hover:bg-hover",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          icon ? "pl-8" : "pl-2",
          shape.button,
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={16}
        strokeWidth={1.5}
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 select-none"
      />
    </div>
  );
}

/** The platform paints the open list, so the option only needs the canvas
 *  colours — without them a dark page hands the list dark-on-dark on the
 *  browsers that inherit the control's colour into the popup. */
export function NativeSelectOption({ className, ...props }: ComponentProps<"option">) {
  return <option className={cn("bg-[Canvas] text-[CanvasText]", className)} {...props} />;
}
