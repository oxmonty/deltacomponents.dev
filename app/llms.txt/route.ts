import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { site } from "@/lib/config";
import { labelOf, visibleComponents } from "@/lib/docs/components";
import { installUrl } from "@/lib/registry-url";

/**
 * `/llms.txt` — the index an assistant reads first (llmstxt.org): what the
 * site is, and one link per page to its plain-markdown form, which is the
 * `.md` twin every component page already has. Static, like the pages.
 */
export const dynamic = "force-static";

async function descriptionOf(slug: string): Promise<string> {
  try {
    const source = await readFile(join(process.cwd(), "content/docs", `${slug}.mdx`), "utf8");
    return /^description:\s*"?(.*?)"?\s*$/m.exec(source)?.[1] ?? "";
  } catch {
    return "";
  }
}

export async function GET() {
  const components = await Promise.all(
    visibleComponents.map(async (entry) => {
      const description = await descriptionOf(entry.slug);
      return `- [${labelOf(entry)}](${site.url}/docs/${entry.slug}.md)${description ? `: ${description}` : ""}`;
    }),
  );

  const body = [
    `# ${site.name}`,
    "",
    `> ${site.description}.`,
    "",
    `Every component installs with \`npx shadcn@latest add ${installUrl("<slug>")}\`. Each doc page below is served as markdown at the \`.md\` URL; the same page without the extension is the HTML.`,
    "",
    "## Components",
    "",
    ...components,
    "",
    "## About",
    "",
    `- [Introduction](${site.url}/docs)`,
    `- [Contributing](${site.url}/docs/contributing)`,
    `- [Source](https://github.com/${site.repo})`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
