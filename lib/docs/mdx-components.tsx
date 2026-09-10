import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

import { Code } from "@/registry/ui/code";
import { ComponentPreview } from "@/lib/docs/component-preview";
import { AnchoredHeading, DocProse } from "@/lib/docs/doc-page";
import { InstallTabs } from "@/lib/docs/install-tabs";
import { Playground } from "@/lib/docs/playground-section";
import { PropsTable } from "@/lib/docs/props-table";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Step, Steps } from "@/lib/docs/steps";
import { cn } from "@/registry/lib/utils";
import { fontWeights } from "@/registry/lib/font-weight";

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
  // A prose link is the same colour as the text around it, so the underline is
  // the whole affordance and has to stay at rest — the hover works the rule
  // itself instead. It sits at 45% in running text, where a paragraph with
  // four links otherwise reads as four full-strength rules, and comes to full
  // strength and 2px under the pointer.
  //
  // Both are text-decoration properties, so neither reflows the line and the
  // motion stays off the layout path. No underline slide or grow: hover is the
  // highest-frequency interaction there is, and an entrance animation on it
  // replays its attention cost on every pass (see the note on the Tabs hover
  // wash). A colour and a weight, on the fast tier.
  a: ({ className, ...props }: ComponentProps<"a">) => (
    <a
      className={cn(
        "text-foreground underline underline-offset-4",
        // A SOLID token at rest, not `decoration-foreground/45`. Tailwind v4
        // compiles an alpha colour to `color-mix()`, and text-decoration-color
        // will not interpolate from a color-mix() to a plain colour — the
        // hover colour silently never arrived, while the thickness beside it
        // animated fine. Two flat tokens transition correctly.
        "decoration-1 decoration-muted-foreground",
        "hover:decoration-2 hover:decoration-foreground",
        "transition-[text-decoration-color,text-decoration-thickness]",
        "duration-(--motion-fast) ease-spring",
        className
      )}
      {...props}
    />
  ),
  // A markdown table gets the API Reference's treatment rather than the
  // browser's default, so a `| Slot | Element |` in a page and a `<PropsTable>`
  // below it read as the same object. Head and body rows differ, so the row
  // rules ride descendant selectors here instead of a `tr` mapping, which has
  // no way to tell which half it is in.
  table: ({ className, ...props }: ComponentProps<"table">) => (
    <ScrollArea
      orientation="horizontal"
      viewportClassName="scroll-fade-x"
      className="w-full"
    >
      <table
        className={cn(
          "text-table w-full min-w-[520px] border-collapse",
          "[&_th:first-child]:pl-0 [&_td:first-child]:pl-0",
          "[&_thead_tr]:border-border [&_thead_tr]:border-b",
          "[&_tbody_tr]:border-border/40 [&_tbody_tr]:border-b",
          className
        )}
        {...props}
      />
    </ScrollArea>
  ),
  th: ({ className, style, ...props }: ComponentProps<"th">) => (
    <th
      className={cn("text-foreground px-3 py-2 text-left", className)}
      style={{ fontVariationSettings: fontWeights.semibold, ...style }}
      {...props}
    />
  ),
  // Muted like the description column, and a `<code>` inside brings its own
  // foreground back — the same split PropsTable makes between a name and the
  // sentence beside it.
  td: ({ className, ...props }: ComponentProps<"td">) => (
    <td
      className={cn("text-muted-foreground px-3 py-2 align-top", className)}
      {...props}
    />
  ),

  ul: ({ className, ...props }: ComponentProps<"ul">) => (
    <ul className={cn("text-prose text-foreground/90 my-2 ml-6 list-disc leading-normal", className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentProps<"ol">) => (
    <ol className={cn("text-prose text-foreground/90 my-2 ml-6 list-decimal leading-normal", className)} {...props} />
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
