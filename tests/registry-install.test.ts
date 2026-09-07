import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Async, not execFileSync: the registry server below runs in THIS process, and
// a synchronous child blocks the event loop — the CLI would fetch, nothing
// would answer, and the install would hang until its timeout.
const run = promisify(execFile);

/**
 * Installs a component the way a consumer does — the real shadcn CLI, the real
 * published registry JSON — and checks the files land where the registry says.
 *
 * This is the test that would have caught the `registryDependencies` bug: a
 * bare name resolves against shadcn's own registry, so `tokens` 404'd and
 * failed the install outright while `button` resolved silently to shadcn's
 * component. Neither shows up in a unit test of the JSON; both are obvious the
 * moment the CLI actually runs.
 *
 * It shells out to a package manager, so it is opt-in rather than part of
 * `make check`:
 *
 *     make test-install
 *
 * `public/r` is served from a local ephemeral port and the item's dependency
 * URLs are rewritten to it, so the test exercises the committed registry
 * rather than whatever is deployed — a red build should mean the registry is
 * wrong, not that Vercel is down. Point REGISTRY_ORIGIN at a deployment to
 * smoke-test the live one instead.
 */
const SLUG = "code";
const CLI = join(process.cwd(), "node_modules/.bin/shadcn");

/** What `code.json` says its files land at, and so what must exist after. */
const EXPECTED_TARGETS = ["components/ui/code.tsx", "components/ui/code-icons.tsx", "lib/prism-languages.ts"];

const MIME: Record<string, string> = { ".json": "application/json" };

let server: Server;
let origin: string;
let project: string;

/** Serves public/r, rewriting our own dependency URLs to this server so the
 *  whole graph resolves locally. */
function serveRegistry(): Promise<void> {
  return new Promise((resolve) => {
    server = createServer((req, res) => {
      const name = (req.url ?? "/").split("?")[0].replace(/^\/r\//, "/").slice(1);
      const path = join(process.cwd(), "public/r", name);
      if (!existsSync(path)) {
        res.writeHead(404).end("not found");
        return;
      }
      const body = readFileSync(path, "utf8").replaceAll(
        /https:\/\/[^"/]+\/r\//g,
        `${origin}/r/`
      );
      res.writeHead(200, { "content-type": MIME[extname(name)] ?? "text/plain" }).end(body);
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      origin = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
      resolve();
    });
  });
}

/** The smallest project the CLI will install into: a package.json to add
 *  dependencies to, tsconfig paths to resolve the aliases, and the
 *  components.json that maps them. Mirrors this repo's own aliases, so the
 *  targets under test are the ones a consumer of ours actually gets. */
function scaffoldProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "registry-install-"));
  mkdirSync(join(dir, "app"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "consumer", version: "0.0.0", private: true }, null, 2));
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] } } }, null, 2));
  writeFileSync(join(dir, "app/globals.css"), "@import 'tailwindcss';\n");
  writeFileSync(
    join(dir, "components.json"),
    JSON.stringify(JSON.parse(readFileSync(join(process.cwd(), "components.json"), "utf8")), null, 2)
  );
  return dir;
}

describe.skipIf(!process.env.RUN_REGISTRY_INSTALL_TEST)("shadcn add", () => {
  beforeAll(async () => {
    await serveRegistry();
    project = scaffoldProject();
  }, 30_000);

  afterAll(() => {
    server?.close();
    if (project) rmSync(project, { recursive: true, force: true });
  });

  it("installs the component and every file lands at its declared target", async () => {
    await run(CLI, ["add", `${origin}/r/${SLUG}.json`, "--yes"], {
      cwd: project,
      timeout: 240_000,
    });

    for (const target of EXPECTED_TARGETS) {
      expect(existsSync(join(project, target)), `${target} was not created`).toBe(true);
    }
  }, 300_000);

  it("brings its registry dependencies from THIS registry, not shadcn's", () => {
    // `button` and `utils` both exist upstream. If the dependency were a bare
    // name the CLI would resolve it there and the consumer would silently get
    // shadcn's component, so assert on something only ours contains.
    const button = readFileSync(join(project, "components/ui/button.tsx"), "utf8");
    expect(button).toContain("@base-ui/react/button");
  });

  it("declares no dependency the CLI would resolve against shadcn's registry", () => {
    const item = JSON.parse(readFileSync(join(process.cwd(), `public/r/${SLUG}.json`), "utf8")) as {
      registryDependencies?: string[];
    };
    const ours = new Set(
      (JSON.parse(readFileSync(join(process.cwd(), "registry.json"), "utf8")) as { items: { name: string }[] })
        .items.map((i) => i.name)
    );
    for (const dep of item.registryDependencies ?? []) {
      expect(ours.has(dep), `"${dep}" is a bare name for one of our own items — it must be an absolute URL`).toBe(false);
    }
  });
});
