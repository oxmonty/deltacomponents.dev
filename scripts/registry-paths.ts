import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `@/registry/...` → the path `shadcn add` writes the file to in a consumer's
 * project, built from registry.json's own `target` fields.
 *
 * Two things need this and must agree: the source embedded in `public/r`, and
 * the demo source shown in a doc page's code panel. Both are answering the
 * same question — "what would this import say in your project?" — so they read
 * one map rather than two copies of the same prefixes.
 */
export function registryPathMap(root = process.cwd()): [string, string][] {
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8")) as {
    items: { type: string; files?: { path: string; type?: string; target?: string }[] }[];
  };
  // The same aliases the CLI reads, so the two cannot disagree about where a
  // file ends up.
  const { aliases } = JSON.parse(readFileSync(join(root, "components.json"), "utf8")) as {
    aliases: Record<string, string>;
  };
  const byType: Record<string, string | undefined> = {
    "registry:ui": aliases.ui,
    "registry:lib": aliases.lib,
    "registry:hook": aliases.hooks,
  };

  const drop = (value: string) => value.replace(/\.(tsx?|jsx?)$/, "");

  return registry.items
    .flatMap((item) => (item.files ?? []).map((file) => ({ ...file, type: file.type ?? item.type })))
    .map((file) => {
      // An explicit target wins. Without one the CLI files it under the alias
      // for its type — `registry:lib` to lib/, `registry:hook` to hooks/ — so
      // the displayed import has to follow, or a doc page shows a reader a
      // path that only exists in this repo.
      const alias = byType[file.type];
      const to = file.target
        ? `@/${drop(file.target)}`
        : alias
          ? `${alias}/${drop(file.path).split("/").pop()}`
          : undefined;
      return to && to !== `@/${drop(file.path)}`
        ? ([`@/${drop(file.path)}`, to] as [string, string])
        : undefined;
    })
    .filter((pair): pair is [string, string] => pair !== undefined)
    // Longest first, so a path that prefixes another cannot be partly rewritten.
    .sort(([a], [b]) => b.length - a.length);
}

/** Rewrite every internal registry import in `source` to its consumer path. */
export function toConsumerPaths(source: string, map: [string, string][]): string {
  let out = source;
  for (const [from, to] of map) out = out.replaceAll(from, to);
  return out;
}
