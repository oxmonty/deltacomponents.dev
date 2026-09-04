export const REGISTRY_BASE_URL = "https://deltacomponents.dev/r";

export function installUrl(slug: string): string {
  return `${REGISTRY_BASE_URL}/${slug}.json`;
}
