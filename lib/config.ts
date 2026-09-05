/**
 * Single source of truth for who made this and where it lives. Metadata,
 * the robots/sitemap host, the GitHub star button and the author credit in
 * the properties panel all read from here.
 */
export const site = {
  name: "Delta Components",
  domain: "deltacomponents.dev",
  url: "https://deltacomponents.dev",
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
