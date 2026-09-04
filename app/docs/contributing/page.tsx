"use client";

import Image from "next/image";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { neighbours } from "@/lib/docs/components";
import { DocHeader } from "@/lib/docs/DocHeader";
import { DocPager } from "@/lib/docs/DocPager";

const CRITERIA = [
  {
    question: "Does it already exist?",
    answer: (
      <>
        If{" "}
        <a
          href="https://base-ui.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          Base UI
        </a>{" "}
        or{" "}
        <a
          href="https://ui.shadcn.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          shadcn/ui
        </a>{" "}
        ships it, we don&apos;t. A restyled Dialog is a theme, and a wrapper
        around someone else&apos;s primitive is a file you now maintain for
        nothing.
      </>
    ),
  },
  {
    question: "Is it general, and still yours to change?",
    answer: (
      <>
        CodeBlock is the shape of it: everyone needs one, nobody enjoys building
        one. But solving it generally isn&apos;t enough — take the props, thread
        the className, use the tokens, and let people delete the parts they
        don&apos;t want.
      </>
    ),
  },
  {
    question: "Does it solve a problem, or just sparkle?",
    answer: (
      <>
        <a
          href="https://fancycomponents.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          fancycomponents.dev
        </a>{" "}
        and{" "}
        <a
          href="https://magicui.design/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          magicui.design
        </a>{" "}
        do sparkle well; this isn&apos;t a second one. The test: would it still
        be worth installing with the animation off?
      </>
    ),
  },
];

export default function ContributingPage() {
  const { prev, next } = neighbours("/docs/contributing");

  return (
    <div className="flex flex-col gap-8 px-6">
      <DocHeader
        title="Contributing"
        description="Contributions are welcome, within a deliberately narrow scope."
        prev={prev}
        next={next}
      />

      <div className="flex flex-col gap-6 text-prose leading-relaxed">
        <p className="text-foreground/90">
          Everything here is source you install and then own, so a component
          earns its place by saving you a hard afternoon. Three questions:
        </p>

        <ol className="flex flex-col gap-5">
          {CRITERIA.map(({ question, answer }, i) => (
            <li key={question} className="flex gap-3">
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {i + 1}.
              </span>
              <div className="flex flex-col gap-1">
                <span
                  className="text-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  {question}
                </span>
                <span className="text-muted-foreground">{answer}</span>
              </div>
            </li>
          ))}
        </ol>

        <p className="text-muted-foreground">
          Open an issue before the pull request and lead with the problem rather
          than the component. A no is about scope, never about the work.
        </p>
      </div>

      <Image
        src="/images/contributing.jpg"
        alt=""
        width={745}
        height={663}
        className="w-40 self-start rounded-md"
      />

      <DocPager prev={prev} next={next} />
    </div>
  );
}
