"use client";

import { useState } from "react";
import { Button } from "@/registry/ui/button";
import { Editor } from "@/registry/ui/editor";
import type { EditorElements } from "@/registry/lib/live-markdown";

// Two type sets over one document. The keys are an MDX components map's keys,
// and each one takes the classes that construct wears — the elements
// themselves (h1, strong, code, a) are emitted either way, so a set only has
// to say what it wants to look different.
const SETS: Record<string, { root: string; elements: EditorElements }> = {
  Product: {
    root: "text-base leading-7",
    elements: {
      h1: "text-2xl font-semibold",
      h2: "text-xl font-semibold",
      strong: "font-semibold",
      code: "font-mono text-sm bg-muted rounded px-1",
      a: "underline underline-offset-2 decoration-muted-foreground",
      bullet: "text-muted-foreground",
    },
  },
  Editorial: {
    root: "font-serif text-lg leading-8",
    elements: {
      h1: "text-3xl",
      h2: "text-2xl",
      strong: "font-semibold",
      em: "italic",
      code: "font-mono text-sm text-muted-foreground",
      a: "underline underline-offset-4 decoration-1",
      bullet: "text-muted-foreground/60",
    },
  },
};

const DOC = `# On revision

Writing is *rewriting*. The **first** draft only has to exist; the second one has to be read. Keep the \`- [ ]\` list short enough that finishing it is plausible.

- [ ] Cut the third paragraph
- [ ] Give the [opening](https://example.com) a verb
`;

export default function EditorTypographySets() {
  const [name, setName] = useState("Product");
  const set = SETS[name];

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      <div className="flex gap-2">
        {Object.keys(SETS).map((key) => (
          <Button
            key={key}
            size="compact"
            variant={key === name ? "secondary" : "ghost"}
            onClick={() => setName(key)}
          >
            {key}
          </Button>
        ))}
      </div>
      {/* One editor, not two: swapping the set keeps the document, the caret
          and the undo history, so the comparison is on the same text. */}
      <Editor defaultValue={DOC} elements={set.elements} className={set.root} />
    </div>
  );
}
