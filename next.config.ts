import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG route reads its two Inter faces off disk at request time (see the
  // comment in app/og/route.tsx for why it can't fetch them). Nothing imports
  // them, so tracing has to be told they are needed or they don't ship.
  outputFileTracingIncludes: {
    "/og": ["./app/og/*.ttf"],
  },
  async rewrites() {
    return [
      // `/docs/tabs.md` serves the same page as plain markdown for an agent to
      // read. An extension rather than a separate path, so the two URLs are
      // obviously the same document. `.mdx` lands in the same place — it is
      // what someone who knows the file extension will try.
      { source: "/docs/:slug.md", destination: "/llm/:slug" },
      { source: "/docs/:slug.mdx", destination: "/llm/:slug" },
    ];
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

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // Frontmatter carries a page's description — the one fact that is about
    // the page rather than about where it sits in the site — as a named export
    // on the compiled module. Its title, order, grid size and status stay in
    // `componentList`, which the sidebar and showcase read; a title in both
    // places would be two copies free to disagree.
    //
    // Named, not imported: Turbopack passes loader options across a worker
    // boundary and rejects anything that isn't plain JSON, so a plugin
    // function here fails the build with "does not have serializable
    // options". The strings are resolved on the loader's side.
    remarkPlugins: [
      ["remark-gfm", {}],
      // "yaml", not `{}`: this plugin reads its options as the matter
      // definition, and an empty object is not one.
      ["remark-frontmatter", "yaml"],
      ["remark-mdx-frontmatter", { name: "frontmatter" }],
    ],
    // Stamps each heading with the id the contents rail links to.
    rehypePlugins: [["rehype-slug", {}]],
  },
});

export default withMDX(nextConfig);
