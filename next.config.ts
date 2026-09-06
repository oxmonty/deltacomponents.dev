import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG route reads its two Inter faces off disk at request time (see the
  // comment in app/og/route.tsx for why it can't fetch them). Nothing imports
  // them, so tracing has to be told they are needed or they don't ship.
  outputFileTracingIncludes: {
    "/og": ["./app/og/*.ttf"],
  },
};

export default nextConfig;
