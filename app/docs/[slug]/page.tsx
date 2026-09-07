import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { componentList } from "@/lib/docs/components";
import { DocPage } from "@/lib/docs/DocPage";
import { mdxBodyClass } from "@/lib/docs/mdx-components";
import { componentMetadata } from "@/lib/metadata";

/**
 * Every component's doc page. The body is `content/docs/<slug>.mdx`; the
 * chrome around it — title, description, prev/next — comes from that slug's
 * entry in `componentList`, which the sidebar and showcase read too.
 *
 * One route replaces the seven page.tsx files this used to take, and the five
 * layout.tsx files that existed only to carry a `metadata` export past a
 * `"use client"` page. A server route can export `generateMetadata` itself.
 */
export function generateStaticParams() {
  return componentList.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return componentMetadata(slug);
}

export default async function ComponentDoc({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!componentList.some((entry) => entry.slug === slug)) notFound();

  // Turbopack resolves this as a context module over `content/docs`, so the
  // MDX is compiled at build time like any other import — no runtime MDX
  // compiler, and an unknown slug is caught by the guard above rather than by
  // a failed import.
  const { default: Content } = await import(`@/content/docs/${slug}.mdx`);

  return (
    <DocPage slug={slug}>
      <div className={mdxBodyClass}>
        <Content />
      </div>
    </DocPage>
  );
}
