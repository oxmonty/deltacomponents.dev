import { neighbours } from "@/lib/docs/components";
import { DocHeader } from "@/lib/docs/doc-header";
import { DocPager } from "@/lib/docs/doc-pager";
import { mdxBodyClass } from "@/lib/docs/mdx-components";
import Content from "@/content/docs/contributing.mdx";

/** See the introduction's note: a section page's chrome comes from here
 *  because there is no `componentList` entry to read it from. */
export default function ContributingPage() {
  const { prev, next } = neighbours("/docs/contributing");

  return (
    <div className="flex flex-col gap-8 px-5 sm:px-6">
      <DocHeader
        title="Contributing"
        description="Contributions are welcome, within a narrow scope"
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
