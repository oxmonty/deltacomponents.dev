"use client";

import { useEffect, useState } from "react";
import { Code } from "@/registry/default/code";
import { Step, Steps } from "@/lib/docs/Steps";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/tabs";
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

/**
 * The Installation block on every component page: the one-line CLI command, or
 * the dependencies and full source for someone who would rather paste it.
 *
 * The source is fetched from the registry JSON the site already serves, and
 * only when the Manual tab is first opened — it is tens of kilobytes per
 * component, and most readers take the CLI.
 */
export function InstallTabs({ slug, note }: { slug: string; note?: string }) {
  const [tab, setTab] = useState("cli");
  const [item, setItem] = useState<RegistryItem | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (tab !== "manual" || item || failed) return;
    let cancelled = false;
    fetch(`/r/${slug}.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("404"))))
      .then((data: RegistryItem) => !cancelled && setItem(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [tab, slug, item, failed]);

  const deps = item?.dependencies ?? [];
  const files = (item?.files ?? []).filter((file) => file.content);

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      variant="underline"
      size="lg"
      className="w-full"
    >
      <TabsList className="mb-2">
        <TabsTrigger value="cli">CLI</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
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

        {!failed && !item && (
          <p className="text-caption text-muted-foreground">Loading source…</p>
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
  );
}
