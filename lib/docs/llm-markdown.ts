import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { componentList, labelOf } from "@/lib/docs/components";
import { demos } from "@/lib/docs/demos.generated";
import { installUrl } from "@/lib/registry-url";
import type { PropDef } from "@/lib/docs/props-table";

/**
 * A doc page as plain markdown, for an agent to read.
 *
 * The .mdx a reader sees is half components — `<ComponentPreview name="…" />`
 * says nothing to something that cannot run React. Each one is replaced by the
 * thing it stands for: a preview by the demo's actual source, the install
 * block by the command, a props table by a real markdown table. What is left
 * is a document that answers the same questions the page does.
 */

/** A fenced block, guarding against a sample that itself contains a fence. */
function fence(code: string, language = "tsx"): string {
  const ticks = "`".repeat(Math.max(3, ...[...code.matchAll(/`{3,}/g)].map((m) => m[0].length + 1)));
  return `${ticks}${language}\n${code}\n${ticks}`;
}

function propsTable(props: PropDef[]): string {
  const rows = props.map(
    (p) => `| \`${p.name}\` | \`${p.type}\` | ${p.default ? `\`${p.default}\`` : "—"} | ${p.description} |`
  );
  return ["| Prop | Type | Default | Description |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

/** Drop the page's own `import` lines — a module concern that says nothing
 *  about the component — while leaving the ones inside fenced blocks alone.
 *  Those are the sample's own imports, and the line a reader most needs: which
 *  path to import the component from. */
function stripModuleImports(source: string): string {
  let inFence = false;
  return source
    .split("\n")
    .filter((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return true;
      }
      return inFence || !/^import\s/.test(line);
    })
    .join("\n");
}

export async function docPageAsMarkdown(slug: string): Promise<string | null> {
  const entry = componentList.find((c) => c.slug === slug);
  if (!entry) return null;

  const path = join(process.cwd(), "content/docs", `${slug}.mdx`);
  let source: string;
  try {
    source = await readFile(path, "utf8");
  } catch {
    return null;
  }

  // Frontmatter carries the description; lift it into the document rather than
  // leaving YAML at the top of something meant to be read.
  let description = "";
  source = source.replace(/^---\n([\s\S]*?)\n---\n/, (_m, block: string) => {
    description = /description:\s*"?(.*?)"?\s*$/m.exec(block)?.[1] ?? "";
    return "";
  });

  // The props file is a module, so the tables can be rendered from the same
  // data the page renders — no parsing, and no second copy to drift.
  let props: Record<string, PropDef[]> = {};
  try {
    props = (await import(`@/content/docs/${slug}.props`)) as Record<string, PropDef[]>;
  } catch {
    // A page with no props file is fine.
  }

  const body = stripModuleImports(source)
    .replace(/<ComponentPreview\s+name="([^"]+)"[^>]*\/>/g, (match, name: string) => {
      const demo = demos[name];
      return demo ? fence(demo.source) : match;
    })
    .replace(/<InstallTabs\s+slug="([^"]+)"[^>]*\/>/g, (_m, s: string) =>
      fence(`npx shadcn@latest add ${installUrl(s)}`, "bash")
    )
    .replace(/<PropsTable\s+props=\{(\w+)\}[^>]*\/>/g, (match, name: string) => {
      const table = props[name];
      return Array.isArray(table) ? propsTable(table) : match;
    })
    .replace(/<Playground\s+slug="([^"]+)"[^>]*\/>/g,
      "_An interactive playground for this component is available on the page._")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return `# ${labelOf(entry)}\n\n${description}\n\n${body}\n`;
}
