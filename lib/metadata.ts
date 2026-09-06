import type { Metadata } from "next";

import { site } from "@/lib/config";
import { componentList, labelOf } from "@/lib/docs/components";

interface CreateMetadataOptions {
  title: string;
  description: string;
  /** Site-relative path, e.g. "/docs/tabs". */
  path: string;
}

/** Builds a route's full `Metadata`, including the canonical URL and the
 *  matching OG/Twitter card image from `app/og/route.tsx`. Every route on the
 *  site should go through this so title/description only get typed once. */
export function createMetadata({ title, description, path }: CreateMetadataOptions): Metadata {
  const url = `${site.url}${path}`;
  const image = `/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: site.name,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: site.author.twitter,
    },
  };
}

/** Metadata for a component's doc page, sourced from its `componentList`
 *  entry so the title/description live in one place. */
export function componentMetadata(slug: string): Metadata {
  const entry = componentList.find((c) => c.slug === slug);
  if (!entry) {
    throw new Error(`componentMetadata: no entry for slug "${slug}" in componentList`);
  }

  return createMetadata({
    title: labelOf(entry),
    description: entry.description,
    path: `/docs/${slug}`,
  });
}
