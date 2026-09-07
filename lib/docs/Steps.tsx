import { type ReactNode } from "react";
import { fontWeights } from "@/registry/lib/font-weight";
import { cn } from "@/registry/lib/utils";

/**
 * A numbered procedure, in www's shape: a rule down the left joining every
 * step, each step's number sitting on that rule, and everything belonging to a
 * step indented clear of it.
 *
 * `counter-reset` lives here and `counter-increment` on each Step, so the
 * numbers come from CSS — a step can be added, removed or made conditional
 * without anyone having to renumber the ones after it.
 */
export function Steps({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-border ml-4 border-l pl-8 [counter-reset:step]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** One step's heading. Everything after it, until the next Step, is its body. */
export function Step({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h3
      className={cn(
        "step text-subtitle text-foreground mt-8 mb-4 first:mt-0",
        className
      )}
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </h3>
  );
}
