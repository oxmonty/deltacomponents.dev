"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { cn } from "@/registry/default/lib/utils";
import { TOC } from "@/lib/docs/toc.generated";

/** Whichever heading the reader is currently under. The bottom 80% of the
 *  viewport is excluded so a heading only claims the highlight once it has
 *  reached the top band, rather than the moment it scrolls into view. */
function useActiveId(ids: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0% 0% -80% 0%" }
    );

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/** "On this page" — the docs table of contents, above the properties panel. */
export function DocsToc({ className }: { className?: string }) {
  // Read straight from the build-time manifest rather than scanning the DOM.
  // A scan can only run after the first paint, which is what made the panel
  // appear a frame late and shove the properties card down the rail; this
  // renders with the rest of the page, server side included.
  const pathname = usePathname();
  // Memoised on the route, not on `entries`: the `?? []` fallback would hand
  // back a fresh array every render and restart the observer with it.
  const entries = useMemo(() => TOC[pathname] ?? [], [pathname]);
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const activeId = useActiveId(ids);

  // One heading is the page itself; a list of one is noise.
  if (entries.length < 2) return null;

  // www's shape: a quiet label rather than a heading, and a column of links a
  // step below body size — the panel's job is to be glanceable while you read
  // the page, not to compete with it. Depth rides a data attribute so the
  // indent is one rule rather than a conditional per level.
  return (
    <nav
      aria-label="On this page"
      className={cn("flex flex-col gap-2 text-sm", className)}
    >
      {/* Semibold at 12px: the label has to hold its own as a heading against
          the column of links under it without growing to compete with the
          "Customise" title below. */}
      <p
        className="text-muted-foreground text-xs"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        On This Page
      </p>
      {entries.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          data-active={entry.id === activeId}
          data-depth={entry.depth}
          className={cn(
            "text-muted-foreground hover:text-foreground data-[active=true]:text-foreground rounded text-[0.8rem] transition-colors duration-80",
            // Underline on hover and on the section you are currently in, so
            // the active entry is marked twice over — colour alone is a weak
            // signal at this size, and it is the only one on a mono-tone rail.
            "no-underline underline-offset-4 hover:underline data-[active=true]:underline",
            "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2",
            "data-[depth=3]:pl-4 data-[depth=4]:pl-6"
          )}
        >
          {entry.text}
        </a>
      ))}
    </nav>
  );
}
