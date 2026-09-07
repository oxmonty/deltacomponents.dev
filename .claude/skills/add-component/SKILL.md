---
name: add-component
description: End-to-end checklist for adding a new component to this repo — which tier it goes in, its registry.json entry, the sidebar and showcase wiring, its MDX doc page and demos, and which generators to run. Use when adding a component, publishing an existing one to the registry, or checking that a half-finished one is actually complete.
---

# Adding a component

Seven steps, in this order. Steps 1–4 make the component installable; 5–6 make
it documented; 7 is what CI checks.

If you only need the *shape of the doc page*, read the `component-docs` skill
instead — this file sequences the whole job and links out for the mechanics.

## 1. Pick a tier and write the source

| Directory | For |
| --- | --- |
| `registry/base/` | Primitive-backed — wraps Base UI (`@base-ui/react`) |
| `registry/default/` | Primitive-agnostic — owns its own behaviour |

Import siblings by their real path (`@/registry/default/...`). The registry
build rewrites those to the consumer's `@/components/ui/...` on publish, so
never hand-write a consumer path in source — it would not resolve here.

Conventions live in `agents/component-documentation-guidelines.md` — read it
before writing the source. The ones that bite: `"use client"`, `forwardRef`
with `displayName`, CVA for variants, `@/` aliases for internal imports, and
the ghost-span pattern for any text that changes weight on state.

Motion is CSS. Three duration tiers and one easing, as custom properties —
there is no animation library in this repo and nothing may add one. See
`agents/motion-guidelines.md`.

## 2. Add the registry entry

In `registry.json`, append to `items`:

```jsonc
{
  "name": "component-name",              // kebab-case, matches the doc slug
  "type": "registry:ui",                 // or registry:lib / registry:hook
  "title": "Component Name",
  "description": "One or two sentences: what it does and what is notable.",
  "dependencies": ["class-variance-authority"],
  "registryDependencies": ["utils", "shape-context"],
  "files": [
    {
      "path": "registry/default/component-name.tsx",
      "type": "registry:ui",
      "target": "components/ui/component-name.tsx"
    }
  ],
  "categories": ["components"]
}
```

Field rules:

- `dependencies` — external npm packages only, and only ones the consumer does
  not already have. A component that renders icons depends on `lucide-react`
  and nothing else; consumers bring their own set through `IconProvider`.
- `registryDependencies` — other items in *this* registry (`utils`, `motion`,
  `font-weight`, `shape-context`, `size-context`, `icon-context`, another
  component). Get these right: the CLI installs them for the consumer, and a
  missing one means a broken install rather than a compile error here.
- `target` — where `shadcn add` writes the file in the consumer's project.
  **Set it.** `scripts/build-demos.ts` reads these to rewrite the import paths
  shown in demo code panels, so a missing `target` means the docs advertise
  this repo's internal path.
- Multi-file components list every file.

## 3. Wire the sidebar and showcase

`lib/docs/components.ts` — append to `componentList`:

```ts
{ slug: "component-name", name: "ComponentName", isNew: true, gridSize: "medium" }
```

- `slug` matches the registry `name` and the MDX filename.
- `name` is the exported identifier in PascalCase; `labelOf` spaces it for
  display. Add `label` only when that derived spacing reads wrong.
- **Position in the array is the reading order** — it drives the sidebar, the
  prev/next arrows and the ←/→ shortcuts.
- `gridSize` (`large` / `medium` / `small`) sizes the showcase card.
- No `description` here — that lives in the page's frontmatter.

`app/components/bento-previews.tsx` — add a preview to `previewMap`, keyed by
slug. A component with no entry is silently skipped on the showcase.

## 4. Rebuild the published registry

```sh
make registry
```

`public/r/*.json` embeds a **copy** of each source file, so this is needed after
*any* edit to a registry file — a component or a shared lib — not just for new
ones. Commit the regenerated JSON with the source. Stale `public/r` means the
CLI installs yesterday's code.

## 5. Write the doc page

Three files. See the `component-docs` skill for the full structure:

- `content/docs/<slug>.mdx` — frontmatter `description`, then the lead demo,
  `## Installation`, `## Usage`, one `##` per example, `## API Reference`.
- `content/demos/<slug>/<slug>-<what>.tsx` — one default-exported component per
  demo, importing from this repo's real `@/registry/...` path.
- `content/docs/<slug>.props.ts` — the `PropDef[]` arrays.

No route to add: `app/docs/[slug]/page.tsx` picks the page up from
`componentList`.

## 6. Regenerate the content indexes

```sh
make demos   # content/demos/**  -> lib/docs/demos.generated.ts
make toc     # content/docs/*.mdx -> lib/docs/toc.generated.ts
```

`make dev` and `make build` run both, but `make test` fails if either committed
file has drifted — so run them before handing anything back.

## 7. Check

```sh
make check   # lint, typecheck, test
```

## Checklist

- [ ] Source in `registry/base/` or `registry/default/`, importing siblings by
      their real `@/registry/...` path.
- [ ] `registry.json` entry with `dependencies`, `registryDependencies` and a
      `target` on every file.
- [ ] `componentList` entry, positioned where it should read in the sidebar.
- [ ] `previewMap` entry in `bento-previews.tsx`.
- [ ] `make registry` run and `public/r` committed.
- [ ] `content/docs/<slug>.mdx` with a `description` in frontmatter.
- [ ] Demos under `content/demos/<slug>/`, default-exported, importing
      `@/registry/...`.
- [ ] `content/docs/<slug>.props.ts` covering every public prop.
- [ ] `make demos && make toc` run and the generated files committed.
- [ ] `make check` green.
- [ ] The page loads, the demos render, and every contents-rail link resolves.
