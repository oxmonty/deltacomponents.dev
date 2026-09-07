# Component Documentation Guidelines

Checklist and conventions for documenting every new component in this project. Following this ensures consistency across all doc pages and compatibility with the shadcn registry.

---

## Checklist for a New Component

### 1. Component Source (`registry/ui/<component-name>.tsx`)

- [ ] `"use client"` directive at the top
- [ ] TypeScript props interface extending native HTML attributes where applicable
- [ ] `forwardRef` with `displayName` set
- [ ] CVA (`class-variance-authority`) for variant/size management if the component has visual variants
- [ ] Named exports for the component, sub-components, variant helper, and props type
- [ ] Any text that changes weight on state (selected/checked/active/open) uses the **ghost-span pattern** (see below) — never animate weight on text without reserving its width
- [ ] Any animation is **CSS** — a duration tier and the shared easing, as custom properties. There is no animation library in this repo and nothing may add one (see [motion-guidelines.md](motion-guidelines.md))
- [ ] Imports siblings by their **real** path under `registry/`, never the path
  a consumer will have. `make registry` rewrites these to the consumer's
  aliases on publish, from `registry.json`'s targets and `components.json`'s
  aliases, so `@/lib/utils` written here would simply fail to resolve:
  ```ts
  import { cn } from "@/registry/lib/utils";
  import { fontWeights } from "@/registry/lib/font-weight";
  import { useShape } from "@/registry/lib/shape-context";
  import { useIcon } from "@/registry/lib/icon-context";
  import type { IconComponent } from "@/registry/lib/icon-context";
  ```
  A published component may only import other **published** modules. Anything
  under `lib/` or `app/` is the docs site's own and does not ship, so importing
  it would install a file that references code the consumer never receives.

### 2. Registry Entry (`registry.json`)

Add an item to the `items` array:

```jsonc
{
  "name": "component-name",            // kebab-case, unique
  "type": "registry:ui",               // or registry:lib / registry:hook
  "title": "Component Name",           // human-readable
  "description": "One-two sentence description of what it does and key features.",
  "dependencies": ["class-variance-authority"], // npm packages (only those not already in the project)
  "registryDependencies": ["utils"],   // other registry items this depends on
  "files": [
    { "path": "registry/ui/component-name.tsx", "type": "registry:ui" }
    // add sub-component files here if any (e.g., code-icons.tsx for code)
  ]
}
```

**Field rules:**
- `dependencies` = external npm packages (`@base-ui/react`, `lucide-react`, `class-variance-authority`)
- `registryDependencies` = other items in this registry (utils, motion, font-weight, shape-context, size-context, icon-context, surface-context, surface-classes, tokens, surfaces, or another component like button)
- **Every file needs a `target`** — where `shadcn add` writes it in the consumer's project. `scripts/build-demos.ts` reads these to rewrite the import paths shown in demo code panels, so a missing one makes the docs advertise this repo's internal path
- Components that render icons depend on `icon-context` only — never add icon packages beyond `lucide-react` as `dependencies` (consumers bring their own via IconProvider)
- Multi-file components list all files in the `files` array

### 3. Generated Registry JSON (`public/r/<component-name>.json`)

Run the registry build script (`make registry`) to generate the JSON file. It must contain:
- `$schema: "https://ui.shadcn.com/schema/registry-item.json"`
- Full source code embedded in `files[].content`
- All metadata matching `registry.json`

> **Rebuild on every source edit, not just new components.** The JSONs in `public/r/` embed a *copy* of the source, so editing any registry file — a component **or** a shared lib like `lib/font-weight.ts` — leaves the published registry stale until you re-run `make registry`. Editing a shared lib only regenerates that lib's JSON (e.g. `font-weight.json`); consumers reference it by `registryDependencies`, so they don't need rebuilding, but the lib does. Commit the regenerated JSONs alongside the source, and rebuild before any `vercel --prod` deploy.

### 4. Component List Entry (`lib/docs/components.ts`)

Add an entry to `componentList`:

```ts
{ slug: "component-name", name: "ComponentName", isNew: true, gridSize: "medium" }
```

- `slug` must match the registry `name` and the MDX filename under `content/docs/`
- `name` is the exported identifier in PascalCase; `labelOf` spaces it for display
- **Position in the array is the reading order** — sidebar, prev/next arrows and
  the ←/→ shortcuts all read it
- `gridSize` (`large` / `medium` / `small`) sizes the showcase card
- **No `description`** — that lives in the page's own frontmatter, next to the
  prose it introduces

Also add a preview to `previewMap` in `app/components/bento-previews.tsx`, keyed
by slug. A component with no entry is silently skipped on the showcase.

### 5. Documentation Page (`content/docs/<component-name>.mdx`)

The main deliverable, and it is **MDX** — there is no page component to write.
`app/docs/[slug]/page.tsx` picks the page up from `componentList` and supplies
the title, the prev/next arrows and the reading column.

Three files:

| File | Holds |
| --- | --- |
| `content/docs/<slug>.mdx` | Frontmatter `description`, headings, prose, demo tags |
| `content/demos/<slug>/<slug>-<what>.tsx` | One default-exported component per demo |
| `content/docs/<slug>.props.ts` | The `PropDef[]` arrays |

````mdx
---
description: "One sentence: what it is and why you would reach for it."
---

import { componentProps } from "./component-name.props";

<ComponentPreview name="component-name-demo" />

## Installation

<InstallTabs slug="component-name" />

## Usage

```tsx
import { ComponentName } from "@/components/ui/component-name";

<ComponentName />
```

## Basic

<ComponentPreview name="component-name-basic" />

## API Reference

<PropsTable props={componentProps} />
````

`ComponentPreview`, `InstallTabs`, `Playground`, `PropsTable`, `Step` and
`Steps` are in scope without importing them — only the props file needs an
import.

A demo imports from this repo's real path (`@/registry/ui/...`); the build
rewrites the *displayed* import to the consumer's `@/components/ui/...` using
the `target` fields in `registry.json`. Fenced blocks are hand-written, so they
use the consumer's path directly.

Run `make demos` after adding or renaming a demo, and `make toc` after adding or
renaming a heading.

**See the [component-docs skill](/agents/skills/component-docs/SKILL.md) for the
full page structure** — heading order, which example sections exist, and the
props-table rules.

### 6. Motion

If the component animates, add it to the "Where each speed shows up" table in [motion-guidelines.md](motion-guidelines.md). Pick the duration tier by the component's headline motion (small state flip → `fast`; panel/indicator that travels → `moderate`; surface that takes over the view → `slow`), enter on that tier, and exit one tier faster. See [motion-guidelines.md](motion-guidelines.md) for the full motion checklist.

---

## Animated Font Weight — the Ghost-Span Pattern

When text gets heavier on an interactive state (selected, checked, active, open, interacting), **every** instance in this project uses the same structure. A heavier weight is wider, so animating weight on a bare text node causes the layout to reflow as the user interacts. To prevent this, render an invisible "ghost" copy of the label at the **heaviest** weight to reserve the width, and overlay the visible (animating) copy in the same grid cell.

**Required structure — copy verbatim:**

```tsx
<span className="inline-grid">
  {/* Ghost: reserves width at the heaviest weight, hidden from AT */}
  <span
    className="col-start-1 row-start-1 invisible"
    style={{ fontVariationSettings: fontWeights.semibold }}
    aria-hidden="true"
  >
    {label}
  </span>
  {/* Visible: animates between weights in the same cell */}
  <span
    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
    style={{
      fontVariationSettings: isSelected
        ? fontWeights.semibold
        : fontWeights.normal,
    }}
  >
    {label}
  </span>
</span>
```

**Rules:**
- Weight comes from `fontVariationSettings` + the `fontWeights` tokens (`@/registry/lib/font-weight`), **never** `font-weight` / `fontWeight` — the design uses Inter's variable `wght` axis.
- Each `fontWeights` token also pairs in an optical-size (`opsz`) value (e.g. `"'wght' 550, 'opsz' 20"`). This is intentional, **not** a stray axis: a heavier `wght` widens the text and a tighter (higher) `opsz` pulls it back, so animating between weights keeps the advance width nearly constant — the closed→bold delta drops from ~3px to ~0.6px (≈±0.5%), centered on zero. A sub-pixel residual remains because a single opsz value can't zero every string (glyph mixes scale differently); the ghost span still pins the container, so nothing reflows regardless. `font-variation-settings` interpolates `opsz` alongside `wght` during the transition. The explicit `opsz` overrides `font-optical-sizing: auto` on purpose — weight, not font-size, drives optical size here. Always read these from the tokens; never hand-write a bare `'wght' N` string.
- The ghost span is always set to the **heaviest** weight the visible span can reach, carries `invisible` + `aria-hidden="true"`, and renders the identical content.
- Both spans share the cell via `col-start-1 row-start-1` inside an `inline-grid` (or `grid`/`inline-grid flex-1` when it must fill a row).
- The transition **must** include `font-variation-settings` in its property list (e.g. `transition-[color,font-variation-settings] duration-80`). Plain `transition-colors` / `transition-opacity` will *not* animate weight — it snaps. Use `duration-80` (the slider's value readout is the one intentional exception at `duration-100`).
- Skip the ghost span only when the weight is **static** for the lifetime of the node (e.g. table header vs body rows never change) or the element is already a **fixed-size box** (e.g. a `w-5 h-5` chip holding a single digit) — there is nothing to reflow.
- **Standard weight pairs:** resting `normal` → active `semibold` (400 → 550) is the default for selected/checked/active/open states. Use `medium` as the *resting* weight only when the component's default text is already medium and you want a smaller jump to `semibold` (e.g. ask-user options, 450 → 550). The slider's value readout is the lone `normal` → `medium` case. Don't invent new pairs — pick from these so the whole system animates at consistent magnitudes.
- **If you change the weight tokens or introduce much larger text,** re-measure and re-tune the paired `opsz` values. Method: render the label in an offscreen `<span style="font-optical-sizing:none">`, measure `getBoundingClientRect().width` at the resting `wght/opsz` vs each candidate bold `opsz`, and pick the `opsz` that centers the closed→bold width delta on zero across representative labels (longer strings dominate the perceived shift). The current values were tuned this way against real component labels.

Reference implementation: `app/components/ui/sidebar-menu.tsx` — the only
place in the repo that animates weight, and the one to copy from.

---

## Global Keyboard Shortcuts — the Mounted-Instance Registry Pattern

When a component owns a **global** key (AskUserQuestions' 1-9 digits, Sidebar's
`[` / `]` toggle), the listener must be window/document-level so the key works
without focus in the component — but doc pages mount many instances, and the
site may add its own. Without scoping, every instance answers the same
keypress. The established pattern (source: `app/components/ui/sidebar-core.tsx`
`mountedProviders`, the only implementation left in the repo):

1. **Module-level registry**: `const mountedInstances: HTMLElement[] = []`.
   Each instance pushes its root element in a mount effect and splices it out
   on unmount.
2. **Exactly one instance answers a keypress**, resolved in the global handler:
   - the instance **containing focus** (`root.contains(e.target)`) — and when
     instances can NEST (an app-shell provider wrapping doc previews), only
     the **innermost** containing instance (skip if another registered root
     inside yours also contains the target);
   - if focus is inside a *different* instance → return (that one answers);
   - if focus is outside every instance → when instances can nest, the
     **outermost** registered instance answers (the one not contained by any
     other) — do NOT use mount order for this: a persistent app-shell
     instance mounts once while doc demos mount later on client-side
     navigation, so "most recently mounted" picks a demo.
     (AskUserQuestions' flat sibling demos use most-recently-mounted, which
     is fine there because its instances never nest.)
3. **Standard guards first**: bail on `metaKey`/`ctrlKey`/`altKey` and on
   editable targets (INPUT / TEXTAREA / SELECT / `isContentEditable`).
4. **Handled arrows call `e.stopPropagation()`** so window-level listeners
   (the docs site's ←/→ page navigation in `sidebar-layout.tsx`) don't also
   fire — roles like `radiogroup`/`menu` are auto-skipped by that handler, but
   unrole'd containers (multi-select groups, `data-sidebar` menus) are not.

With this scoping in place, doc previews do NOT need to disable the shortcut —
a focused preview answers its own key while the site-level instance answers
everywhere else.

---

## Documentation Page Conventions

### Imports

- Always use `@/` path aliases, never relative paths like `../../`
- Component: `@/registry/ui/<component-name>`
- Doc utilities: `@/lib/docs/component-preview`, `@/lib/docs/props-table`, `@/lib/docs/doc-page`
- Icons: `@/registry/lib/icon-context` (`useIcon`, `useIcons` hooks, `IconComponent` type)
  - Components with internal icons: `import { useIcon } from "@/registry/lib/icon-context";`
  - Components accepting icon props: `import type { IconComponent } from "@/lib/icon-context";`
  - Doc pages: call `useIcon("icon-name")` inside the component function for each icon needed
  - Icon prop type is `IconComponent`, not `LucideIcon`
  - **Adding a new icon name**: add it to `IconName` + `defaultIcons` (Lucide) in
    `registry/ui/lib/icon-context.tsx`, **and** to all four maps in the docs-only
    `lib/docs/icon-map.tsx` (Tabler, Phosphor, HugeIcons, Untitled UI) so the site's
    library switcher keeps working
  - **Installed vs docs-only**: only the Lucide slot system ships to consumers
    (`icon-context`, deps = `lucide-react` alone). The multi-library map and the I/R
    keyboard shortcuts live in `lib/docs/` and must never be imported from `registry/`
    files — same for `document`-level key listeners in general (GitHub issue #19)

### Code Snippets

- Define as `const` string literals at the top of the file, before the component
- Use simplified import paths in snippets (e.g., `from "./components"`) since these are display-only
- Show only the relevant JSX, not full boilerplate
- Each snippet should be self-contained and copy-pasteable

### Sections

Every doc page must include these sections (in order):

1. **Feature sections** - One `<DocSection>` per distinct feature or variant group. Each wraps a `<ComponentPreview>` with:
   - `code` prop: the matching code snippet string
   - `children`: the live interactive preview
2. **API Reference** - Final section with `<PropsTable>` listing all public props

Typical section breakdown by component type:
- **Components with variants**: Variants, Sizes, With Icons, States (loading/disabled)
- **Group components**: Basic, Controlled, With descriptions/icons
- **Layout components**: Basic, Responsive, Custom content

### Props Table (`PropDef`)

```ts
interface PropDef {
  name: string;        // prop name
  type: string;        // TypeScript type as a string (use quotes for union literals)
  default?: string;    // default value as string, omit if required
  description: string; // one sentence
}
```

- List every public prop
- For sub-components with their own props, add a separate `<PropsTable>` under a sub-heading
- Use exact TypeScript union syntax: `'"primary" | "secondary"'`

### Live Previews

- Wrap interactive demos in `<div className="flex flex-wrap items-center gap-2">` (or `gap-3`, `flex-col` as needed)
- Use `useState` for interactive examples (toggles, loading states, selections)
- Keep previews focused: show the feature the section is about, nothing more

---

## Naming Conventions

| Item | Format | Example |
|---|---|---|
| Component file | kebab-case | `registry/ui/product-card.tsx` |
| Component export | PascalCase | `ProductCard` |
| Registry name | kebab-case | `product-card` |
| Doc page file | kebab-case `.mdx` | `content/docs/product-card.mdx` |
| Demo file | `<slug>-<what>.tsx` | `content/demos/product-card/product-card-basic.tsx` |
| Props file | `<slug>.props.ts` | `content/docs/product-card.props.ts` |
| Doc component list slug | kebab-case | `product-card` |
| Props type | PascalCase + Props | `ProductCardProps` |

---

## Quick Reference: File Locations

```
registry/                      ← everything `shadcn add` can install, nothing else
  ui/component-name.tsx        ← a component            → consumer's components/ui/
  lib/utils.ts                 ← `cn`                   → consumer's lib/
  lib/motion.ts                ← duration tiers + easing, as CSS custom properties
  lib/font-weight.ts           ← font weight tokens
  lib/shape-context.tsx        ← shape provider (no key shortcut — that's docs-only)
  lib/icon-context.tsx         ← icon slots, Lucide defaults, IconProvider override

app/components/                ← the site's own components, never published
  ui/                          ← primitives it uses: sidebar, scroll-area, badge
  *.tsx                        ← page chrome: header, footer, bento, right panel

lib/                           ← the site's own modules, never published
  hooks/                       ← hooks only the site uses
  theme-context.tsx, elevated.tsx, config.ts, metadata.ts, logo.ts

content/
  docs/<slug>.mdx              ← the doc page body (frontmatter + markdown)
  docs/<slug>.props.ts         ← PropDef[] arrays the API Reference renders
  demos/<slug>/*.tsx           ← one default-exported component per demo

lib/docs/
  component-preview.tsx        ← preview frame; resolves a demo by name
  props-table.tsx              ← props documentation table
  doc-page.tsx                 ← page chrome + the heading/prose roles
  mdx-components.tsx           ← what every MDX element renders as
  playground-section.tsx       ← <Playground slug="..." />, keyed sandboxes
  components.ts                ← component list: order, labels, grid size, dots
  demos.generated.ts           ← generated by `make demos` — do not edit
  toc.generated.ts             ← generated by `make toc` — do not edit
  icon-map.tsx                 ← docs-only multi-library icon map (Tabler/Phosphor/…)
  icon-playground.tsx          ← docs-only library switcher provider + "I" shortcut
  shape-shortcut.tsx           ← docs-only "R" radius shortcut

app/docs/
  layout.tsx                   ← the docs reading column
  page.tsx                     ← the introduction
  [slug]/page.tsx              ← every component page, from componentList
  contributing/page.tsx        ← the contributing section

scripts/
  build-demos.ts               ← content/demos/**  -> lib/docs/demos.generated.ts
  build-toc.ts                 ← content/docs/*.mdx -> lib/docs/toc.generated.ts

registry.json                  ← shadcn registry source of truth
public/r/<name>.json           ← generated registry JSONs
components.json                ← shadcn CLI config
```
