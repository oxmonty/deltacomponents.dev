import { neighbours } from "@/lib/docs/components";
import { DocHeader } from "@/lib/docs/DocHeader";
import { DocPager } from "@/lib/docs/DocPager";
import { mdxBodyClass } from "@/lib/docs/mdx-components";
import Content from "@/content/docs/introduction.mdx";

/** The introduction. Keeps its own route rather than joining the `[slug]`
 *  one: its title and description are the section's, not a component's, so
 *  there is no `componentList` entry for the chrome to read. */
export default function DocsIndex() {
  const { prev, next } = neighbours("/docs");

  return (
    <div className="flex flex-col gap-8 px-6">
      <DocHeader
        title="Introduction"
        description="What Delta Components is, and how to install it."
        prev={prev}
        next={next}
      />
      <div className={mdxBodyClass}>
        <Content />
      </div>
      <DocPager prev={prev} next={next} />
    </div>
  );
}
