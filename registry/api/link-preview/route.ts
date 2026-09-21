import { fetchLinkPreview, LinkPreviewError } from "@/registry/lib/link-preview";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const data = await fetchLinkPreview(url);
    // Only the extracted fields ever leave this route, never the page body —
    // so it can't be used as a general-purpose proxy.
    return Response.json(data, {
      headers: { "cache-control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch (error) {
    if (error instanceof LinkPreviewError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Could not fetch the page" }, { status: 502 });
  }
}

// Rate limiting is deployment-specific (a CDN, middleware, an API gateway)
// and is left to the consumer.
