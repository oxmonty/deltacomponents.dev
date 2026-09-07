"use client";

import { neighbours } from "@/lib/docs/components";
import { DocPager } from "@/lib/docs/DocPager";
import { DocHeader } from "@/lib/docs/DocHeader";
import { AnchoredHeading, DocProse } from "@/lib/docs/DocPage";

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

      {/* TBD: placeholder copy. The inherited pitch has been removed — write
          the real introduction here, then delete this block. */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <AnchoredHeading
            as="h3"
            className="text-subheading text-foreground leading-none"
          >
            TBD
          </AnchoredHeading>
          <DocProse>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </DocProse>
          <DocProse>
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </DocProse>
        </div>
      </section>

      <DocPager prev={prev} next={next} />
    </div>
  );
}
