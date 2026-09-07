"use client";

import { ComponentPreview } from "@/lib/docs/component-preview";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { ButtonPlayground } from "@/lib/docs/playgrounds/button";

/** The live sandbox a component page can drop in with `<Playground slug="button" />`.
 *
 *  A playground is not a demo: it is a stateful sandbox whose controls drive a
 *  preview and a snippet that stay in step, so it can't come from the demo
 *  registry — the registry's job is to pair a static file with its own source.
 *  Keyed by slug so the MDX names a component rather than importing a
 *  playground module it would then have to compose by hand. */
const playgrounds: Record<string, () => React.ReactElement> = {
  button: () => (
    <ButtonPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} minHeightClass="min-h-[280px]">
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </ButtonPlayground>
  ),
};

export function Playground({ slug }: { slug: string }) {
  const render = playgrounds[slug];
  if (!render) {
    throw new Error(`Playground: no playground registered for "${slug}".`);
  }
  return render();
}
