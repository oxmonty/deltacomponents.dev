"use client"

import * as React from "react"

import { cn } from "@/registry/lib/utils"
import { classifyUrl, type EmbedSource } from "@/registry/lib/embed"
import { Image, type ImageProps } from "@/registry/ui/image"
import type { LinkPreviewData } from "@/registry/lib/link-preview"

// loading="lazy" does defer the request, but the browser starts it thousands
// of pixels before the viewport, so a player far down a page still loads with
// it. Holding the src back until the element is about to be seen is tighter.
function useNearViewport<T extends Element>(
  ref: React.RefObject<T | null>,
  rootMargin = "200px"
): boolean {
  const [near, setNear] = React.useState(false)

  React.useEffect(() => {
    if (near) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setNear(true)
        observer.disconnect()
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, near, rootMargin])

  return near
}

interface EmbedProps {
  url: string
  className?: string
  /** Where `LinkPreview` fetches a plain link's title, description and image
   *  from. `null` turns the fetch off. */
  endpoint?: string | null
}

/** Turns an arbitrary URL into whichever embed fits it, or nothing at all.
 *  Trusts `classifyUrl` completely — a `link` classification renders as a
 *  card, not an iframe, and anything it refuses renders nothing. */
function Embed({ url, className, endpoint }: EmbedProps) {
  const source = classifyUrl(url)
  if (!source) return null
  return <EmbedFromSource source={source} className={className} endpoint={endpoint} />
}

function EmbedFromSource({
  source,
  className,
  endpoint,
}: {
  source: EmbedSource
  className?: string
  endpoint?: string | null
}) {
  switch (source.kind) {
    case "youtube":
      return <YouTubeEmbed videoId={source.videoId} className={className} />
    case "spotify":
      return <SpotifyEmbed type={source.type} id={source.id} className={className} />
    case "image":
      return <ImageEmbed src={source.url} className={className} />
    case "video":
      return <VideoEmbed src={source.url} className={className} />
    case "link":
      return <LinkPreview url={source.url} className={className} endpoint={endpoint} />
  }
}

interface YouTubeEmbedProps {
  videoId: string
  title?: string
  className?: string
}

// A facade: the real player is close to a megabyte of third-party script, and
// a page shouldn't pay for it until someone actually presses play. Until
// then this is a thumbnail and a button.
function YouTubeEmbed({ videoId, title = "YouTube video", className }: YouTubeEmbedProps) {
  // A phone will not start a video with sound unless the tap landed inside
  // the player, and this one lands on the thumbnail. Asked to autoplay with
  // sound, YouTube falls back to its own play button and the viewer taps
  // twice. Muted autoplay is allowed, so a touch device starts that way.
  const [playing, setPlaying] = React.useState<false | "sound" | "muted">(false)
  // 1280x720 is the largest thumbnail YouTube publishes, and it only exists
  // for some videos. A missing one is not an error: YouTube answers 404 with
  // a valid 120x90 grey placeholder, which loads fine. It is 4:3 where the
  // real one is 16:9, which is how onLoad below tells them apart. Keyed on
  // the id so a new video gets a fresh try.
  const [withoutLargeThumbnail, setWithoutLargeThumbnail] = React.useState<string | null>(null)
  const thumbnailSrc =
    withoutLargeThumbnail === videoId
      ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
      : `https://i.ytimg.com/vi_webp/${encodeURIComponent(videoId)}/maxresdefault.webp`

  return (
    <div
      data-slot="youtube-embed"
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-muted",
        "rounded-[var(--radius-bg,var(--radius,0.5rem))]",
        className
      )}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1${
            playing === "muted" ? "&mute=1&playsinline=1" : ""
          }`}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() =>
            setPlaying(window.matchMedia("(pointer: coarse)").matches ? "muted" : "sound")
          }
          aria-label={`Play: ${title}`}
          className={cn(
            "group absolute inset-0 h-full w-full cursor-pointer",
            "outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          )}
        >
          {/* hqdefault is 4:3 with black bars top and bottom; cover crops
              them out instead of letterboxing the thumbnail. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- a registry
              component installs into any React project, so it must not depend
              on next/image; the consumer swaps this for their framework's
              loader. */}
          <img
            src={thumbnailSrc}
            onLoad={(event) => {
              const image = event.currentTarget
              const isPlaceholder =
                image.currentSrc.includes("maxresdefault") &&
                image.naturalWidth / image.naturalHeight < 1.5
              if (isPlaceholder) setWithoutLargeThumbnail(videoId)
            }}
            onError={() => setWithoutLargeThumbnail(videoId)}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {/* Our own drawing, not YouTube's mark: a plain rounded rectangle
                in their red, which is how their player shows its button. The
                red is a literal because it is a brand colour, not one of the
                theme's. */}
            <svg viewBox="0 0 68 48" className="h-12 w-[68px]">
              <rect
                width="68"
                height="48"
                rx="12"
                className={cn(
                  "fill-[#f00] transition-colors duration-(--motion-fast) ease-spring",
                  "group-hover:fill-[#c00]"
                )}
              />
              <path d="M27 14v20l18-10z" className="fill-white" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}

interface SpotifyEmbedProps {
  type: "track" | "playlist" | "album" | "episode" | "show"
  id: string
  className?: string
}

function SpotifyEmbed({ type, id, className }: SpotifyEmbedProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref)
  const height = type === "track" || type === "episode" ? 152 : 352

  return (
    <div
      ref={ref}
      data-slot="spotify-embed"
      className={cn("w-full", className)}
      style={{ height }}
    >
      {near && (
        <iframe
          src={`https://open.spotify.com/embed/${type}/${encodeURIComponent(id)}`}
          title="Spotify player"
          allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture"
          className="block h-full w-full border-0"
          // Spotify's own card already has 12px corners; any other radius
          // shows the iframe's background in them, and `normal` keeps a dark
          // page from painting an opaque canvas behind the transparent ones.
          // Literal 12px on purpose — the site's radius tokens are
          // user-adjustable and would fight Spotify's fixed corners.
          style={{ borderRadius: 12, colorScheme: "normal" }}
        />
      )}
    </div>
  )
}

interface VideoEmbedProps extends Omit<React.ComponentProps<"video">, "src" | "className"> {
  src: string
  className?: string
}

function VideoEmbed({ src, className, ...videoProps }: VideoEmbedProps) {
  const ref = React.useRef<HTMLVideoElement>(null)
  const near = useNearViewport(ref)
  // Safari, on a phone above all, fetches the metadata and then paints
  // nothing until play. Asking for a moment just past zero makes it decode
  // and show the opening frame. The fragment never reaches the server.
  const framed = src.includes("#") ? src : `${src}#t=0.001`

  return (
    <video
      ref={ref}
      data-slot="video-embed"
      controls
      // Without this, iOS takes the video fullscreen the moment it plays.
      playsInline
      preload="metadata"
      src={near ? framed : undefined}
      className={cn(
        "aspect-video w-full rounded-[var(--radius-bg,var(--radius,0.5rem))]",
        className
      )}
      {...videoProps}
    />
  )
}

type ImageEmbedProps = Omit<ImageProps, "alt"> & {
  /** Optional here, unlike on Image: a pasted URL never came with any. */
  alt?: string
}

// The registry's Image, so an embedded picture enlarges on a click like any
// other. No referrer by default: the URL is usually someone else's server.
function ImageEmbed({ alt = "", ...props }: ImageEmbedProps) {
  return <Image alt={alt} referrerPolicy="no-referrer" {...props} />
}

interface LinkPreviewProps {
  url: string
  /** The page's title. Passing it turns the plain card into a full preview
   *  and skips the fetch entirely. */
  title?: string
  /** One or two lines under the title. Passing it skips the fetch. */
  description?: string
  /** A thumbnail. Passing it skips the fetch. */
  image?: string
  className?: string
  /** Where the title, description and image are fetched from when none of
   *  them are passed. `null` turns the fetch off. */
  endpoint?: string | null
}

// A remount (the editor remounts widgets) shouldn't refetch a URL it already
// has an answer for.
// ponytail: unbounded, lives as long as the page. Cap it if a page can show
// thousands of distinct links.
const previewCache = new Map<string, Promise<LinkPreviewData | null>>()

// The card draws what it is given, and fetches the rest itself. A page's
// title and thumbnail have to come from a server — a browser can't read
// another site's HTML — so with no `title`/`description`/`image` prop and an
// `endpoint`, it asks the route for them; a bare URL and no endpoint stays a
// plain card.
function LinkPreview({ url, title, description, image, className, endpoint = "/api/link-preview" }: LinkPreviewProps) {
  // The part is exported, so it can be handed a URL `Embed` would have
  // refused. Anything but http(s) — `javascript:` above all — is not a link
  // this renders.
  const allowed = isHttpUrl(url)
  const [fetched, setFetched] = React.useState<LinkPreviewData | null>(null)

  React.useEffect(() => {
    if (!allowed || title || !endpoint) return
    const key = `${endpoint}\n${url}`
    let request = previewCache.get(key)
    if (!request) {
      // Shared by every card showing this URL, so no one card's unmount may
      // abort it — and a failure is dropped, so a later card can try again.
      request = fetch(`${endpoint}?url=${encodeURIComponent(url)}`)
        .then((response) => (response.ok ? (response.json() as Promise<LinkPreviewData>) : null))
        .catch(() => null)
        .then((data) => {
          if (!data) previewCache.delete(key)
          return data
        })
      previewCache.set(key, request)
    }
    let cancelled = false
    request.then((data) => {
      if (!cancelled) setFetched(data)
    })
    return () => {
      cancelled = true
    }
  }, [allowed, title, endpoint, url])

  if (!allowed) return null
  const hostname = new URL(url).hostname.replace(/^www\./, "")

  const resolvedTitle = title ?? fetched?.title ?? undefined
  const resolvedDescription = description ?? fetched?.description ?? undefined
  const rawImage = image ?? fetched?.image ?? undefined
  // Taken from an untrusted page. The route already limits it to http(s),
  // but this component can't assume its own copy is what's deployed.
  const resolvedImage = rawImage && isHttpUrl(rawImage) ? rawImage : undefined

  return (
    <a
      data-slot="link-preview"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "border-border/60 bg-card relative flex w-full flex-col overflow-hidden border sm:flex-row",
        "rounded-[var(--radius-bg,var(--radius,0.5rem))]",
        // A wash laid over the card rather than a second fill: `--hover` is
        // translucent, so as the background itself it would replace the
        // card's colour, and in dark mode it lands on exactly that colour.
        "after:pointer-events-none after:absolute after:inset-0 after:bg-[var(--hover)] after:opacity-0",
        "after:transition-opacity after:duration-(--motion-fast) after:ease-spring",
        "hover:after:opacity-100 active:after:bg-[var(--active)]",
        "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        className
      )}
    >
      {resolvedImage && (
        /* eslint-disable-next-line @next/next/no-img-element -- a registry
           component installs into any React project, so it must not depend on
           next/image; the consumer swaps this for their framework's loader. */
        <img
          src={resolvedImage}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="aspect-[1.91/1] w-full shrink-0 object-cover sm:w-48"
        />
      )}
      <span className="flex min-w-0 flex-col justify-center gap-0.5 p-3">
        <span className="text-foreground truncate font-medium">{resolvedTitle ?? hostname}</span>
        {resolvedDescription && (
          <span className="text-muted-foreground line-clamp-2 text-sm">{resolvedDescription}</span>
        )}
        <span className="text-muted-foreground truncate text-sm">
          {resolvedTitle ? hostname : url}
        </span>
      </span>
    </a>
  )
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

export { Embed, YouTubeEmbed, SpotifyEmbed, VideoEmbed, ImageEmbed, LinkPreview }
export type {
  EmbedProps,
  YouTubeEmbedProps,
  SpotifyEmbedProps,
  VideoEmbedProps,
  ImageEmbedProps,
  LinkPreviewProps,
}
