/**
 * Guards the registry manifest against drift with what's actually on disk.
 * `public/r` is what users install from, so a manifest that points at a moved
 * or deleted source, or at a component that no longer exists, ships broken
 * install URLs.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf-8"));
const names = new Set(registry.items.map((i) => i.name));

describe("registry.json", () => {
  it("every item ships files that exist", () => {
    for (const item of registry.items) {
      for (const file of item.files ?? []) {
        expect(existsSync(join(ROOT, file.path)), `${item.name} → ${file.path}`).toBe(true);
      }
    }
  });

  it("every registryDependency resolves to another item", () => {
    for (const item of registry.items) {
      for (const dep of item.registryDependencies ?? []) {
        if (dep.startsWith("http")) continue;
        expect(names.has(dep), `${item.name} depends on missing "${dep}"`).toBe(true);
      }
    }
  });

  it("published items name our own dependencies by URL, never bare", () => {
    // registry.json keeps bare names on purpose — they read better and carry
    // no hostname. `make registry` turns them into absolute URLs in public/r,
    // and that is the file a consumer's CLI fetches. A bare name surviving
    // into it resolves against shadcn's registry instead of ours: it 404s for
    // a name they do not have, and silently installs THEIR component for one
    // they do. This guards the published artifact, not the source.
    const out = join(ROOT, "public/r");
    for (const file of readdirSync(out)) {
      if (!file.endsWith(".json") || file === "registry.json") continue;
      const item = JSON.parse(readFileSync(join(out, file), "utf-8"));
      for (const dep of item.registryDependencies ?? []) {
        expect(names.has(dep), `${file} names "${dep}" bare — make registry should have made it a URL`).toBe(false);
      }
    }
  });

  it("has no leftover dual-flavor items", () => {
    // The library is Base UI only; a "-base" suffix means a stale radix pair.
    for (const name of names) expect(name.endsWith("-base")).toBe(false);
  });
});
