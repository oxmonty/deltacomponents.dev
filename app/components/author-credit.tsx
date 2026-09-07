import { cn } from "@/registry/lib/utils";
import { site } from "@/lib/config";

/**
 * "Created by <author>" with the portrait as an avatar, linking out to the
 * author's site. Rendered in the desktop properties panel and, below xl where
 * that panel is gone, in the site footer under every page.
 */
export function AuthorCredit({
  className,
  /** How the portrait is drawn.
   *
   *  `printed` (default) puts the raster on a white disc, so the portrait is
   *  the drawing itself in both themes and costs the browser one image instead
   *  of a few thousand `<line>` elements. It still damps at rest and comes up
   *  to full on hover, tracking the label beside it — a raster can't take the
   *  link's colour the way a mask can, so opacity carries that instead.
   *
   *  `tinted` paints the vector as a CSS mask in the link's own colour, so the
   *  avatar inherits the muted → foreground transition literally. */
  avatar = "printed",
}: {
  className?: string;
  avatar?: "tinted" | "printed";
}) {
  const tinted = avatar === "tinted";
  const src = tinted ? site.author.avatar.vector : site.author.avatar.raster;

  return (
    <a
      href={site.author.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group text-body text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 rounded transition-colors duration-80",
        "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-6 shrink-0 rounded-full",
          tinted
            ? // The mask takes currentColor, so the portrait inherits the link's
              // muted → foreground transition rather than sitting at full
              // strength beside a dimmed label.
              "bg-current"
            : // The raster ships with its own white ground; bg-white covers the
              // corners the circle crops. Damped at rest so it sits at the
              // weight of the muted label rather than shouting beside it,
              // and up to full on hover with the label.
              "bg-white bg-contain bg-center bg-no-repeat opacity-70 transition-opacity duration-80 group-hover:opacity-100"
        )}
        style={
          tinted
            ? {
                maskImage: `url(${src})`,
                WebkitMaskImage: `url(${src})`,
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                maskSize: "contain",
                WebkitMaskSize: "contain",
              }
            : { backgroundImage: `url(${src})` }
        }
      />
      Created by {site.author.name}
    </a>
  );
}
