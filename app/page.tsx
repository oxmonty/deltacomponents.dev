import Link from "next/link";
import { neighbours, visibleComponents } from "@/lib/docs/components";
import { DocPager } from "@/lib/docs/doc-pager";
import { DocHeader } from "@/lib/docs/doc-header";
import { BentoGrid } from "@/app/components/bento-grid";
import { Button } from "@/registry/ui/button";

export default function Page() {
  const { prev, next } = neighbours("/");

  // No top margin on the outer element: the docs layout opens every other page
  // on `py-20 sm:py-28` alone, and an extra offset here put the showcase title
  // 48px lower than every title a reader pages to next. The mobile header is
  // sticky, so it already occupies layout space and there is nothing to clear.
  return (
    <div>
      <div className="w-full max-w-[680px] mx-auto py-20 sm:py-28 px-5 sm:px-6">
        <DocHeader
          title="Delta Components"
          description="A curated collection of UI components I've refined over the years, the ones that make the difference. Free and open source, via the shadcn registry"
          prev={prev}
          next={next}
        >
          <div className="mt-2 flex items-center gap-2">
            {/* "Learn more" is the right label on the page, where the title
                above it says what there is to learn about. Out of that
                context — a link list, a crawler — it says nothing, so the
                accessible name carries the subject. */}
            <Link
              href="/docs"
              className="outline-none"
              tabIndex={-1}
              aria-label="Learn more about Delta Components"
            >
              <Button variant="primary">
                Learn more
              </Button>
            </Link>
          </div>
        </DocHeader>
      </div>
      <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-6">
        <BentoGrid components={visibleComponents} />
      </div>
      {/* Tracks the bento grid's width, not the 680px reading column the header
          uses — the rule above the pager reads as the end of the grid, so
          stopping it short of the cards' edges looks like a mistake. */}
      <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-6 pb-16">
        <DocPager prev={prev} next={next} />
      </div>
    </div>
  );
}
