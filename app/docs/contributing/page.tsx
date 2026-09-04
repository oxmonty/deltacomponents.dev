"use client";

import { fontWeights } from "@/registry/default/lib/font-weight";
import { neighbours } from "@/lib/docs/components";
import { DocHeader } from "@/lib/docs/DocHeader";
import { DocPager } from "@/lib/docs/DocPager";
import { CodeBlock } from "@/registry/default/code-block";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 pt-8">
      <h2
        className="scroll-mt-20 py-2 text-title text-foreground leading-none"
        style={{ fontVariationSettings: fontWeights.semibold }}
        id={title.toLowerCase().replace(/\s+/g, "-").replace(/['?]/g, "")}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ContributingPage() {
  const { prev, next } = neighbours("/docs/contributing");

  return (
    <div className="flex flex-col gap-8 px-6">
      <DocHeader
        title="Contributing"
        description="Contributions are welcome. Before you open one, it helps to know what this collection is for — and what it deliberately isn't."
        prev={prev}
        next={next}
      />

      <section className="flex flex-col gap-6 text-prose text-foreground/90 leading-relaxed">
        <p>
          Every component here is one you install into your project and then
          own. That framing decides everything below: a component earns its
          place by saving you a hard afternoon, not by being one more thing to
          scroll past. Three questions, in order.
        </p>
      </section>

      <Section title="Does it already exist?">
        <p className="text-prose text-muted-foreground leading-relaxed">
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
          already ships it, we don&apos;t. A restyled Dialog is a theme, not a
          component, and a wrapper that forwards props to someone else&apos;s
          primitive is a file you now have to maintain for no gain. The same
          goes for extending one: if the answer is a variant on an existing
          component, send that variant upstream, or keep it in your own project
          where it belongs.
        </p>
        <p className="text-prose text-muted-foreground leading-relaxed">
          The interesting space is the gap between those libraries and the thing
          you actually shipped last week.
        </p>
      </Section>

      <Section title="Is it general, and still yours to change?">
        <p className="text-prose text-muted-foreground leading-relaxed">
          The bar is a problem lots of people have and few enjoy solving.
          CodeBlock is the shape of it: nearly every docs site needs one, and
          nearly every one is a week of syntax themes, copy buttons, clipboard
          fallbacks and collapse behaviour. Worth writing once.
        </p>
        <p className="text-prose text-muted-foreground leading-relaxed">
          But solving it generally is only half the job. The other half is not
          closing the door behind you. A component that hard-codes its own
          sizing, colours and layout has traded one afternoon of work for a
          permanent fight with your design system. Take the props, thread the
          className, use the tokens, and let someone delete the parts they
          don&apos;t want. You are writing source that a stranger will edit,
          not an API they must live with.
        </p>
        <CodeBlock
          language="tsx"
          code={`// Not this — the component decides, forever.
<Callout>…</Callout>

// This — the component decides a sensible default, and gets out of the way.
<Callout tone="warning" className="rounded-none border-l-4">…</Callout>`}
        />
      </Section>

      <Section title="Does it solve a problem, or just sparkle?">
        <p className="text-prose text-muted-foreground leading-relaxed">
          There are good collections of animated, gradient-swept, cursor-tracking
          components —{" "}
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
          do that well, and this is not a second one. Motion here is expected to
          carry information: which row you are about to hit, that two items
          belong together, that a panel came from the button you pressed.
        </p>
        <p className="text-prose text-muted-foreground leading-relaxed">
          The test is whether the component would still be worth installing with
          the animation switched off. If it would, the animation is doing its
          job. If it wouldn&apos;t, the animation <em>was</em> the component.
        </p>
      </Section>

      <Section title="Opening one">
        <p className="text-prose text-muted-foreground leading-relaxed">
          Open an issue before the pull request, and lead with the problem
          rather than the component: what you were building, what you had to
          write yourself, and why the existing pieces didn&apos;t cover it. If
          it clears the three questions above, the mechanics are in{" "}
          <code>component-documentation-guidelines.md</code> — a source file, a
          registry entry, a docs page and a showcase card, in that order.
        </p>
        <p className="text-prose text-muted-foreground leading-relaxed">
          A no here is about scope, never about the work. Plenty of good
          components belong in your project rather than in a registry.
        </p>
      </Section>

      <DocPager prev={prev} next={next} />
    </div>
  );
}
