import { visibleComponents } from "@/lib/docs/components";
import { docPageAsMarkdown } from "@/lib/docs/llm-markdown";

/**
 * A doc page as `text/markdown`, reachable at `/docs/<slug>.md`.
 *
 * The `.md` URL is a rewrite onto this route (see next.config.ts): a page and
 * its markdown are the same document, so they should differ by an extension
 * rather than live under separate paths a reader has to learn.
 *
 * Static, like the pages themselves — the content is files in the repo, so
 * there is nothing to recompute per request.
 */
export const dynamic = "force-static";

// Serve only what generateStaticParams prerendered. Without this a slug it
// omits — a draft component — would still render on demand, publishing the
// page's source and props for a component the site otherwise hides.
export const dynamicParams = false;

export function generateStaticParams() {
  return visibleComponents.map((entry) => ({ slug: entry.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const markdown = await docPageAsMarkdown(slug);

  if (!markdown) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
