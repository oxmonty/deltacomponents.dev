"use client"

import * as React from "react"

import { cn } from "@/registry/lib/utils"

/* ------------------------------------------------------------------
 * Context for sharing state between compound components
 * ------------------------------------------------------------------ */

type ProductCardVariant = "default" | "inner"
type ProductCardSize = "sm" | "default" | "lg"

interface ProductCardContextValue {
  variant: ProductCardVariant
  size: ProductCardSize
  animated: boolean
}

const ProductCardContext = React.createContext<ProductCardContextValue | null>(
  null
)

function useProductCardContext() {
  const context = React.useContext(ProductCardContext)
  if (!context) {
    throw new Error(
      "ProductCard compound components must be used within <ProductCard>"
    )
  }
  return context
}

/* ------------------------------------------------------------------
 * Size tables
 * ------------------------------------------------------------------
 * Only the values that cannot be derived. The card's TYPE size is set once
 * on the root and inherited by the title, subtitle and metric, so a single
 * `text-*` in the root's className resizes all of them together — where
 * three separate per-part tables meant a caller had to override each one and
 * keep them in step by hand.
 */

const cardWidth: Record<ProductCardSize, string> = {
  sm: "max-w-[200px]",
  default: "max-w-[320px]",
  lg: "max-w-[460px]",
}

const cardText: Record<ProductCardSize, string> = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base",
}

const imagePadding: Record<ProductCardSize, string> = {
  sm: "p-4",
  default: "p-8",
  lg: "p-12",
}

// The inner variant parks the title/metric row over the bottom of the same
// square, so the object-contain subject has to clear it — otherwise the text
// lands on the product. Extra bottom padding lifts the subject by roughly the
// height of that row.
const imagePaddingInner: Record<ProductCardSize, string> = {
  sm: "pb-14",
  default: "pb-20",
  lg: "pb-24",
}

const contentPadding: Record<ProductCardSize, string> = {
  sm: "px-0.5 py-2",
  default: "px-1 py-3",
  lg: "px-2 py-4",
}

const contentPaddingInner: Record<ProductCardSize, string> = {
  sm: "p-2",
  default: "p-3",
  lg: "p-4",
}

/* ------------------------------------------------------------------
 * ProductCard (root)
 * ------------------------------------------------------------------ */

interface ProductCardProps extends React.ComponentProps<"div"> {
  /** `default` puts the content below the image, `inner` lays it over it. */
  variant?: ProductCardVariant
  size?: ProductCardSize
  /** Lift the image on hover and press. Defaults to true. */
  animated?: boolean
}

function ProductCard({
  className,
  variant = "default",
  size = "default",
  animated = true,
  children,
  ...props
}: ProductCardProps) {
  // A card is not a control. It only claims to be clickable when a handler
  // actually arrives, so a plain card no longer shows a pointer cursor it
  // cannot honour. A card that has to be keyboard-reachable should put a real
  // <a>/<button> on its title and stretch it (`after:absolute after:inset-0`)
  // rather than making this div interactive — a control nested inside
  // role="button" would not be legal.
  const interactive = Boolean(props.onClick)

  return (
    <ProductCardContext.Provider value={{ variant, size, animated }}>
      <div
        data-slot="product-card"
        className={cn(
          "w-full overflow-hidden",
          "rounded-[var(--radius-container,calc(var(--radius,0.5rem)_+_4px))]",
          cardText[size],
          // The size step caps the card's own width as well as scaling what is
          // inside it, so `size` reads as a size rather than only as padding.
          // `w-full` keeps it from overflowing a narrower box — in a grid cell
          // it still fills the cell — and a `w-*`/`max-w-*` in className
          // overrides the cap outright.
          cardWidth[size],
          interactive && "cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ProductCardContext.Provider>
  )
}

/* ------------------------------------------------------------------
 * ProductCardImage
 * ------------------------------------------------------------------ */

interface ProductCardImageProps extends React.ComponentProps<"div"> {
  /** Omit it and the well is an empty stage for whatever children you put
   *  in it — a widget, a chart, a video — with the same ground and corners. */
  src?: string
  alt?: string
  /** Classes for the `<img>` itself — the one element in the card a caller
   *  cannot reach with a className of its own. */
  imageClassName?: string
}

function ProductCardImage({
  className,
  src,
  alt,
  imageClassName,
  children,
  ...props
}: ProductCardImageProps) {
  const { variant, size, animated } = useProductCardContext()
  const wellRef = React.useRef<HTMLDivElement>(null)
  // Touch screens have no hover, and a tap's :active is too brief for the
  // lift to finish, so a tap pins the lift here and the next tap anywhere
  // else releases it — the hold a pointer gets from hovering. Desktop keeps
  // hover alone: a click there would otherwise leave the image raised.
  const [pressed, setPressed] = React.useState(false)
  React.useEffect(() => {
    if (!pressed) return
    const release = (event: PointerEvent) => {
      if (!wellRef.current?.contains(event.target as Node)) setPressed(false)
    }
    document.addEventListener("pointerdown", release)
    return () => document.removeEventListener("pointerdown", release)
  }, [pressed])
  const pressToHold = (event: React.PointerEvent<HTMLDivElement>) => {
    if (animated && event.pointerType === "touch") setPressed(true)
  }

  return (
    <div
      ref={wellRef}
      data-slot="product-card-image"
      data-pressed={pressed || undefined}
      onPointerDown={pressToHold}
      className={cn(
        "group/card-image relative aspect-square w-full overflow-hidden",
        "rounded-[var(--radius-container,calc(var(--radius,0.5rem)_+_4px))]",
        // One ground, in every state. The well used to dim on hover and
        // press; the image's lift is the whole response to the pointer.
        "bg-muted",
        className
      )}
      {...props}
    >
      {/* A registry component installs into any React project, so it must
          not depend on next/image; the consumer swaps this for their
          framework's loader. */}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          data-slot="product-card-img"
          src={src}
          alt={alt ?? ""}
          className={cn(
            "absolute inset-0 h-full w-full object-contain",
            animated && [
              "transition-transform duration-(--motion-slow) ease-spring",
              "group-hover/card-image:-translate-y-2 group-active/card-image:-translate-y-2",
              "group-data-[pressed]/card-image:-translate-y-2",
            ],
            imagePadding[size],
            variant === "inner" && imagePaddingInner[size],
            imageClassName
          )}
        />
      )}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
 * ProductCardOverlay
 * ------------------------------------------------------------------
 * A corner of the well: a tag, a save button, a label, an action cluster.
 * Renders inside <ProductCardImage>, which is the positioning context.
 */

type ProductCardOverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

const overlayPosition: Record<ProductCardOverlayPosition, string> = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
}

const overlayInset: Record<ProductCardSize, string> = {
  sm: "m-2",
  default: "m-3",
  lg: "m-4",
}

interface ProductCardOverlayProps extends React.ComponentProps<"div"> {
  position: ProductCardOverlayPosition
  /** `hover` hides it until the well is hovered or holds focus, or the
   *  overlay carries `data-on`. Only where hovering is possible: a touch
   *  screen sees it from the start. */
  reveal?: "always" | "hover"
}

function ProductCardOverlay({
  className,
  position,
  reveal = "always",
  children,
  ...props
}: ProductCardOverlayProps) {
  const { size } = useProductCardContext()

  return (
    <div
      data-slot="product-card-overlay"
      data-position={position}
      className={cn(
        "absolute z-10",
        overlayPosition[position],
        overlayInset[size],
        reveal === "hover" && [
          // The hidden state is gated on hover capability, so a device that
          // cannot hover is never shown a control it has no way to reveal.
          "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:translate-y-1",
          "transition-[opacity,translate] duration-(--motion-moderate) ease-spring",
          "group-hover/card-image:opacity-100 group-hover/card-image:translate-y-0",
          // Keyboard focus anywhere in the well reveals it; `:focus-visible`
          // rather than `:focus-within` so a mouse click on a control inside
          // the well does not leave the overlays pinned after the pointer goes.
          "group-has-[:focus-visible]/card-image:opacity-100 group-has-[:focus-visible]/card-image:translate-y-0",
          "data-[on]:opacity-100 data-[on]:translate-y-0",
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
 * ProductCardContent (container for title, subtitle, metric)
 * ------------------------------------------------------------------ */

type ProductCardContentProps = React.ComponentProps<"div">

function ProductCardContent({
  className,
  children,
  ...props
}: ProductCardContentProps) {
  const { variant, size } = useProductCardContext()

  return (
    <div
      data-slot="product-card-content"
      className={cn(
        "flex items-start justify-between gap-2",
        variant === "default" && contentPadding[size],
        variant === "inner" && [
          "absolute inset-x-0 bottom-0 items-end",
          contentPaddingInner[size],
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
 * ProductCardHeader (wrapper for title + subtitle)
 * ------------------------------------------------------------------ */

type ProductCardHeaderProps = React.ComponentProps<"div">

function ProductCardHeader({
  className,
  children,
  ...props
}: ProductCardHeaderProps) {
  return (
    <div
      data-slot="product-card-header"
      className={cn("min-w-0 flex-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
 * ProductCardTitle / Subtitle / Metric
 * ------------------------------------------------------------------
 * None of the three sets a font size. They inherit the card's, so one
 * `text-*` on the root moves the whole block and a `text-*` on any one of
 * them still overrides just that line.
 */

type ProductCardTitleProps = React.ComponentProps<"h3">

function ProductCardTitle({
  className,
  children,
  ...props
}: ProductCardTitleProps) {
  return (
    <h3
      data-slot="product-card-title"
      className={cn("text-foreground truncate font-medium", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

type ProductCardSubtitleProps = React.ComponentProps<"p">

function ProductCardSubtitle({
  className,
  children,
  ...props
}: ProductCardSubtitleProps) {
  return (
    <p
      data-slot="product-card-subtitle"
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

type ProductCardMetricProps = React.ComponentProps<"span">

function ProductCardMetric({
  className,
  children,
  ...props
}: ProductCardMetricProps) {
  return (
    <span
      data-slot="product-card-metric"
      className={cn("text-foreground shrink-0 font-medium", className)}
      {...props}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------------ */

export {
  ProductCard,
  ProductCardImage,
  ProductCardOverlay,
  ProductCardContent,
  ProductCardHeader,
  ProductCardTitle,
  ProductCardSubtitle,
  ProductCardMetric,
  type ProductCardProps,
  type ProductCardImageProps,
  type ProductCardOverlayProps,
  type ProductCardOverlayPosition,
  type ProductCardContentProps,
  type ProductCardHeaderProps,
  type ProductCardTitleProps,
  type ProductCardSubtitleProps,
  type ProductCardMetricProps,
  type ProductCardSize,
  type ProductCardVariant,
}
