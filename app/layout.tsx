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
import { SidebarLayout } from "@/app/components/sidebar-layout";

export const metadata: Metadata = {
  metadataBase: new URL("https://deltacomponents.dev"),
  title: "Delta Components",
  description: "An open source component library built on the Fluid Functionalism design system.",
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
    title: "Delta Components",
    description: "An open source component library built on the Fluid Functionalism design system.",
    images: [{ url: "/metadata/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Delta Components",
    description: "An open source component library built on the Fluid Functionalism design system.",
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
    <html lang="en" suppressHydrationWarning>
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
            for the whole system — see motion-guidelines.md. */}
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
