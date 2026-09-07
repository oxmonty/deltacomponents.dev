/**
 * Rewrites this registry's own `registryDependencies` into absolute URLs,
 * after `shadcn build` has written public/r.
 *
 * A bare name in `registryDependencies` resolves against shadcn's built-in
 * registry, not ours — which broke the install two different ways. Names with
 * no upstream counterpart (`tokens`, `motion`, `shape-context`) 404'd and
 * failed the command outright; worse, the names that DO exist upstream
 * (`utils`, `button`) resolved silently, so a consumer installing our Code
 * got shadcn's Button next to it. Absolute URLs are what the registry spec
 * asks for here, and the only form that names our item unambiguously.
 *
 * A post-step rather than URLs in registry.json, so the source file stays
 * readable and free of a hostname that would go stale the moment the domain
 * moves.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { registryPathMap, toConsumerPaths } from "./registry-paths";

const ROOT = process.cwd();
const OUT = join(ROOT, "public/r");

interface RegistryItem {
  name: string;
  registryDependencies?: string[];
  files?: { path: string; content?: string; target?: string }[];
}

const source = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as {
  homepage: string;
  items: RegistryItem[];
};

/** Where the published registry is served from. `homepage` is the committed
 *  default; REGISTRY_ORIGIN overrides it for a one-off build against another
 *  deployment. It has to be baked in at generation time — these files are
 *  static artifacts a consumer's CLI fetches, with no environment of ours. */
const origin = (process.env.REGISTRY_ORIGIN ?? source.homepage).replace(/\/$/, "");
const ours = new Set(source.items.map((item) => item.name));
const pathMap = registryPathMap(ROOT);

let rewritten = 0;
let imports = 0;
for (const file of readdirSync(OUT)) {
  if (!file.endsWith(".json") || file === "registry.json") continue;

  const path = join(OUT, file);
  const item = JSON.parse(readFileSync(path, "utf8")) as RegistryItem;
  let changed = false;

  // A component that depends on a sibling imports it by the path the CONSUMER
  // will have, not ours. The source is authored with the real internal path so
  // it resolves in this repo like anything else, and is rewritten here — which
  // is why there is no longer a `components/ui/` full of re-export shims whose
  // only job was to make the consumer's path resolve at home.
  for (const file of item.files ?? []) {
    if (!file.content) continue;
    const next = toConsumerPaths(file.content, pathMap);
    if (next !== file.content) {
      file.content = next;
      changed = true;
      imports += 1;
    }
  }

  const deps = item.registryDependencies;
  if (deps?.length) {
    // Anything already absolute, namespaced or path-like is left alone, and so
    // is a bare name we do not publish — that one really is shadcn's.
    const next = deps.map((dep) => (ours.has(dep) ? `${origin}/r/${dep}.json` : dep));
    if (next.some((dep, i) => dep !== deps[i])) {
      item.registryDependencies = next;
      changed = true;
      rewritten += 1;
    }
  }

  if (changed) writeFileSync(path, `${JSON.stringify(item, null, 2)}\n`);
}

console.log(
  `✔ Registry: ${rewritten} items pointed at ${origin}/r, ${imports} files' imports rewritten to consumer paths.`
);
