"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Code } from "@/registry/ui/code";
import { Step, Steps } from "@/lib/docs/Steps";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/ui/tabs";
import { installUrl } from "@/lib/registry-url";

interface RegistryFile {
  path: string;
  content?: string;
  target?: string;
}

interface RegistryItem {
  dependencies?: string[];
  files?: RegistryFile[];
}

/** The filename a consumer's copy of a registry file lands at. `target` is
 *  where the CLI writes it; the repo-relative `path` is only meaningful here. */
function filenameOf(file: RegistryFile): string {
  return (file.target ?? file.path).split("/").pop() ?? "component.tsx";
}

/** One in-flight request per slug, shared by the panel's own effect and the
 *  prefetch on the Manual trigger — so pointing at the tab and then clicking
 *  it starts one fetch, not two. A failure is evicted so a transient one can
 *  be retried rather than cached as a permanent 404. */
const registryRequests = new Map<string, Promise<RegistryItem>>();

function fetchRegistryItem(slug: string): Promise<RegistryItem> {
  let pending = registryRequests.get(slug);
  if (!pending) {
    pending = fetch(`/r/${slug}.json`).then((res) =>
      res.ok ? res.json() : Promise.reject(new Error(String(res.status)))
    );
    pending.catch(() => registryRequests.delete(slug));
    registryRequests.set(slug, pending);
  }
  return pending;
}

/**
 * The Installation block on every component page: the one-line CLI command, or
 * the dependencies and full source for someone who would rather paste it.
 *
 * The source is fetched from the registry JSON the site already serves, and
 * only for a reader who shows interest in the Manual tab — it is tens of
 * kilobytes per component, and most readers take the CLI. "Shows interest"
 * rather than "clicks", because clicking was too late: the panel mounted with
 * nothing to show, collapsed to a one-line placeholder, and then sprang open a
 * thousand pixels when the JSON landed, throwing the rest of the page up and
 * back down. Pointing at the trigger, or tabbing to it, starts the request
 * while the reader is still deciding, so the panel usually has its content the
 * moment it opens. `holdHeight` covers the case where it doesn't — a touch, or
 * a slow network — by parking the loading state at the height the panel it
 * replaced had, so nothing below it moves until the real content arrives.
 */
export function InstallTabs({ slug, note }: { slug: string; note?: string }) {
  const [tab, setTab] = useState("cli");
  const [item, setItem] = useState<RegistryItem | null>(null);
  const [failed, setFailed] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const [holdHeight, setHoldHeight] = useState<number | null>(null);

  const load = useCallback(() => {
    fetchRegistryItem(slug).then(setItem, () => setFailed(true));
  }, [slug]);

  useEffect(() => {
    if (tab !== "manual" || item || failed) return;
    load();
  }, [tab, item, failed, load]);

  // Freeze the outgoing panel's height into the incoming one, but only while
  // there is nothing to show — once the source is in, the panel sizes to it.
  const openManual = () => {
    if (!item && !failed) {
      // The CLI panel is the only one mounted at this point, so it is the
      // height to keep. Read off the DOM rather than through a ref on
      // TabsContent — the primitive takes no ref, and widening a published
      // component for one docs page is the wrong trade.
      const outgoing = blockRef.current?.querySelector('[role="tabpanel"]');
      const height = outgoing?.getBoundingClientRect().height;
      if (height) setHoldHeight(height);
      load();
    }
    setTab("manual");
  };

  const deps = item?.dependencies ?? [];
  const files = (item?.files ?? []).filter((file) => file.content);

  return (
    <div ref={blockRef}>
    <Tabs
      value={tab}
      onValueChange={(next) => (next === "manual" ? openManual() : setTab(next))}
      variant="underline"
      size="lg"
      className="w-full"
    >
      <TabsList className="mb-2">
        <TabsTrigger value="cli">CLI</TabsTrigger>
        {/* Intent, not commitment: pointing at the trigger or tabbing to it
            is enough to start the request, all of them idempotent — the
            shared promise means repeated passes over the tab cost nothing.
            The wrapper is `display: contents`, so it generates no box: the
            trigger stays a direct flex item of the list and the indicator's
            offsetLeft/offsetWidth measurements are untouched. Events that
            bubble (pointerover, pointerdown, focusin) rather than
            pointerenter, which needs a box to enter. */}
        <span
          className="contents"
          onPointerOver={load}
          onPointerDown={load}
          onFocus={load}
        >
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </span>
      </TabsList>

      <TabsContent value="cli" className="flex flex-col gap-3">
        {/* A fenced npx command, so Code expands it into npm / yarn / pnpm /
            bun and the reader copies the one they actually use. npm stays
            selected by default — it is what the shadcn CLI documents. */}
        <Code
          code={`\`\`\`npx\nshadcn@latest add ${installUrl(slug)}\n\`\`\``}
          defaultPackageManager="npm"
        />
        {note && <p className="text-caption text-muted-foreground">{note}</p>}
      </TabsContent>

      <TabsContent value="manual" className="flex flex-col gap-3">
        {failed && (
          <p className="text-caption text-muted-foreground">
            The source for this component could not be loaded. Use the CLI tab,
            or read it in{" "}
            <a
              href={installUrl(slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              the registry file
            </a>
            .
          </p>
        )}

        {/* Parked at the height of the panel it replaced, so the page below
            does not jump up and then back down when the source lands. */}
        {!failed && !item && (
          <p
            className="text-caption text-muted-foreground"
            style={holdHeight ? { minHeight: holdHeight } : undefined}
          >
            Loading source…
          </p>
        )}

        {item && (
          // The numbers come from CSS counters, so a component with no
          // dependencies simply starts at "Copy and paste" as step one.
          <Steps>
            {deps.length > 0 && (
              <>
                <Step>Install the following dependencies</Step>
                <Code
                  npm={`npm install ${deps.join(" ")}`}
                  yarn={`yarn add ${deps.join(" ")}`}
                  pnpm={`pnpm add ${deps.join(" ")}`}
                  bun={`bun add ${deps.join(" ")}`}
                  defaultPackageManager="npm"
                />
              </>
            )}

            <Step>Copy and paste the following into your project</Step>
            {/* A component can ship several files (Code brings its icon map and
                its Prism languages). Stacked flush they read as one block. */}
            <div className="flex flex-col gap-3">
              {files.map((file) => (
                <Code
                  key={file.path}
                  filename={filenameOf(file)}
                  language="tsx"
                  code={file.content}
                  expandable
                  expandLabel="View source"
                />
              ))}
            </div>

            <Step>Update the import paths to match your project setup</Step>
            {note && (
              <p className="text-caption text-muted-foreground">{note}</p>
            )}
          </Steps>
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
}
