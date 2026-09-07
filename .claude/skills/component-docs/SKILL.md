---
name: component-docs
description: The house structure for a component doc page in this repo — the MDX file, its frontmatter, which headings a page has in what order, and how its demos are written and named. Use when writing a new page under content/docs/, adding or changing a demo under content/demos/, reviewing an existing page, or when asked to restructure or improve component documentation.
---

# Component doc pages

A doc page is **MDX**, not TSX. Three files per component, and nothing else:

| File | Holds |
| --- | --- |
| `content/docs/<slug>.mdx` | The page body — frontmatter, headings, prose, demo tags |
| `content/demos/<slug>/*.tsx` | One real component per demo. Its own source is the code panel |
| `content/docs/<slug>.props.ts` | The `PropDef[]` arrays the API Reference renders |

The route (`app/docs/[slug]/page.tsx`) supplies the chrome: title, prev/next
arrows, the reading column. You never write a page component.

`agents/component-documentation-guidelines.md` is the companion to this file —
it covers the *mechanics* (registry entry, props-table type, the ghost-span
pattern). This file covers the *shape of the page*.

## Order of the page

The **lead demo**, then `Installation`, `Usage`, one heading per example, then
`API Reference`.

The demo comes first because it is the only thing on the page that answers "is
this the component I want" — a reader who has to scroll past an install command
to find out has been made to work for it. It carries no heading, so it stays
out of the contents rail. The reader is already looking at it.

## The skeleton

````mdx
---
description: "One sentence: what the component is and why you would reach for it."
---

import { tabsProps, listProps } from "./tabs.props";

<ComponentPreview name="tabs-demo" padding="compact" />

## Installation

<InstallTabs slug="tabs" />

## Usage

```tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
  </TabsList>
</Tabs>
```

## Basic

<ComponentPreview name="tabs-basic" />

## Sizes

The size drives the list height, the trigger padding and the indicator together.

<ComponentPreview name="tabs-sizes" align="top" minHeightClass="min-h-[280px]" />

## API Reference

### Tabs

<PropsTable props={tabsProps} />

### TabsList

<PropsTable props={listProps} />
````

`##` renders the section heading, `###` the sub-heading. Both are stamped with
an id by `rehype-slug` and picked up by `scripts/build-toc.ts`, which reads the
`##` lines out of the file. **The two derive the slug from the same
`github-slugger`** — do not hand-write heading ids.

### What is in scope without importing it

`ComponentPreview`, `InstallTabs`, `Playground`, `PropsTable`, `Step`, `Steps`.
They come from `lib/docs/mdx-components.tsx`. Import only your props file.

### Frontmatter

`description` and nothing else. One sentence, saying what the component *is*
and what makes it worth reaching for. It feeds the standfirst under the title
and the OG card.

Everything else about a component — its title, where it sits in the sidebar,
its grid size, its "new" dot — lives in `lib/docs/components.ts`, because those
describe where the page sits in the site rather than what it is. Do not add
`title` to frontmatter: the sidebar label and the page heading would become two
copies free to disagree.

## Demos

One file per demo, at `content/demos/<slug>/<slug>-<what-it-shows>.tsx`:

```tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/registry/ui/tabs";

export default function TabsBasic() {
  return (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

Rules:

- **Default export, no props.** `ComponentPreview` renders it as `<Component />`.
- **Name it `<slug>-<what-it-shows>`.** The lead demo is `<slug>-demo`.
- **Import from this repo's real path** (`@/registry/ui/tabs`), never
  `@/components/ui/tabs`. `scripts/build-demos.ts` rewrites the *displayed*
  import to the path `shadcn add` writes to, using `registry.json`'s own
  `target` fields. Pre-rewriting it breaks the build.
- **The file is the code sample.** Its source is what the reader sees in the
  code panel, so it must read as something they could paste: inline the
  constants it needs rather than reaching for a shared helper, and keep it to
  the one idea the section is about.
- Local state (`useState` for a loading toggle) belongs **inside** the demo.
- Never pass `code` to a named `<ComponentPreview>` — the demo supplies it.

Adding or renaming a demo means running `make demos`. An unknown `name=` throws
at render with the file it expected, rather than showing an empty frame.

The playground is not a demo — it is a stateful sandbox whose controls drive a
preview and a snippet together. Use `<Playground slug="button" />` and register
it in `lib/docs/PlaygroundSection.tsx`.

## Usage

The smallest complete thing a reader can paste: the import line, then the
minimal JSX, in **one fenced ```tsx block**. Never a `ComponentPreview` — the
lead demo already showed them the component, and a second live copy just pushes
the answer further down the page.

Import paths in fenced blocks are written by hand, so use the **consumer's**
path (`@/components/ui/tabs`). Only demo files get rewritten automatically.

## Examples

One **top-level** `##` per example — no `Examples` wrapper. Nesting every demo
one level down buries them all under a single contents entry, and the reader is
scanning for "Sizes", not for "Examples".

Order them so each builds on the last: the plain case, then the axes of
variation, then the states, then the compositions.

| Section | When it appears |
| --- | --- |
| `Basic` | Always. The default rendering, nothing configured. |
| `Variants` | The component has a `variant` prop. |
| `Sizes` | The component has a `size` prop. |
| `With Icons` | The component takes an icon slot. |
| `States` | Loading, disabled, error, empty — whichever it has. |
| `Controlled` | The component can be driven from outside. |
| *component-specific* | The one or two things actually interesting about it. |

Skip any that do not apply; do not invent new ones to fill the list. Each
example shows **one** thing — a preview demonstrating sizes and icons and a
loading state at once teaches none of them.

Prose under an example is a plain markdown paragraph, one or two sentences, and
only when the example encodes a decision the reader would otherwise guess. Do
not narrate what the preview already shows.

`ComponentPreview` attributes worth knowing: `padding="compact"` for a demo
that brings its own breathing room, `align="top"` for content that grows
downward, `minHeightClass` when a demo opens floating UI that needs room.

## API Reference

One `###` per exported part, in the order a reader meets them in the JSX — root
first, then children, then any hook or helper. Each holds a `PropsTable` and
nothing else, unless a prop needs a sentence the one-line `description` cannot
carry.

**A component that exports one thing gets no sub-heading** — `### Button` under
`## API Reference` only repeats what the page is already about. Go straight to
the table.

Props arrays live in `content/docs/<slug>.props.ts`:

```ts
import type { PropDef } from "@/lib/docs/PropsTable";

export const tabsProps: PropDef[] = [
  { name: "variant", type: '"default" | "underline"', default: '"default"', description: "Indicator style." },
];
```

- Every public prop, none that are internal.
- `type` is the TypeScript type as written, union members quoted.
- `default` is omitted for a required prop and for one with no meaningful
  default. "Omitted means no default" is the contract — never write `undefined`.
- `description` is one sentence, present tense, saying what the prop does, not
  what type it is. `"Fills the tray behind the triggers."` not `"A boolean."`
- A prop that changes observable *behaviour* says what the trade-off is. A
  reader deciding on `forceMount` needs to know it costs a render of every panel.

## Accessibility and Changelog

Both optional, at the end, and only when there is something specific to say.
Accessibility is usually a keyboard table; do not write one that only claims the
component is accessible. Changelog is dated `###`s, newest first, for a
component whose shipped API has changed.

## Checklist

- [ ] Three files: `<slug>.mdx`, `content/demos/<slug>/*.tsx`, `<slug>.props.ts`.
- [ ] Frontmatter has `description` and nothing else.
- [ ] Page order: lead demo → `Installation` → `Usage` → examples → `API Reference`.
- [ ] `Usage` is a fenced ```tsx block, not a `ComponentPreview`.
- [ ] Examples are top-level `##`, not nested under an `Examples` heading.
- [ ] Every demo is a default export with no props, named `<slug>-<what>`.
- [ ] Demos import `@/registry/...`; fenced blocks use `@/components/ui/...`.
- [ ] No `code` prop on a named `ComponentPreview`.
- [ ] API Reference has one `###` per exported part — or none if there is one.
- [ ] `make demos && make toc` regenerate cleanly and `make check` is green.
