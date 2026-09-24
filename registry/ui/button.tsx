"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "@/registry/lib/icon-context";
import { cn } from "@/registry/lib/utils";

// The size ladder shared by every control — sm 32px, default 36px, lg 40px,
// shadcn's heights — rides `--control-*` custom properties instead of literal
// classes, so one set of classes serves every scope. `:root` carries the
// values; `[data-size="compact"]` shifts the ladder down a step, either from an
// ancestor (e.g. a docs-only SizeProvider) or from this component's own root
// (see `resolvedSize` below), so a button resolves the right size whether it's
// driven by an explicit prop or by whatever scope it's rendered in — with no
// context import required. `compact` is sm inside that scope: still 28px.
const controlSize = (h: string, px: string, text = "text-[length:var(--control-text,13px)]") =>
  `${h} ${px} ${text} gap-[var(--control-gap,6px)]`;
const iconOnlySize = (box: string, glyph = "[&_svg]:size-[var(--control-icon-glyph,16px)]") =>
  `${box} p-0 ${glyph}`;

const buttonVariants = cva(
  [
    "group relative isolate inline-flex items-center justify-center outline-none cursor-pointer font-medium",
    "rounded-[var(--radius-button,var(--radius,0.5rem))]",
    // The colour still lands in 80ms; the press dips the whole button — label,
    // icon and ground together — on the moderate tier and releases a tier
    // quicker, the same shape as Image's press. 0.96, never less: below that
    // a control this small reads as flinching.
    "transition-[color,scale] [transition-duration:80ms,var(--motion-moderate-exit)] ease-spring",
    "active:scale-[0.96] active:[transition-duration:80ms,var(--motion-moderate)]",
    // Without its own layer the label is re-rasterised on the main thread at
    // every intermediate scale and snapped to the pixel grid each frame, so
    // the text judders through the dip. A compositor layer scales the cached
    // raster instead and re-rasters once it settles. Only `transform` — the
    // one thing the press animates.
    "will-change-transform",
    // A real cursor, not `pointer-events-none`: an element with no pointer
    // events can't show one. The hover effects below guard on `enabled`
    // themselves, which is the work pointer-events used to do.
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
  ],
  {
    variants: {
      variant: {
        primary: "text-background",
        secondary: "text-foreground",
        tertiary: "text-foreground",
        ghost: "text-muted-foreground enabled:hover:text-foreground",
      },
      size: {
        sm: controlSize("h-[var(--control-h-sm,32px)]", "px-[var(--control-px-sm,12px)]"),
        default: controlSize("h-[var(--control-h,36px)]", "px-[var(--control-px,16px)]"),
        lg: controlSize("h-[var(--control-h-lg,40px)]", "px-[var(--control-px-lg,24px)]"),
        // The one step past shadcn's ladder. Its label leaves the shared 13px
        // control step, as Tabs' lg does, and its glyph grows with the box.
        xl: controlSize(
          "h-[var(--control-h-xl,48px)]",
          "px-[var(--control-px-xl,32px)]",
          "text-[length:var(--fs-subtitle,15px)]"
        ),
        "icon-sm": iconOnlySize("size-[var(--control-icon-box-sm,32px)]"),
        icon: iconOnlySize("size-[var(--control-icon-box,36px)]"),
        "icon-lg": iconOnlySize("size-[var(--control-icon-box-lg,40px)]"),
        "icon-xl": iconOnlySize(
          "size-[var(--control-icon-box-xl,48px)]",
          "[&_svg]:size-[var(--control-icon-glyph-xl,20px)]"
        ),
      },
      iconLeft: { true: "" },
      iconRight: { true: "" },
    },
    compoundVariants: [
      { iconLeft: true, className: "pl-[var(--control-icon-pad,10px)]" },
      { iconRight: true, className: "pr-[var(--control-icon-pad,10px)]" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonSizeCanonical =
  | "sm"
  | "default"
  | "lg"
  | "xl"
  | "icon-sm"
  | "icon"
  | "icon-lg"
  | "icon-xl";

/** Public size values: the canonical ladder plus `compact`/`icon-compact` for
 *  the dense 28px control, and `md`, kept so existing call sites compile. */
type ButtonSize = ButtonSizeCanonical | "compact" | "icon-compact" | "md";

/** `compact` is `sm` rendered inside the compact scope — the ladder shifted
 *  down a step lands it back on 28px, the height it has always had. */
const sizeAliases: Partial<Record<ButtonSize, ButtonSizeCanonical>> = {
  compact: "sm",
  "icon-compact": "icon-sm",
  md: "default",
};

/** The spinner tracks the button's own box, so it stays proportionate on every
 *  step rather than reading the default one's height at all three. */
const spinnerBox: Record<ButtonSizeCanonical, string> = {
  sm: "size-[var(--control-h-sm,32px)]",
  default: "size-[var(--control-h,36px)]",
  lg: "size-[var(--control-h-lg,40px)]",
  xl: "size-[var(--control-h-xl,48px)]",
  "icon-sm": "size-[var(--control-icon-box-sm,32px)]",
  icon: "size-[var(--control-icon-box,36px)]",
  "icon-lg": "size-[var(--control-icon-box-lg,40px)]",
  "icon-xl": "size-[var(--control-icon-box-xl,48px)]",
};

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "size"> {
  /** sm 32px, default 36px, lg 40px, xl 48px, and the `icon-*` squares to match.
   *  Omitted, the button follows the ambient `data-size` scope, where compact
   *  shifts the ladder down a step — see the `--control-*` tokens in
   *  globals.css. `compact`/`icon-compact` are the dense 28px control. */
  size?: ButtonSize;
  /** When true, the given single React-element child becomes the rendered element (slot-style). */
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
  /** Force the visual pressed/held state. Useful when the button drives an
   *  external open piece of UI (a popover, dropdown, etc.) so it reads as
   *  engaged while the menu is showing. */
  active?: boolean;
}

/* Press effect: the surface layer sits 1px inside the button and a
   same-color box-shadow spread fills it back out to the full bounds.
   Pressing collapses the spread, shrinking the surface by exactly 1px per
   side at any width. The root's 0.96 press scale rides on top of this: the
   1px collapse is the ground's own geometry and stays uniform at any width,
   while the scale carries the label and icon along, which the collapse
   alone never did. On a very wide button the scale reads more sideways
   than down (2% of 400px is 8px against under 1px), which is the trade
   the tactile press was chosen over. Fill colors are opaque color-mix()es
   rather than alpha so the fill and its spread ring never seam.

   This layer holds only the RESTING ground and that press geometry; every
   hover and press *color* lives on the wash layer below, so the two can't
   both paint a translucent fill and double its alpha. */
const bgVariants: Record<string, string> = {
  primary:
    "[--btn-bg:var(--foreground)] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  secondary:
    "[--btn-bg:var(--accent)] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  // The border ring is an outer 1px shadow at rest that hands off to an
  // inset 1px shadow when pressed, so the ring moves inward with the
  // surface.
  tertiary:
    "bg-transparent shadow-[0_0_0_1px_var(--border),inset_0_0_0_0px_var(--border)] group-active:shadow-[0_0_0_0px_var(--border),inset_0_0_0_1px_var(--border)]",
  ghost: "bg-transparent",
};

/* Hover ground. A second layer over the resting one, carrying every hover and
   press fill, which BLOOMS out of the button's centre (75% → full) instead of
   cross-fading in place.

   It repeats the base layer's geometry — `inset-px` plus a same-color 1px
   spread — so the ground reaches the button's real bounds and collapses with
   it under a press, rather than leaving a hairline of the resting color
   ringing a hovered face. Translucent fill + same-color spread never double
   up: outer shadows render only outside the surface box.

   The color is one custom property per variant rather than two sets of
   classes, so the layer itself is written once. */
const washVariants: Record<string, string> = {
  primary:
    "[--btn-wash:color-mix(in_oklab,var(--foreground)_90%,var(--background))] group-active:[--btn-wash:color-mix(in_oklab,var(--foreground)_80%,var(--background))]",
  secondary:
    "[--btn-wash:color-mix(in_oklab,var(--accent)_80%,var(--background))] group-active:[--btn-wash:var(--accent)]",
  tertiary: "[--btn-wash:var(--hover)] group-active:[--btn-wash:var(--active)]",
  // Ghost has no resting ground, so the wash IS the button while hovered and
  // a quicker exit reads as it blinking out. It leaves on the tier it arrived
  // on instead; `cn` drops the quicker exit duration the layer sets by default.
  ghost:
    "[--btn-wash:var(--hover)] group-active:[--btn-wash:var(--active)] duration-(--motion-moderate)",
};

/* Forced-active (`active` prop): pressed colors at full size; the
   geometric press-collapse still reacts on top. */
const activeBgVariants: Record<string, string> = {
  primary:
    "[--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  secondary:
    "[--btn-bg:var(--accent)] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  tertiary:
    "bg-active shadow-[0_0_0_1px_var(--border),inset_0_0_0_0px_var(--border)] group-active:shadow-[0_0_0_0px_var(--border),inset_0_0_0_1px_var(--border)]",
  ghost:
    "bg-active shadow-[0_0_0_1px_var(--active)] group-active:shadow-[0_0_0_0px_var(--active)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      active = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // asChild: the user's element becomes the root while the button's internal
    // structure (bg layer, content wrapper, spinner, icons) survives as its
    // children — the element's own children become the label. We clone the
    // element directly instead of routing through ButtonPrimitive's `render`:
    // Base UI would bolt button semantics (role="button", Space activation)
    // onto e.g. a link, where plain-link output is wanted.
    const asChildElement =
      asChild && isValidElement(children)
        ? (children as ReactElement<{
            children?: ReactNode;
            className?: string;
            style?: React.CSSProperties;
            ref?: React.Ref<HTMLButtonElement>;
          }>)
        : null;
    const label = asChildElement ? asChildElement.props.children : children;
    // Resolve the size from the explicit prop alone (legacy aliases mapped
    // onto the canonical ladder) — no ambient SizeProvider read. Falling
    // outside an explicit prop, "default" is just the JS fallback; the
    // *rendered* size still follows an ambient `data-size="compact"`
    // ancestor via the `--control-*` vars in buttonVariants, CSS handles
    // that resolution on its own.
    const resolvedSize: ButtonSizeCanonical = size
      ? sizeAliases[size] ?? (size as ButtonSizeCanonical)
      : "default";
    const isIconOnly = resolvedSize.startsWith("icon");
    const isCompact = size === "compact" || size === "icon-compact";
    // Best-effort JS fallback for icon components that don't size off the
    // `size-[var(--control-icon-glyph,16px)]` class below (e.g. a non-SVG glyph
    // font) — accurate whenever `size` was passed explicitly, otherwise just
    // the default-tier glyph size until CSS corrects it.
    const iconSize = isCompact ? 14 : 16;
    // A control label is an affordance, not prose: at the 13px control size
    // regular reads too light, most visibly on `primary`, where light-on-dark
    // optically thins. The weight is `font-medium` on the root rather than the
    // `fontWeights.medium` variation (450): that pairing exists to hold a
    // label's width while the weight ANIMATES, which a button's never does, and
    // 500 is what Tabs' triggers carry — a control should not read lighter than
    // the tab strip beside it.
    const labelStyle: React.CSSProperties = { ...style };
    const bgClass = active
      ? activeBgVariants[variant ?? "primary"]
      : bgVariants[variant ?? "primary"];

    const internals = (
      <>
        <span
          aria-hidden
          className={cn(
            "absolute inset-px rounded-[inherit] transition-[box-shadow,background-color] [transition-duration:180ms,80ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease] group-active:[transition-duration:80ms,80ms]",
            bgClass
          )}
        />
        {/* Forced-active paints the pressed color at full size on the layer
            above, so a bloom on top of it would only re-tint an already-lit
            button with the lighter hover shade. */}
        {!active && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-px rounded-[inherit] scale-75 opacity-0 group-disabled:hidden",
              "bg-[var(--btn-wash)] shadow-[0_0_0_1px_var(--btn-wash)]",
              "transition-[scale,opacity,box-shadow,background-color] ease-spring",
              // Moderate, not the fast tier hover usually takes: a scale this
              // small lands inside 80ms without ever reading as movement, and
              // the bloom IS the effect. Leaving runs a tier quicker, so the
              // ground recedes crisply instead of replaying the entrance.
              "duration-(--motion-moderate-exit) group-hover:duration-(--motion-moderate)",
              "group-hover:scale-100 group-hover:opacity-100",
              // A touch screen has no hover, so the press has to raise the
              // ground itself — without this the only feedback on a phone is
              // the 1px collapse, which is far too quiet to register.
              //
              // Instantly, not on a tier. The enter duration rides
              // `group-hover:`, which Tailwind wraps in @media (hover: hover)
              // and a phone therefore never gets, so a press was blooming on
              // the 120ms exit duration — and a tap holds :active for less
              // than that, so the ground was still on its way up when the
              // finger lifted and it reversed. Ghost feels it worst: with no
              // resting ground the wash IS the entire press feedback. Landing
              // it at once means the ground is simply there for as long as
              // the finger is, and only the release animates — the same shape
              // as the Tabs hover wash, which appears instantly and fades.
              "group-active:scale-100 group-active:opacity-100 group-active:duration-0",
              "group-active:shadow-[0_0_0_0px_var(--btn-wash)]",
              washVariants[variant ?? "primary"]
            )}
          />
        )}
        <span className="relative inline-flex items-center justify-center gap-[inherit]">
          {loading ? (
            <>
              <span className="flex items-center justify-center gap-[inherit] opacity-0">
                {LeadingIcon && !isIconOnly && (
                  <LeadingIcon size={iconSize} strokeWidth={2} className="size-[var(--control-icon-glyph,16px)]" />
                )}
                {label}
                {TrailingIcon && !isIconOnly && (
                  <TrailingIcon size={iconSize} strokeWidth={2} className="size-[var(--control-icon-glyph,16px)]" />
                )}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                {/* Tracks the button height so the loading glyph stays
                    proportionate across sizes, ambient or explicit. */}
                <svg
                  className={spinnerBox[resolvedSize]}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
                    stroke="currentColor"
                    strokeWidth="1.125"
                    strokeLinecap="round"
                    pathLength="100"
                    style={{
                      strokeDasharray: "15 85",
                      animation: "spinner-move 2s linear infinite, spinner-dash 4s ease-in-out infinite",
                    }}
                  />
                </svg>
              </span>
            </>
          ) : isIconOnly ? (
            <span
              className={cn(
                "[&_svg]:stroke-[1.5] group-enabled:group-hover:[&_svg]:stroke-[2]",
                // The root's 0.96 is under a pixel on a 20px glyph, so on an
                // icon square the press would go unseen. The glyph dips
                // further, on the same tiers, and reads as pressing into the
                // button.
                "[&_svg]:transition-[stroke-width,scale] [&_svg]:ease-spring",
                "[&_svg]:[transition-duration:80ms,var(--motion-moderate-exit)]",
                "group-active:[&_svg]:scale-90 group-active:[&_svg]:[transition-duration:80ms,var(--motion-moderate)]"
              )}
            >
              {label}
            </span>
          ) : (
            <>
              {LeadingIcon && (
                <LeadingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="size-[var(--control-icon-glyph,16px)] transition-[stroke-width] duration-80 group-enabled:group-hover:stroke-[2]"
                />
              )}
              {/* text-box only applies to block containers, so the trim lives
                  on the label span (a blockified flex item), not the flex root.
                  The button's height is fixed (h-*), so this doesn't change
                  layout — it just centers the cap-to-baseline box optically. */}
              <span className="[text-box:trim-both_cap_alphabetic]">{label}</span>
              {TrailingIcon && (
                <TrailingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="size-[var(--control-icon-glyph,16px)] transition-[stroke-width] duration-80 group-enabled:group-hover:stroke-[2]"
                />
              )}
            </>
          )}
        </span>
      </>
    );

    const rootClassName = cn(
      buttonVariants({
        variant,
        size: resolvedSize,
        iconLeft: !isIconOnly && !!LeadingIcon,
        iconRight: !isIconOnly && !!TrailingIcon,
      }),
      className
    );
    // An explicit size must win over whatever `--control-*` values an ambient
    // data-size ancestor (or lack of one) would otherwise resolve to. Setting
    // the attribute here — not just relying on the class above — makes the
    // override apply on the element itself, where a plain attribute selector
    // beats inheritance from any ancestor.
    //
    // Both directions, not just compact: subtree scoping is the supported way
    // to size a region, so `size="default"` inside a `data-size="compact"`
    // wrapper has to climb back out. Only an omitted prop stays ambient.
    const dataSize = size ? (isCompact ? "compact" : "default") : undefined;

    if (asChildElement) {
      const childProps = asChildElement.props;
      return cloneElement(
        asChildElement,
        {
          ...props,
          // Spread, not a literal key: cloneElement's inferred config type is
          // narrower than ButtonHTMLAttributes (it only knows the target
          // element's own props), so a literal "data-size" key fails
          // TypeScript's excess-property check the way a spread doesn't.
          ...(dataSize ? { "data-size": dataSize } : {}),
          ref,
          className: cn(rootClassName, childProps.className),
          style: { ...labelStyle, ...childProps.style },
        },
        internals
      );
    }

    return (
      <ButtonPrimitive
        // Base UI's `ButtonPrimitive` forwards to an HTMLButtonElement;
        // keep the public ref type narrow so consumers see the right type.
        ref={ref as React.Ref<HTMLButtonElement>}
        className={rootClassName}
        data-size={dataSize}
        disabled={disabled || loading}
        style={labelStyle}
        {...props}
      >
        {internals}
      </ButtonPrimitive>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps, ButtonSize };
