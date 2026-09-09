import type { MetadataRoute } from "next";

import { site } from "@/lib/config";
import { sectionList, visibleComponents } from "@/lib/docs/components";

const SITE_URL = site.url;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = [
    ...sectionList.map((section) => section.href),
    ...visibleComponents.map((c) => `/docs/${c.slug}`),
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route.startsWith("/docs") ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/docs") ? 0.8 : 0.5,
  }));
}
