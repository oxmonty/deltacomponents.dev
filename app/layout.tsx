import type { Metadata } from "next";
import { cookies } from "next/headers";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/registry/default/lib/shape-context";
import { SizeProvider } from "@/registry/default/lib/size-context";
import { ThemeProvider } from "@/registry/default/lib/theme-context";
import { IconPlaygroundProvider } from "@/lib/docs/icon-playground";
import { ShapeShortcut } from "@/lib/docs/shape-shortcut";
import { SizeShortcut } from "@/lib/docs/size-shortcut";
import { SizeAttribute } from "@/lib/docs/size-attribute";
import { SettingsToast } from "@/lib/docs/settings-toast";
import { HashScroll } from "@/lib/docs/hash-scroll";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { site } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.name,
  description: site.description,
  icons: {
    icon: [
      { url: "/metadata/favicon.svg", type: "image/svg+xml" },
      { url: "/metadata/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/metadata/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/metadata/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/metadata/favicon.ico",
    apple: "/metadata/apple-touch-icon.png",
  },
  manifest: "/metadata/site.webmanifest",
  openGraph: {
    title: site.name,
    description: site.description,
    images: [{ url: "/metadata/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/metadata/og.png"],
  },
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
    // data-scroll-behavior is Next's opt-in: without it the router forces
    // `scroll-behavior: auto` for the duration of every route change, so the
    // smooth scroll in globals.css never applies to sidebar or pager
    // navigation. With it, both glide to the top of the new page.
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Dark mode is a class on <html>, so a system-dark visitor would get
            one light frame before ThemeProvider's effect runs. This blocks
            paint for a microsecond and applies it up front. Theme is not
            persisted, so the OS preference is the whole story. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      {/* Font smoothing (antialiased/grayscale) is set globally in globals.css */}
      <body>
        {/* reducedMotion="user" makes every framer-motion component honor the
            OS "reduce motion" setting: transform / scale / position / layout
            animations are dropped, opacity and color fades are kept. One switch
            for the whole system — see agents/motion-guidelines.md. */}
        <MotionConfig reducedMotion="user">
          <ShapeProvider defaultShape="rounded">
            <ShapeShortcut />
            <SizeProvider>
              <SizeShortcut />
              <SizeAttribute />
              <ThemeProvider>
                <IconPlaygroundProvider defaultLibrary="untitledui">
                  <SidebarLayout defaultOpen={sidebarDefaultOpen}>{children}</SidebarLayout>
                  <SettingsToast />
                  <HashScroll />
                  <Analytics />
                  <SpeedInsights />
                </IconPlaygroundProvider>
              </ThemeProvider>
            </SizeProvider>
          </ShapeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
