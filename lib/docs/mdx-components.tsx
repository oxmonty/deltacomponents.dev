import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

import { Code } from "@/registry/ui/code";
import { ComponentPreview } from "@/lib/docs/component-preview";
import { AnchoredHeading, DocProse } from "@/lib/docs/doc-page";
import { InstallTabs } from "@/lib/docs/install-tabs";
import { Playground } from "@/lib/docs/playground-section";
import { PropsTable } from "@/lib/docs/props-table";
import { Step, Steps } from "@/lib/docs/steps";
import { cn } from "@/registry/lib/utils";

/** Spacing for a page's MDX body.
 *
 *  The TSX pages spaced themselves with `gap` on a flex column, because a
 *  section's heading and its content were nested together in one. MDX has no
 *  such nesting — every heading, paragraph and preview is a sibling — so the
 *  rhythm has to come from the run itself: a base step between any two
 *  elements, and a bigger one above a heading so it reads as opening what
 *  follows rather than captioning what came before. */
export const mdxBodyClass =
  "flex flex-col [&>*]:mt-4 [&>*:first-child]:mt-0 [&>h2]:mt-10 [&>h3]:mt-6 [&>h4]:mt-5";

/**
 * What every element in a `.mdx` doc page renders as.
 *
 * The point of the migration: a doc page's headings and prose used to be JSX,
 * so their type had to be spelled out per page and drifted (see DocProse).
 * Here each element resolves once, to the same role component the TSX pages
 * used, and a page is markdown again.
 *
 * `h2` and `h3` map to DocSection and DocSubSection — the components that
 * already own the site's heading rhythm and self-linking anchors — rather than
 * to bare tags with classes. rehype-slug has stamped the id by the time this
 * runs, so the anchor and the contents rail agree without either of them
 * deriving the slug a second time.
 */
export const mdxComponents: MDXComponents = {
  // Standalone headings, not DocSection/DocSubSection: those wrap a heading
  // and its content in one flex column, and MDX emits the two as flat
  // siblings. The rhythm moves to margins on the body wrapper instead (see
  // `mdxBodyClass`), which is the only way to space a flat run of elements.
  // The page already has an h1 — the route renders the component's name from
  // `componentList` — so a `#` in the body is a second one, which is wrong for
  // both the outline and the type. It renders as an h2, identical to `##`:
  // headings in a doc page start at level two by definition.
  h1: ({ id, children }: ComponentProps<"h1">) => (
    <AnchoredHeading id={id} className="text-heading text-foreground leading-none">
      {String(children)}
    </AnchoredHeading>
  ),
  h2: ({ id, children }: ComponentProps<"h2">) => (
    <AnchoredHeading id={id} className="text-heading text-foreground leading-none">
      {String(children)}
    </AnchoredHeading>
  ),
  h3: ({ id, children }: ComponentProps<"h3">) => (
    <AnchoredHeading as="h3" id={id} className="text-subheading text-foreground leading-none">
      {String(children)}
    </AnchoredHeading>
  ),
  h4: ({ id, children }: ComponentProps<"h4">) => (
    <AnchoredHeading as="h3" id={id} className="text-prose text-foreground leading-none">
      {String(children)}
    </AnchoredHeading>
  ),
  p: ({ children }: ComponentProps<"p">) => <DocProse>{children}</DocProse>,
  a: ({ className, ...props }: ComponentProps<"a">) => (
    <a
      className={cn("text-foreground underline underline-offset-4", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: ComponentProps<"ul">) => (
    <ul className={cn("text-prose text-foreground/90 my-2 ml-6 list-disc leading-relaxed", className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentProps<"ol">) => (
    <ol className={cn("text-prose text-foreground/90 my-2 ml-6 list-decimal leading-relaxed", className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentProps<"li">) => (
    <li className={cn("mt-1", className)} {...props} />
  ),
  strong: ({ className, ...props }: ComponentProps<"strong">) => (
    <strong className={cn("font-medium text-foreground", className)} {...props} />
  ),
  // A fenced block arrives as <pre><code class="language-tsx">. Unwrap it and
  // hand the source to the site's own Code component, so a block written in
  // markdown is the same component a demo's source panel uses.
  pre: ({ children }: ComponentProps<"pre">) => {
    const child = children as { props?: { className?: string; children?: string } };
    const language = child?.props?.className?.replace("language-", "") ?? "tsx";
    return <Code language={language} code={String(child?.props?.children ?? "").trimEnd()} />;
  },
  // Inline code only — `pre` above has already claimed the fenced kind.
  code: ({ className, ...props }: ComponentProps<"code">) => (
    <code
      className={cn("bg-muted text-foreground rounded px-[0.3rem] py-[0.15rem] font-mono text-[0.85em]", className)}
      {...props}
    />
  ),

  // Components a page can use without importing them.
  ComponentPreview,
  InstallTabs,
  Playground,
  PropsTable,
  Step,
  Steps,
};
