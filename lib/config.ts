/** `https://<host>`, or undefined when the variable is unset. */
function origin(host: string | undefined): string | undefined {
  return host ? `https://${host}` : undefined;
}

/**
 * The canonical origin: the canonical link, og:url, metadataBase, the sitemap,
 * robots.txt, and the `shadcn add` URL the install tab prints.
 *
 * deltacomponents.dev is not served yet, so it is deliberately NOT the
 * fallback — hardcoding it would have every page canonicalise to a domain that
 * 404s, and would print an install command that cannot resolve. The deployment
 * names itself instead.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL`, not `VERCEL_URL`: the latter is the
 * per-deployment hostname, so every preview would self-canonicalise and each
 * push would move the registry URL. The former names the production domain
 * even when read from a preview build. Neither carries a scheme.
 *
 * The `NEXT_PUBLIC_` copy comes first because `installUrl` is read in the
 * browser by the install tab — Next only inlines that prefix into the client
 * bundle, and the bare name would be `undefined` there. Vercel sets both for a
 * Next.js project.
 *
 * Set `NEXT_PUBLIC_SITE_URL` to override — that is the switch to flip when the
 * real domain goes live, and the point at which this fallback can go back to
 * being a literal.
 */
const url =
  process.env.NEXT_PUBLIC_SITE_URL ||
  origin(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ||
  origin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  "http://localhost:4001";

/**
 * Single source of truth for who made this and where it lives. Metadata,
 * the robots/sitemap host, the GitHub star button and the author credit in
 * the properties panel all read from here.
 */
export const site = {
  name: "Delta Components",
  /** Derived, so it cannot name a different host than `url` does. */
  domain: new URL(url).host,
  url,
  description:
    "A curated collection of UI components, free and open source via the shadcn registry.",
  /** owner/name — the star count and the GitHub button both hang off this. */
  repo: "oxmonty/deltacomponents.dev",
  author: {
    name: "Patrick Prunty",
    url: "https://patrickprunty.com",
    /** Line-art portrait, shared with patrickprunty.com. Two cuts of the same
     *  drawing: the vector is the original, the raster is it rendered at 192px
     *  on white. The SVG is thousands of `<line>` elements, so the raster is
     *  the cheaper one where the avatar sits in the page's own scroll. */
    avatar: {
      vector: "/portrait.svg",
      raster: "/portrait.png",
    },
    email: "patrickprunty.business@gmail.com",
    twitter: "@pprunty_",
  },
  links: {
    github: "https://github.com/pprunty",
    twitter: "https://twitter.com/pprunty_",
    linkedin: "https://www.linkedin.com/in/patrickprunty/",
    substack: "https://substack.com/@pprunty",
    youtube: "https://www.youtube.com/@pprunty",
    strava: "https://www.strava.com/athletes/72636452",
    threads: "https://www.threads.com/@pprunty97",
  },
} as const;

export type SiteConfig = typeof site;
