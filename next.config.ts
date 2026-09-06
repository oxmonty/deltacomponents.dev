import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG route reads its two Inter faces off disk at request time (see the
  // comment in app/og/route.tsx for why it can't fetch them). Nothing imports
  // them, so tracing has to be told they are needed or they don't ship.
  outputFileTracingIncludes: {
    "/og": ["./app/og/*.ttf"],
  },
  experimental: {
    // Lets `scroll-behavior: smooth` survive a route change, so the sidebar
    // and the bottom pager glide back to the top instead of snapping. Without
    // it the router forces `scroll-behavior: auto` around every navigation.
    // It only skips that when <html> carries no `data-scroll-behavior`, which
    // is why the root layout deliberately has none. Default from Next 16 on —
    // it is how the previous site got this for free.
    optimizeRouterScrolling: true,
  },
};

export default nextConfig;
