"use client";

import Link from "next/link";
import { componentList, neighbours } from "@/lib/docs/components";
import { DocPager } from "@/lib/docs/DocPager";
import { DocHeader } from "@/lib/docs/DocHeader";
import { BentoGrid } from "@/app/components/bento-grid";
import { Button } from "@/registry/base/button";

export default function Page() {
  const { prev, next } = neighbours("/");

  return (
    <div className="mt-12 lg:mt-0">
      <div className="w-full max-w-[680px] mx-auto py-20 sm:py-28 px-6">
        <DocHeader
          title="Delta Components"
          description="Our own components, built on a fluid, token-driven design system."
          prev={prev}
          next={next}
        >
          <div className="mt-2 flex items-center gap-2">
            <Link href="/docs" className="outline-none" tabIndex={-1}>
              <Button variant="primary" size="sm">
                Learn more
              </Button>
            </Link>
          </div>
        </DocHeader>
      </div>
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <BentoGrid components={componentList} />
      </div>
      {/* Tracks the bento grid's width, not the 680px reading column the header
          uses — the rule above the pager reads as the end of the grid, so
          stopping it short of the cards' edges looks like a mistake. */}
      <div className="w-full max-w-[1200px] mx-auto px-6 pb-16">
        <DocPager prev={prev} next={next} />
      </div>
    </div>
  );
}
