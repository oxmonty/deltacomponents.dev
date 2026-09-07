import type { MDXComponents } from "mdx/types";

import { mdxComponents } from "@/lib/docs/mdx-components";

/** Next resolves every compiled MDX module's element map through this file at
 *  the project root. The map itself lives in `lib/docs` with the rest of the
 *  docs chrome; this is only the hook Next looks for. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components, ...mdxComponents };
}
