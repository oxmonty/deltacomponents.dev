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

const badgePosition: Record<ProductCardSize, string> = {
  sm: "top-1.5 right-1.5 px-1.5 py-0.5",
  default: "top-2 right-2 px-2 py-1",
  lg: "top-3 right-3 px-3 py-1.5",
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
  // rather than making this div interactive — that keeps the badge inside it
  // legal, which nesting a control inside role="button" would not.
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
  src: string
  alt: string
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

  return (
    <div
      data-slot="product-card-image"
      className={cn(
        "group/card-image relative aspect-square w-full overflow-hidden",
        "transition-colors duration-(--motion-fast) ease-spring",
        "rounded-[var(--radius-container,calc(var(--radius,0.5rem)_+_4px))]",
        // Plain `hover:`/`active:` variants, not the `[&:hover]:` arbitrary
        // ones this used to carry. tailwind-merge deliberately does not
        // resolve an arbitrary variant against a standard modifier, so a
        // caller passing `hover:bg-amber-100` used to lose the hover to the
        // component and the well snapped back to muted on mouse-enter.
        "bg-muted hover:bg-muted/80 active:bg-muted/80",
        className
      )}
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a registry
          component installs into any React project, so it must not depend on
          next/image; the consumer swaps this for their framework's loader. */}
      <img
        data-slot="product-card-img"
        src={src || "/placeholder.svg"}
        alt={alt}
        className={cn(
          "absolute inset-0 h-full w-full object-contain",
          animated && [
            "transition-transform duration-(--motion-slow) ease-spring",
            "group-hover/card-image:-translate-y-2 group-active/card-image:-translate-y-2",
          ],
          imagePadding[size],
          variant === "inner" && imagePaddingInner[size],
          imageClassName
        )}
      />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
 * ProductCardBadge
 * ------------------------------------------------------------------ */

interface ProductCardBadgeProps extends React.ComponentProps<"button"> {
  /** Swaps the badge to the filled treatment. */
  isActive?: boolean
  icon?: React.ReactNode
}

function ProductCardBadge({
  className,
  isActive = false,
  icon,
  children,
  onClick,
  ...props
}: ProductCardBadgeProps) {
  const { size } = useProductCardContext()

  return (
    <button
      data-slot="product-card-badge"
      type="button"
      onClick={(e) => {
        // The badge sits on a card that may itself be clickable; a wishlist
        // toggle must not also open the product.
        e.stopPropagation()
        onClick?.(e)
      }}
      className={cn(
        "absolute flex items-center gap-1 font-medium",
        "transition-colors duration-(--motion-fast) ease-spring",
        "rounded-[var(--radius-button,var(--radius,0.5rem))]",
        // Relative to the card's own type size rather than a third size
        // table, so a `text-*` override on the root carries the badge with
        // it. Lands within 0.4px of the sizes the tables used to hardcode.
        "text-[0.85em]",
        badgePosition[size],
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-popover text-popover-foreground hover:bg-accent",
        "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
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
  ProductCardBadge,
  ProductCardContent,
  ProductCardHeader,
  ProductCardTitle,
  ProductCardSubtitle,
  ProductCardMetric,
  type ProductCardProps,
  type ProductCardImageProps,
  type ProductCardBadgeProps,
  type ProductCardContentProps,
  type ProductCardHeaderProps,
  type ProductCardTitleProps,
  type ProductCardSubtitleProps,
  type ProductCardMetricProps,
  type ProductCardSize,
  type ProductCardVariant,
}
