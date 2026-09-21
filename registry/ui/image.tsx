"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/registry/lib/utils"

interface ImageProps
  extends Omit<React.ComponentProps<"img">, "alt" | "src" | "width" | "height" | "ref"> {
  src: string
  /** Required. Pass "" for a decorative image. */
  alt: string
  caption?: React.ReactNode
  /** Click or tap to enlarge. */
  zoomable?: boolean
  /** true: bleed below the `md` breakpoint. "always": at every width. Landscape images only. */
  bleed?: boolean | "always"
  width?: number
  height?: number
  onZoomChange?: (open: boolean) => void
  /** Rendered inside the enlarged view only, over the picture: an
   *  `ImageClose`, say. Ignored when `zoomable` is false. */
  children?: React.ReactNode
  /** Classes for the <figure>; `className` goes on the <img>. */
  figureClassName?: string
}

/** A figure: an image, an optional caption, a click-to-enlarge view in a
 *  native dialog, and an optional bleed past the text column's gutter. */
function Image({
  src,
  alt,
  caption,
  zoomable = true,
  bleed = false,
  width,
  height,
  srcSet,
  sizes,
  onZoomChange,
  children,
  figureClassName,
  className,
  ...imgProps
}: ImageProps) {
  const thumbRef = React.useRef<HTMLImageElement>(null)
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const [measuredRatio, setMeasuredRatio] = React.useState<number | null>(null)

  React.useEffect(() => setMounted(true), [])

  // Set while the view is open; see openDialog.
  const stopWatchingScroll = React.useRef<(() => void) | null>(null)
  React.useEffect(() => () => stopWatchingScroll.current?.(), [])

  // Known from the props when given; otherwise read off the thumbnail once
  // its pixels are in. `width`/`height` land during SSR, so most callers pay
  // no measuring effect at all.
  const knownRatio = width && height ? width / height : undefined
  const ratio = knownRatio ?? measuredRatio ?? undefined
  // Unknown ratio reads as not landscape, so bleed never fires on a guess.
  const landscape = ratio !== undefined && ratio > 1

  React.useEffect(() => {
    if (knownRatio) return
    const node = thumbRef.current
    if (!node) return
    const measure = () => {
      if (node.naturalWidth && node.naturalHeight) {
        setMeasuredRatio(node.naturalWidth / node.naturalHeight)
      }
    }
    // Now for anything already decoded from cache, and again on arrival.
    if (node.complete) measure()
    node.addEventListener("load", measure)
    return () => node.removeEventListener("load", measure)
  }, [knownRatio, src])

  const bleedActive = landscape && Boolean(bleed)
  const bleedAlways = bleed === "always"
  // On the outer box (the button, or the img when there is no button) so a
  // caption stays in the text column. The width is spelled out: `auto` only
  // stretches a plain block — a button shrinks to fit and an img falls back
  // to its natural size, so neither would follow the negative margins.
  const bleedBoxClass = bleedActive
    ? bleedAlways
      ? "mx-[calc(var(--image-bleed-gutter,1rem)*-1)] w-[calc(100%+2*var(--image-bleed-gutter,1rem))] max-w-none"
      : "max-md:mx-[calc(var(--image-bleed-gutter,1rem)*-1)] max-md:w-[calc(100%+2*var(--image-bleed-gutter,1rem))] max-md:max-w-none"
    : undefined
  const openDialog = () => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    // showModal() focuses the first control inside, and a phone draws a focus
    // ring on anything the page focuses itself, tap or not. Focus goes to the
    // view instead: no ring after a tap, one Tab to the control by keyboard.
    dialog.focus()
    // A modal dialog blocks clicks on the page behind it, not scrolling. A
    // reader who scrolls has moved on, so the view closes rather than trapping
    // them. The threshold lets a finger drift during a tap without closing it.
    const startY = window.scrollY
    const closeOnceScrolled = () => {
      if (Math.abs(window.scrollY - startY) > 48) dialog.close()
    }
    window.addEventListener("scroll", closeOnceScrolled, { passive: true })
    stopWatchingScroll.current = () => window.removeEventListener("scroll", closeOnceScrolled)
    onZoomChange?.(true)
  }

  const thumbnail = (
    /* eslint-disable-next-line @next/next/no-img-element -- a registry
       component installs into any React project, so it must not depend on
       next/image; the consumer swaps this for their framework's loader. */
    <img
      ref={thumbRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      srcSet={srcSet}
      sizes={sizes}
      loading="lazy"
      decoding="async"
      className={cn(
        "block h-auto w-full",
        !zoomable && bleedBoxClass,
        className
      )}
      {...imgProps}
    />
  )

  return (
    <figure data-slot="image" className={cn(figureClassName)}>
      {zoomable ? (
        <button
          type="button"
          onClick={openDialog}
          aria-label={alt ? `Enlarge: ${alt}` : "Enlarge image"}
          className={cn(
            "block w-full cursor-zoom-in",
            bleedBoxClass,
            "outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          )}
        >
          {thumbnail}
        </button>
      ) : (
        thumbnail
      )}

      {caption && (
        <figcaption className="text-muted-foreground mt-2 text-center text-sm">
          {caption}
        </figcaption>
      )}

      {zoomable &&
        mounted &&
        // Portaled to <body>, not rendered in place. A dialog promoted to the
        // top layer from inside a clipped ancestor (an `overflow-x: clip`
        // column, say) leaves WebKit painting its backdrop after close — dark
        // bands down both page edges on iOS. From <body> there's no clipped
        // ancestor to leave anything behind in. `mounted` keeps this SSR-safe.
        createPortal(
          <dialog
            ref={dialogRef}
            tabIndex={-1}
            onClick={() => dialogRef.current?.close()}
            onClose={() => {
              stopWatchingScroll.current?.()
              stopWatchingScroll.current = null
              onZoomChange?.(false)
            }}
            aria-label={
              alt
                ? `${alt} (enlarged). Press Escape to close.`
                : "Enlarged image. Press Escape to close."
            }
            style={{ "--zoom-ratio": ratio ?? 1 } as React.CSSProperties}
            className={cn(
              // `w-fit`, not `w-auto`: the UA centres a dialog with
              // `inset-inline: 0` + `margin: auto`, which only centres a
              // shrink-to-fit width. `auto` stretches across the viewport and
              // leaves the image pinned to its left edge.
              "group m-auto max-h-none w-screen max-w-none border-0 bg-transparent p-0 md:w-fit",
              // The view holds focus while open (see openDialog), and the
              // browser would ring it, boxing the one thing the reader opened
              // it to look at. The backdrop already says where focus is, and
              // Escape or a click anywhere closes it, so the ring adds nothing.
              "outline-none overscroll-contain cursor-zoom-out",
              // It fades and grows in, in CSS alone. There is no matching
              // exit: `close()` drops a dialog from the top layer at once.
              // ponytail: `overlay` and `display` are listed for the day a
              // browser defers that, as it already does for popovers.
              // Only the fade lives here. The grow is on the image below: a
              // scale on the dialog would make it the reference box for the
              // close control, pinning that to the picture, not the screen.
              "opacity-0 transition-[opacity,overlay,display] transition-discrete",
              "duration-(--motion-moderate) ease-spring",
              "open:opacity-100",
              "starting:open:opacity-0",
              // The page's own colour, not black: the veil is light on a light
              // screen and dark on a dark one, so opening a picture never
              // flips the room.
              "backdrop:bg-background/90 backdrop:opacity-0",
              "backdrop:transition-opacity backdrop:duration-(--motion-moderate) backdrop:ease-spring",
              "open:backdrop:opacity-100 starting:open:backdrop:opacity-0"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- see the
                thumbnail above. */}
            <img
              src={src}
              alt={alt}
              srcSet={srcSet}
              sizes={srcSet ? "100vw" : sizes}
              className={cn(
                "block h-auto max-h-dvh w-full max-w-none object-contain select-none",
                "scale-95 transition-[scale] duration-(--motion-moderate) ease-spring",
                "group-open:scale-100 starting:group-open:scale-95",
                // From md the box is sized, not just capped, by the viewport:
                // `min()` picks whichever edge binds first, a landscape image
                // meeting top/bottom and a portrait one meeting the sides.
                // `lvh`, not `dvh`, here — the dialog doesn't scroll, and
                // `dvh` would resize it on every mobile URL-bar animation.
                "md:h-auto md:max-h-[100lvh] md:max-w-[100vw] md:w-[min(100vw,calc(100lvh*var(--zoom-ratio,1)))]"
              )}
            />
            {children}
          </dialog>,
          document.body
        )}
    </figure>
  )
}

type ImageCloseProps = React.ComponentProps<"span">

/** Holds a close button in the enlarged view. It needs no handler: any click
 *  inside that view closes it, this one included. */
function ImageClose({ className, ...props }: ImageCloseProps) {
  return (
    <span
      data-slot="image-close"
      className={cn(
        // The screen's corner, not the picture's, so it is in the same place
        // for every image; `max()` keeps it clear of a notch. `cursor-auto`
        // because the dialog around it says zoom-out. The radius variable is
        // the one the registry's Button reads, so a Button here is a pill
        // unless it says otherwise.
        "fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))]",
        "cursor-auto [--radius-button:9999px]",
        className
      )}
      {...props}
    />
  )
}

export { Image, ImageClose }
export type { ImageProps, ImageCloseProps }
