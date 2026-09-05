import { site } from "@/lib/config";

export const REGISTRY_BASE_URL = `${site.url}/r`;

export function installUrl(slug: string): string {
  return `${REGISTRY_BASE_URL}/${slug}.json`;
}
