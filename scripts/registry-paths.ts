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
    items: { files?: { path: string; target?: string }[] }[];
  };
  const drop = (value: string) => value.replace(/\.(tsx?|jsx?)$/, "");

  return registry.items
    .flatMap((item) => item.files ?? [])
    .filter((file) => file.target && drop(file.target) !== drop(file.path))
    .map((file) => [`@/${drop(file.path)}`, `@/${drop(file.target as string)}`] as [string, string])
    // Longest first, so a path that prefixes another cannot be partly rewritten.
    .sort(([a], [b]) => b.length - a.length);
}

/** Rewrite every internal registry import in `source` to its consumer path. */
export function toConsumerPaths(source: string, map: [string, string][]): string {
  let out = source;
  for (const [from, to] of map) out = out.replaceAll(from, to);
  return out;
}
