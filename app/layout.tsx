import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/lib/docs/shape-context";
import { SizeProvider } from "@/lib/docs/size-context";
import { ThemeProvider } from "@/lib/theme-context";
import { IconPlaygroundProvider } from "@/lib/docs/icon-playground";
import { ShapeShortcut } from "@/lib/docs/shape-shortcut";
import { SizeShortcut } from "@/lib/docs/size-shortcut";
import { SettingsToast } from "@/lib/docs/settings-toast";
import { HashScroll } from "@/lib/docs/hash-scroll";
import { RouteScrollTop } from "@/lib/docs/route-scroll";
import { TooltipProvider } from "@/registry/ui/tooltip";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { MetaThemeColor } from "@/app/components/meta-theme-color";
import { site } from "@/lib/config";
import { createMetadata } from "@/lib/metadata";
import { inter } from "@/app/fonts";

/** `--background` per theme, mirrored from globals.css. iOS paints its
 *  address bar with this, so a value off by a shade reads as a seam across
 *  the bottom of the screen. */
const META_THEME_COLORS = { light: "#FAFAFA", dark: "#171717" };

// The root defaults every route inherits and merges over. `createMetadata`
// supplies the dynamic OG card; the icons and manifest are site-wide and have
// nowhere else to live. The title template is what turns a child page's plain
// `title` ("Tabs") into the full tab label.
/** `viewport-fit=cover` is the one that earns its place: without it iOS
 *  resolves `env(safe-area-inset-*)` to 0, and the footer's bottom padding
 *  (`calc(6rem + env(safe-area-inset-bottom))`) exists precisely to clear the
 *  home indicator. Deliberately no `themeColor` here — the root `<head>`
 *  writes that tag itself so the blocking script and MetaThemeColor can keep
 *  it in step with the theme. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `cover` so the page owns the full display — the mobile footer's
  // `env(safe-area-inset-bottom)` is zero without it.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  ...createMetadata({
    title: site.name,
    description: site.description,
    path: "/",
  }),
  title: {
    default: site.name,
    template: `%s — ${site.name}`,
  },
  icons: {
    icon: [
      { url: "/metadata/favicon.svg", type: "image/svg+xml" },
      { url: "/metadata/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/metadata/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/metadata/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/metadata/favicon.ico",
    apple: [
      { url: "/metadata/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      // Safari pinned tabs. The SVG is monochrome line art, which is the only
      // thing this rel accepts.
      { rel: "mask-icon", url: "/metadata/favicon.svg", color: "#171717" },
    ],
  },
  manifest: "/metadata/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side read of the sidebar's persisted open state so the rail
  // renders in its last position with no post-hydration flicker. A missing
  // cookie means open — the component's own default.
  const cookieStore = await cookies();
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    // Deliberately NO data-scroll-behavior attribute. It reads like the opt-in
    // for smooth route scrolling and is the opposite: it tells the router the
    // page uses smooth scrolling so it can force `scroll-behavior: auto` for
    // the duration of every navigation. Left off (with
    // `experimental.optimizeRouterScrolling` on — see next.config.ts) the
    // router scrolls without touching the style, so the smooth scroll in
    // globals.css applies and sidebar and pager navigation glide to the top.
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* iOS Safari tints its address bar with this and shows the page
            through it when it is unset — which left the site visible in the
            bottom strip while the mobile nav covered the rest of the screen.
            Written before the script below so the script has a tag to find;
            MetaThemeColor keeps it in step after mount. */}
        <meta name="theme-color" content={META_THEME_COLORS.light} />
        {/* Dark mode is a class on <html>, so a system-dark visitor would get
            one light frame before ThemeProvider's effect runs. This blocks
            paint for a microsecond and applies it up front — the class and the
            address-bar tint together. Theme is not persisted, so the OS
            preference is the whole story. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');document.querySelector('meta[name="theme-color"]').setAttribute('content','${META_THEME_COLORS.dark}')}}catch(e){}`,
          }}
        />
      </head>
      {/* Font smoothing (antialiased/grayscale) is set globally in globals.css.
          next/font's variable is on <html>, not here: globals.css reads it from
          :root, and a custom property is only visible to the element that
          declares it and its descendants — declared on <body> it is invalid at
          :root, and every font-family falls back to Times. */}
      <body>
        {/* The OS "reduce motion" setting is honored globally in CSS: section 7
            of globals.css zeroes every motion tier under
            `prefers-reduced-motion: reduce`, so every transition on the site
            collapses to instant with no per-component switch needed — see
            agents/motion-guidelines.md. */}
        <ShapeProvider defaultShape="rounded">
          <ShapeShortcut />
          <SizeProvider>
            <SizeShortcut />
            <ThemeProvider>
              <IconPlaygroundProvider defaultLibrary="untitledui">
                {/* One provider for the whole site so the tooltips share a
                    skip-delay group: after the first one opens, moving along a
                    row of icon buttons shows the rest instantly instead of
                    re-waiting the hover delay. Without it every Tooltip falls
                    back to its own provider and the grouping is lost. */}
                <TooltipProvider>
                  <SidebarLayout defaultOpen={sidebarDefaultOpen}>{children}</SidebarLayout>
                  <SettingsToast />
                  <HashScroll />
                  <RouteScrollTop />
                  <MetaThemeColor colors={META_THEME_COLORS} />
                  <Analytics />
                  <SpeedInsights />
                </TooltipProvider>
              </IconPlaygroundProvider>
            </ThemeProvider>
          </SizeProvider>
        </ShapeProvider>
      </body>
    </html>
  );
}
