"use client";

import { fontWeights } from "@/registry/default/lib/font-weight";
import { neighbours } from "@/lib/docs/components";
import { DocPager } from "@/lib/docs/DocPager";
import { DocHeader } from "@/lib/docs/DocHeader";
import { InputCopy } from "@/registry/default/input-copy";
import { CodeBlock } from "@/registry/default/code-block";

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

      <section className="flex flex-col gap-6 text-prose text-foreground/90 leading-relaxed">
        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Motion that communicates
          </h3>
          <p>
            Every animation here points at something. When two list items
            merge their backgrounds, the component tells you they belong
            together. The hover highlight follows your cursor before you
            click, so the row you&apos;re about to land on confirms
            itself first. Motion has a job to create meaning.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Hover as preview
          </h3>
          <p>
            The interaction starts before you click. The closest
            interactive thing to your cursor gets a faint highlight;
            buttons gain a little weight as you approach. By the time
            your finger lands, you&apos;ve had a moment to reconsider,
            which is mostly the point.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Spring physics, not durations
          </h3>
          <p>
            Animations use springs, not fixed-duration eases. Toggle a
            switch and immediately toggle it back: the spring picks up
            wherever it was and reverses, instead of finishing the first
            animation before starting the second. Three presets, named
            fast, moderate, and slow, cover most of the library.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Drop-in compatible
          </h3>
          <p>
            Built on shadcn/ui and Base UI primitives. Your theme tokens
            (colors, radii, fonts) work as-is, and one CLI command
            installs a component along with whatever it needs.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Customize using the right panel
          </h3>
          <p>
            The panel on the right lets you change things on the fly.
            Switch between light and dark mode, toggle the corner radius
            from rounded to pill, step the size ladder, or cycle through
            different icon libraries. Press T, R, S, or I to flip them
            from the keyboard. The icon switcher is a preview tool that
            lives on this site — installed components ship with Lucide
            only, and you can swap in your own icons (see Icons below).
          </p>
        </div>
      </section>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-title text-foreground leading-none"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Installation
        </h2>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-prose text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0" style={{ fontVariationSettings: fontWeights.medium }}>1</span>
            Add the registry to your project:
          </p>
          <InputCopy value="npx shadcn@latest registry add @delta" align="left" className="w-fit" />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-prose text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0" style={{ fontVariationSettings: fontWeights.medium }}>2</span>
            Install any component:
          </p>
          <InputCopy value="npx shadcn@latest add @delta/button" align="left" className="w-fit" />
        </div>
        <hr className="border-border/60 mt-4" />
        <p className="text-prose text-muted-foreground">
          Or install directly without adding the registry:
        </p>
        <InputCopy value="npx shadcn@latest add https://deltacomponents.dev/r/button.json" align="left" className="w-fit" />
        <p className="text-prose text-muted-foreground">
          Dependencies and shared utilities are resolved automatically.
          Font weight animations require the Inter variable font.
        </p>
      </div>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-title text-foreground leading-none"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Icons
        </h2>
        <p className="text-prose text-muted-foreground">
          Components render their icons through named slots with Lucide
          defaults, so lucide-react is the only icon dependency an
          install adds. To use another icon library, wrap your app in
          the installed IconProvider and override any slot — names you
          leave out keep their Lucide default:
        </p>
        <CodeBlock
          filename="providers.tsx"
          language="tsx"
          code={`import { IconProvider } from "@/lib/icon-context";
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";

<IconProvider icons={{ "chevron-right": CaretRight, "search": MagnifyingGlass }}>
  <App />
</IconProvider>`}
        />
      </div>

      <DocPager prev={prev} next={next} />
    </div>
  );
}
