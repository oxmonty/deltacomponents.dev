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
  /** Rendered inside the enlarged view, over the picture: an `ImageClose`,
   *  say. An `ImageCaption` child is the one exception — it goes under the
   *  picture, like the `caption` prop. The rest is ignored when `zoomable`
   *  is false. */
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
  const zoomImgRef = React.useRef<HTMLImageElement>(null)
  // The pinch/pan gesture writes straight to the img's style, not React state
  // (see motion-guidelines.md) — `pinch` is the current transform, `gesture`
  // the in-progress touch(es) driving it.
  const pinch = React.useRef<Pinch>({ scale: 1, x: 0, y: 0 })
  const gesture = React.useRef<{
    pinchStart: PinchStart | null
    pan: { panX: number; panY: number } | null
  }>({ pinchStart: null, pan: null })
  // A caption written as a child belongs to the figure, not the dialog, so
  // the two are told apart here rather than by asking callers to nest twice.
  const captionChildren: React.ReactNode[] = []
  const overlayChildren: React.ReactNode[] = []
  for (const child of React.Children.toArray(children)) {
    const isCaption = React.isValidElement(child) && child.type === ImageCaption
    if (isCaption) captionChildren.push(child)
    else overlayChildren.push(child)
  }
  const [mounted, setMounted] = React.useState(false)
  const [measuredRatio, setMeasuredRatio] = React.useState<number | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  // Set while the view is open; see openDialog.
  const stopWatchingScroll = React.useRef<(() => void) | null>(null)
  React.useEffect(() => () => stopWatchingScroll.current?.(), [])

  // Known from the props when given; otherwise read off the thumbnail once
  // its pixels are in. `width`/`height` land during SSR, so most callers only
  // pay the effect for the loaded flag that ends the pulse.
  const knownRatio = width && height ? width / height : undefined
  const ratio = knownRatio ?? measuredRatio ?? undefined
  // Unknown ratio reads as not landscape, so bleed never fires on a guess.
  const landscape = ratio !== undefined && ratio > 1

  React.useEffect(() => {
    setLoaded(false)
    const node = thumbRef.current
    if (!node) return
    const measure = () => {
      setLoaded(true)
      if (knownRatio || !node.naturalWidth || !node.naturalHeight) return
      setMeasuredRatio(node.naturalWidth / node.naturalHeight)
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
  // `settling` lifts `data-pinching` so the CSS transition carries the snap
  // back to 1x or the clamp back into bounds; mid-gesture it stays off so the
  // picture tracks the fingers with no lag.
  const writePinch = (next: Pinch, settling: boolean) => {
    pinch.current = next
    const img = zoomImgRef.current
    if (!img) return
    img.style.setProperty("--pinch-scale", String(next.scale))
    img.style.setProperty("--pinch-x", `${next.x}px`)
    img.style.setProperty("--pinch-y", `${next.y}px`)
    if (settling) img.removeAttribute("data-pinching")
    else img.setAttribute("data-pinching", "")
  }

  const onZoomTouchStart = (event: React.TouchEvent<HTMLImageElement>) => {
    const img = zoomImgRef.current
    if (!img) return
    const touches = event.touches
    if (touches.length >= 2) {
      const a = touches[0]
      const b = touches[1]
      const rect = img.getBoundingClientRect()
      const midX = (a.clientX + b.clientX) / 2
      const midY = (a.clientY + b.clientY) / 2
      gesture.current.pinchStart = {
        ...pinch.current,
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        midX,
        midY,
        // Scale is about the box's centre, so the transformed box's centre is
        // `center + translate` — subtracting the current translate recovers it.
        centerX: rect.left + rect.width / 2 - pinch.current.x,
        centerY: rect.top + rect.height / 2 - pinch.current.y,
      }
      gesture.current.pan = null
      writePinch(pinch.current, false)
    } else if (touches.length === 1 && pinch.current.scale > 1) {
      const t = touches[0]
      gesture.current.pan = { panX: t.clientX - pinch.current.x, panY: t.clientY - pinch.current.y }
      writePinch(pinch.current, false)
    }
  }

  const onZoomTouchMove = (event: React.TouchEvent<HTMLImageElement>) => {
    const { pinchStart, pan } = gesture.current
    const touches = event.touches
    if (touches.length >= 2 && pinchStart) {
      const a = touches[0]
      const b = touches[1]
      writePinch(
        pinchTo(pinchStart, {
          dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          midX: (a.clientX + b.clientX) / 2,
          midY: (a.clientY + b.clientY) / 2,
        }),
        false
      )
    } else if (touches.length === 1 && pan) {
      const t = touches[0]
      writePinch({ ...pinch.current, x: t.clientX - pan.panX, y: t.clientY - pan.panY }, false)
    }
  }

  const onZoomTouchEnd = (event: React.TouchEvent<HTMLImageElement>) => {
    const touches = event.touches
    if (touches.length < 2) gesture.current.pinchStart = null
    if (touches.length === 1 && pinch.current.scale > 1) {
      // The finger still down keeps moving the picture rather than freezing it.
      const t = touches[0]
      gesture.current.pan = { panX: t.clientX - pinch.current.x, panY: t.clientY - pinch.current.y }
      return
    }
    if (touches.length > 0) return
    gesture.current.pan = null
    const img = zoomImgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const box = { width: rect.width / pinch.current.scale, height: rect.height / pinch.current.scale }
    writePinch(settlePinch(pinch.current, box), true)
  }

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
        // Pulses the image's own box (sized by width/height, or the
        // aspect-ratio the browser maps from them) — no wrapper element, so
        // nothing fights the bleed margins below.
        !loaded && "bg-muted animate-pulse",
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
            // A press dips the picture, so it reads as something that opens
            // rather than a picture that happens to be there. Moderate, not
            // fast: a scale across a whole picture is travel, and 80ms of it
            // reads as a snap. The release is one tier quicker, as usual.
            "transition-[scale] duration-(--motion-moderate-exit) ease-spring active:scale-[0.96] active:duration-(--motion-moderate) [-webkit-tap-highlight-color:transparent]",
            // `rounded-none` beats the base-layer `:focus-visible` radius, which
            // would round the ring's corners off a square picture.
            "rounded-none outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          )}
        >
          {thumbnail}
        </button>
      ) : (
        thumbnail
      )}

      {caption && <ImageCaption>{caption}</ImageCaption>}
      {captionChildren}

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
              writePinch({ scale: 1, x: 0, y: 0 }, true)
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
              // `rounded-none` for the same reason: a phone treats that focus
              // as focus-visible, and the base-layer radius that comes with it
              // clipped the corners off a full-width picture.
              // The UA gives a modal dialog `overflow: auto`, which would clip
              // a pinch-zoomed picture into a scrollable box instead of
              // letting it grow over the backdrop.
              "rounded-none outline-none overflow-visible cursor-zoom-out",
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
              ref={zoomImgRef}
              src={src}
              alt={alt}
              srcSet={srcSet}
              sizes={srcSet ? "100vw" : sizes}
              draggable={false}
              onClick={(event) => {
                // A tap that only ends a zoomed picture's gesture shouldn't
                // also bubble to the dialog's own click-anywhere-closes.
                if (pinch.current.scale > 1) event.stopPropagation()
              }}
              onTouchStart={onZoomTouchStart}
              onTouchMove={onZoomTouchMove}
              onTouchEnd={onZoomTouchEnd}
              onTouchCancel={onZoomTouchEnd}
              className={cn(
                "block h-auto max-h-dvh w-full max-w-none object-contain select-none",
                "scale-95 transition-[scale,translate] duration-(--motion-moderate) ease-spring",
                "group-open:scale-[var(--pinch-scale,1)] starting:group-open:scale-95",
                "translate-x-[var(--pinch-x,0px)] translate-y-[var(--pinch-y,0px)]",
                // The gesture drives the picture directly; the transition only
                // carries the settle after the fingers lift. `touch-none`
                // means a finger dragged on the picture no longer scrolls the
                // page, so scroll-to-close on touch comes from the backdrop.
                // Pinch/pan is touch-only by design — a trackpad pinch here
                // stays the browser's own page zoom.
                "touch-none data-[pinching]:transition-none [-webkit-touch-callout:none]",
                // From md the box is sized, not just capped, by the viewport:
                // `min()` picks whichever edge binds first, a landscape image
                // meeting top/bottom and a portrait one meeting the sides.
                // `lvh`, not `dvh`, here — the dialog doesn't scroll, and
                // `dvh` would resize it on every mobile URL-bar animation.
                "md:h-auto md:max-h-[100lvh] md:max-w-[100vw] md:w-[min(100vw,calc(100lvh*var(--zoom-ratio,1)))]"
              )}
            />
            {overlayChildren}
          </dialog>,
          document.body
        )}
    </figure>
  )
}

type ImageCaptionProps = React.ComponentProps<"figcaption">

/** The line under the picture. `Image` renders its `caption` prop through
 *  this; pass it as a child instead to change its classes or markup. */
function ImageCaption({ className, ...props }: ImageCaptionProps) {
  return (
    <figcaption
      data-slot="image-caption"
      className={cn("text-muted-foreground mt-2 text-center text-sm", className)}
      {...props}
    />
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

const MAX_ZOOM = 4
// Under this the pinch was a fumble, not a zoom, and the picture goes back.
const SNAP_BACK_BELOW = 1.05

type Pinch = { scale: number; x: number; y: number }
type PinchStart = Pinch & {
  dist: number
  midX: number
  midY: number
  // The picture's untransformed centre, in client coordinates.
  centerX: number
  centerY: number
}

/** Where the picture goes so the point between the two fingers stays under them. */
function pinchTo(start: PinchStart, now: { dist: number; midX: number; midY: number }): Pinch {
  const scale = Math.min(MAX_ZOOM, Math.max(1, (start.scale * now.dist) / start.dist))
  const k = scale / start.scale
  return {
    scale,
    x: now.midX - start.centerX - k * (start.midX - start.centerX - start.x),
    y: now.midY - start.centerY - k * (start.midY - start.centerY - start.y),
  }
}

/** Where the picture settles when the fingers lift: back to 1x after a fumble,
 *  otherwise pulled back so it still covers its own box. */
function settlePinch(pinch: Pinch, box: { width: number; height: number }): Pinch {
  if (pinch.scale < SNAP_BACK_BELOW) return { scale: 1, x: 0, y: 0 }
  const maxX = ((pinch.scale - 1) * box.width) / 2
  const maxY = ((pinch.scale - 1) * box.height) / 2
  return {
    scale: pinch.scale,
    x: Math.min(maxX, Math.max(-maxX, pinch.x)),
    y: Math.min(maxY, Math.max(-maxY, pinch.y)),
  }
}

export { Image, ImageCaption, ImageClose, pinchTo, settlePinch }
export type { ImageProps, ImageCaptionProps, ImageCloseProps }
